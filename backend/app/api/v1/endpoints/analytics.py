from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, extract
from typing import Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from app.db.database import get_db
from app.models.order import Order, OrderStatus
from app.models.customer import Customer, CustomerStatus
from app.models.lead import Lead, LeadStage
from app.models.product import Inventory, Product
from app.models.support import SupportTicket, TicketStatus
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
    last_month_end = this_month_start

    # Revenue this month
    revenue_result = await db.execute(
        select(func.sum(Order.total_amount)).where(
            and_(Order.status == OrderStatus.delivered, Order.created_at >= this_month_start)
        )
    )
    revenue_this_month = float(revenue_result.scalar() or 0)

    # Revenue last month
    revenue_last = await db.execute(
        select(func.sum(Order.total_amount)).where(
            and_(
                Order.status == OrderStatus.delivered,
                Order.created_at >= last_month_start,
                Order.created_at < last_month_end,
            )
        )
    )
    revenue_last_month = float(revenue_last.scalar() or 0)

    # Total orders
    total_orders = await db.execute(select(func.count(Order.id)))
    pending_orders = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.pending)
    )

    # Active customers
    active_customers = await db.execute(
        select(func.count(Customer.id)).where(Customer.status == CustomerStatus.active)
    )

    # Active leads
    active_leads = await db.execute(
        select(func.count(Lead.id)).where(Lead.is_converted == False)
    )

    # Open tickets
    open_tickets = await db.execute(
        select(func.count(SupportTicket.id)).where(
            SupportTicket.status.in_([TicketStatus.open, TicketStatus.in_progress])
        )
    )

    # Low stock products
    low_stock = await db.execute(
        select(func.count(Inventory.id)).where(Inventory.quantity <= 10)
    )

    # Revenue growth
    revenue_growth = (
        ((revenue_this_month - revenue_last_month) / revenue_last_month * 100)
        if revenue_last_month > 0
        else 0
    )

    return {
        "revenue": {
            "this_month": revenue_this_month,
            "last_month": revenue_last_month,
            "growth_percent": round(revenue_growth, 1),
        },
        "orders": {
            "total": total_orders.scalar(),
            "pending": pending_orders.scalar(),
        },
        "customers": {
            "active": active_customers.scalar(),
        },
        "leads": {
            "active": active_leads.scalar(),
        },
        "support": {
            "open_tickets": open_tickets.scalar(),
        },
        "inventory": {
            "low_stock_items": low_stock.scalar(),
        },
    }


@router.get("/revenue/trend")
async def revenue_trend(
    months: int = Query(12, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Monthly revenue for the last N months."""
    now = datetime.now(timezone.utc)
    results = []
    for i in range(months - 1, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        if i == 0:
            month_end = now
        else:
            next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
            month_end = next_month

        rev = await db.execute(
            select(func.sum(Order.total_amount)).where(
                and_(
                    Order.status == OrderStatus.delivered,
                    Order.created_at >= month_start,
                    Order.created_at < month_end,
                )
            )
        )
        results.append({
            "month": month_start.strftime("%b %Y"),
            "revenue": float(rev.scalar() or 0),
        })
    return results


@router.get("/orders/by-status")
async def orders_by_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    )
    return [{"status": row[0], "count": row[1]} for row in result.all()]


@router.get("/leads/pipeline")
async def leads_pipeline(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Lead.stage, func.count(Lead.id), func.sum(Lead.estimated_value))
        .group_by(Lead.stage)
    )
    return [
        {
            "stage": row[0],
            "count": row[1],
            "value": float(row[2] or 0),
        }
        for row in result.all()
    ]


@router.get("/products/top")
async def top_products(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.order import OrderItem
    result = await db.execute(
        select(
            Product.name,
            Product.sku,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.total_price).label("total_revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.id, Product.name, Product.sku)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )
    return [
        {
            "name": row[0],
            "sku": row[1],
            "total_sold": int(row[2] or 0),
            "total_revenue": float(row[3] or 0),
        }
        for row in result.all()
    ]


@router.get("/customers/growth")
async def customer_growth(
    months: int = Query(6, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    results = []
    for i in range(months - 1, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        if i == 0:
            month_end = now
        else:
            month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)

        count = await db.execute(
            select(func.count(Customer.id)).where(
                and_(Customer.created_at >= month_start, Customer.created_at < month_end)
            )
        )
        results.append({
            "month": month_start.strftime("%b %Y"),
            "new_customers": count.scalar(),
        })
    return results
