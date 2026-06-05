from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, update
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.product import Inventory
from app.core.security import get_current_user, require_roles
from app.models.user import User

router = APIRouter(prefix="/orders", tags=["Orders"])


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    discount_percent: float = 0


class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemIn]
    discount_amount: float = 0
    shipping_cost: float = 0
    notes: Optional[str] = None
    shipping_address: Optional[str] = None


from sqlalchemy.orm import selectinload

@router.get("")
async def list_orders(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = None,
    customer_id: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Order).options(
        selectinload(Order.customer),
        selectinload(Order.items).selectinload(OrderItem.product)
    )
    filters = []
    if status:
        filters.append(Order.status == status)
    if customer_id:
        filters.append(Order.customer_id == customer_id)
    if search:
        filters.append(Order.order_number.ilike(f"%{search}%"))
    if filters:
        query = query.where(and_(*filters))

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    query = query.offset((page - 1) * size).limit(size).order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size,
        "items": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_id": o.customer_id,
                "customer_name": o.customer.company_name if o.customer else f"Customer #{o.customer_id}",
                "status": o.status,
                "payment_status": o.payment_status,
                "total_amount": float(o.total_amount or 0),
                "created_at": o.created_at,
                "items": [
                    {
                        "product_id": item.product_id,
                        "product_name": item.product.name if item.product else f"Product #{item.product_id}",
                        "quantity": item.quantity,
                        "unit_price": float(item.unit_price),
                    }
                    for item in o.items
                ]
            }
            for o in orders
        ],
    }


@router.post("", status_code=201)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Generate order number
    count_result = await db.execute(select(func.count(Order.id)))
    count = count_result.scalar() or 0
    order_number = f"ORD-{datetime.now(timezone.utc).strftime('%Y%m')}-{count + 1:05d}"

    # Calculate totals
    subtotal = sum(
        item.quantity * item.unit_price * (1 - item.discount_percent / 100)
        for item in data.items
    )
    tax_amount = subtotal * 0.12  # 12% VAT
    total_amount = subtotal + tax_amount + data.shipping_cost - data.discount_amount

    order = Order(
        order_number=order_number,
        customer_id=data.customer_id,
        subtotal=subtotal,
        discount_amount=data.discount_amount,
        tax_amount=tax_amount,
        shipping_cost=data.shipping_cost,
        total_amount=total_amount,
        notes=data.notes,
        shipping_address=data.shipping_address,
        created_by=current_user.id,
    )
    db.add(order)
    await db.flush()  # Get order.id

    for item in data.items:
        total_price = item.quantity * item.unit_price * (1 - item.discount_percent / 100)
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_percent=item.discount_percent,
            total_price=total_price,
        )
        db.add(order_item)

    await db.commit()
    return {"id": order.id, "order_number": order_number, "total_amount": total_amount}


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    items = items_result.scalars().all()

    return {
        "id": order.id,
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        "status": order.status,
        "payment_status": order.payment_status,
        "subtotal": float(order.subtotal or 0),
        "discount_amount": float(order.discount_amount or 0),
        "tax_amount": float(order.tax_amount or 0),
        "shipping_cost": float(order.shipping_cost or 0),
        "total_amount": float(order.total_amount or 0),
        "notes": order.notes,
        "created_at": order.created_at,
        "items": [
            {
                "id": i.id,
                "product_id": i.product_id,
                "quantity": i.quantity,
                "unit_price": float(i.unit_price),
                "total_price": float(i.total_price),
            }
            for i in items
        ],
    }


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    new_status: OrderStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = new_status
    if new_status == OrderStatus.approved:
        order.approved_by = current_user.id
        order.approved_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": f"Order status updated to {new_status}"}


@router.get("/stats/summary")
async def order_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = await db.execute(select(func.count(Order.id)))
    pending = await db.execute(select(func.count(Order.id)).where(Order.status == OrderStatus.pending))
    revenue = await db.execute(select(func.sum(Order.total_amount)).where(Order.status == OrderStatus.delivered))
    by_status = await db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    )
    return {
        "total_orders": total.scalar(),
        "pending_orders": pending.scalar(),
        "total_revenue": float(revenue.scalar() or 0),
        "by_status": {row[0]: row[1] for row in by_status.all()},
    }
