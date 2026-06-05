from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.db.database import get_db
from app.models.customer import Customer, CustomerSegment, CustomerStatus
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/customers", tags=["Customers"])


class CustomerCreate(BaseModel):
    company_name: str
    contact_person: str
    email: Optional[EmailStr] = None
    phone: str
    phone2: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "Uzbekistan"
    tax_id: Optional[str] = None
    segment: CustomerSegment = CustomerSegment.new
    credit_limit: float = 0
    discount_percent: float = 0
    notes: Optional[str] = None
    website: Optional[str] = None
    assigned_to: Optional[int] = None


class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    tax_id: Optional[str] = None
    segment: Optional[CustomerSegment] = None
    status: Optional[CustomerStatus] = None
    credit_limit: Optional[float] = None
    discount_percent: Optional[float] = None
    notes: Optional[str] = None
    assigned_to: Optional[int] = None


@router.get("")
async def list_customers(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    segment: Optional[CustomerSegment] = None,
    status: Optional[CustomerStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Customer)
    filters = []
    if search:
        filters.append(
            or_(
                Customer.company_name.ilike(f"%{search}%"),
                Customer.contact_person.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%"),
                Customer.phone.ilike(f"%{search}%"),
            )
        )
    if segment:
        filters.append(Customer.segment == segment)
    if status:
        filters.append(Customer.status == status)
    # Sales reps only see assigned customers
    if current_user.role == UserRole.sales_rep:
        filters.append(Customer.assigned_to == current_user.id)

    if filters:
        query = query.where(and_(*filters))

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(Customer.created_at.desc())
    result = await db.execute(query)
    customers = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size,
        "items": [
            {
                "id": c.id,
                "company_name": c.company_name,
                "contact_person": c.contact_person,
                "email": c.email,
                "phone": c.phone,
                "city": c.city,
                "segment": c.segment,
                "status": c.status,
                "credit_limit": float(c.credit_limit or 0),
                "current_balance": float(c.current_balance or 0),
                "created_at": c.created_at,
            }
            for c in customers
        ],
    }


@router.post("", status_code=201)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = Customer(**data.model_dump(), created_by=current_user.id)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return {"id": customer.id, "message": "Customer created successfully"}


@router.get("/{customer_id}")
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}")
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(customer, field, value)
    await db.commit()
    return {"message": "Customer updated successfully"}


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "sales_manager")),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer.status = CustomerStatus.inactive
    await db.commit()
    return {"message": "Customer deactivated"}


@router.get("/stats/summary")
async def customer_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = await db.execute(select(func.count(Customer.id)))
    active = await db.execute(select(func.count(Customer.id)).where(Customer.status == CustomerStatus.active))
    by_segment = await db.execute(
        select(Customer.segment, func.count(Customer.id)).group_by(Customer.segment)
    )
    return {
        "total": total.scalar(),
        "active": active.scalar(),
        "by_segment": {row[0]: row[1] for row in by_segment.all()},
    }
