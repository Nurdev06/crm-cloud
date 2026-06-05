from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta

from app.db.database import get_db
from app.models.order import Invoice, PaymentStatus
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/invoices", tags=["Invoices"])


class InvoiceCreate(BaseModel):
    order_id: Optional[int] = None
    customer_id: int
    subtotal: float
    tax_rate: float = 12.0
    notes: Optional[str] = None
    due_days: int = 30


class PaymentRecord(BaseModel):
    amount: float
    notes: Optional[str] = None


@router.get("")
async def list_invoices(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[PaymentStatus] = None,
    customer_id: Optional[int] = None,
    overdue: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Invoice)
    filters = []
    if status:
        filters.append(Invoice.status == status)
    if customer_id:
        filters.append(Invoice.customer_id == customer_id)
    if overdue:
        filters.append(
            and_(
                Invoice.due_date < datetime.now(timezone.utc),
                Invoice.status != PaymentStatus.paid,
            )
        )
    if filters:
        query = query.where(and_(*filters))

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    query = query.offset((page - 1) * size).limit(size).order_by(Invoice.created_at.desc())
    result = await db.execute(query)
    invoices = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "customer_id": inv.customer_id,
                "status": inv.status,
                "total_amount": float(inv.total_amount or 0),
                "paid_amount": float(inv.paid_amount or 0),
                "due_date": inv.due_date,
                "created_at": inv.created_at,
            }
            for inv in invoices
        ],
    }


@router.post("", status_code=201)
async def create_invoice(
    data: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count_result = await db.execute(select(func.count(Invoice.id)))
    count = count_result.scalar() or 0
    invoice_number = f"INV-{datetime.now(timezone.utc).strftime('%Y%m')}-{count + 1:05d}"

    tax_amount = data.subtotal * data.tax_rate / 100
    total_amount = data.subtotal + tax_amount

    invoice = Invoice(
        invoice_number=invoice_number,
        order_id=data.order_id,
        customer_id=data.customer_id,
        subtotal=data.subtotal,
        tax_rate=data.tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        due_date=datetime.now(timezone.utc) + timedelta(days=data.due_days),
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return {"id": invoice.id, "invoice_number": invoice_number, "total_amount": total_amount}


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {
        "id": inv.id,
        "invoice_number": inv.invoice_number,
        "order_id": inv.order_id,
        "customer_id": inv.customer_id,
        "status": inv.status,
        "subtotal": float(inv.subtotal or 0),
        "tax_rate": float(inv.tax_rate or 0),
        "tax_amount": float(inv.tax_amount or 0),
        "total_amount": float(inv.total_amount or 0),
        "paid_amount": float(inv.paid_amount or 0),
        "due_date": inv.due_date,
        "paid_at": inv.paid_at,
        "notes": inv.notes,
        "created_at": inv.created_at,
    }


@router.post("/{invoice_id}/payment")
async def record_payment(
    invoice_id: int,
    data: PaymentRecord,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv.paid_amount = float(inv.paid_amount or 0) + data.amount
    total = float(inv.total_amount or 0)

    if inv.paid_amount >= total:
        inv.status = PaymentStatus.paid
        inv.paid_at = datetime.now(timezone.utc)
    elif inv.paid_amount > 0:
        inv.status = PaymentStatus.partial

    await db.commit()
    return {
        "message": "Payment recorded",
        "paid_amount": float(inv.paid_amount),
        "remaining": max(0, total - float(inv.paid_amount)),
        "status": inv.status,
    }


@router.get("/stats/summary")
async def invoice_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_invoiced = await db.execute(select(func.sum(Invoice.total_amount)))
    total_paid = await db.execute(select(func.sum(Invoice.paid_amount)))
    overdue_count = await db.execute(
        select(func.count(Invoice.id)).where(
            and_(
                Invoice.due_date < datetime.now(timezone.utc),
                Invoice.status != PaymentStatus.paid,
            )
        )
    )
    return {
        "total_invoiced": float(total_invoiced.scalar() or 0),
        "total_paid": float(total_paid.scalar() or 0),
        "outstanding": float((total_invoiced.scalar() or 0)) - float((total_paid.scalar() or 0)),
        "overdue_count": overdue_count.scalar(),
    }
