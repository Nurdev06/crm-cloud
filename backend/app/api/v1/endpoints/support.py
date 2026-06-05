from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta

from app.db.database import get_db
from app.models.support import SupportTicket, TicketStatus, TicketPriority, TicketResponse
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/support", tags=["Support"])


class TicketCreate(BaseModel):
    customer_id: int
    subject: str
    description: Optional[str] = None
    priority: TicketPriority = TicketPriority.medium
    category: Optional[str] = None


class TicketResponseCreate(BaseModel):
    message: str
    is_internal: bool = False


from sqlalchemy.orm import selectinload

@router.get("")
async def list_tickets(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(SupportTicket).options(selectinload(SupportTicket.customer))
    filters = []
    if status:
        filters.append(SupportTicket.status == status)
    if priority:
        filters.append(SupportTicket.priority == priority)
    if search:
        filters.append(
            or_(
                SupportTicket.subject.ilike(f"%{search}%"),
                SupportTicket.ticket_number.ilike(f"%{search}%"),
            )
        )
    if filters:
        query = query.where(and_(*filters))

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    query = query.offset((page - 1) * size).limit(size).order_by(SupportTicket.created_at.desc())
    result = await db.execute(query)
    tickets = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [
            {
                "id": t.id,
                "ticket_number": t.ticket_number,
                "customer_id": t.customer_id,
                "customer_name": t.customer.company_name if t.customer else f"Customer #{t.customer_id}",
                "subject": t.subject,
                "status": t.status,
                "priority": t.priority,
                "category": t.category,
                "sla_due_at": t.sla_due_at,
                "created_at": t.created_at,
            }
            for t in tickets
        ],
    }


@router.post("", status_code=201)
async def create_ticket(
    data: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count_result = await db.execute(select(func.count(SupportTicket.id)))
    count = count_result.scalar() or 0
    ticket_number = f"TKT-{datetime.now(timezone.utc).strftime('%Y%m')}-{count + 1:05d}"

    # SLA based on priority
    sla_hours = {"low": 72, "medium": 24, "high": 8, "critical": 2}
    sla_due = datetime.now(timezone.utc) + timedelta(hours=sla_hours.get(data.priority, 24))

    ticket = SupportTicket(
        ticket_number=ticket_number,
        customer_id=data.customer_id,
        subject=data.subject,
        description=data.description,
        priority=data.priority,
        category=data.category,
        sla_due_at=sla_due,
        created_by=current_user.id,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return {"id": ticket.id, "ticket_number": ticket_number}


@router.get("/{ticket_id}")
async def get_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    responses_result = await db.execute(
        select(TicketResponse).where(TicketResponse.ticket_id == ticket_id).order_by(TicketResponse.created_at)
    )
    responses = responses_result.scalars().all()
    return {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "customer_id": ticket.customer_id,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
        "sla_due_at": ticket.sla_due_at,
        "created_at": ticket.created_at,
        "responses": [
            {
                "id": r.id,
                "message": r.message,
                "is_internal": r.is_internal,
                "created_by": r.created_by,
                "created_at": r.created_at,
            }
            for r in responses
        ],
    }


@router.post("/{ticket_id}/responses")
async def add_response(
    ticket_id: int,
    data: TicketResponseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    response = TicketResponse(
        ticket_id=ticket_id,
        message=data.message,
        is_internal=data.is_internal,
        created_by=current_user.id,
    )
    db.add(response)
    ticket.status = TicketStatus.in_progress
    await db.commit()
    return {"message": "Response added"}


@router.patch("/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: int,
    new_status: TicketStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = new_status
    if new_status == TicketStatus.resolved:
        ticket.resolved_at = datetime.now(timezone.utc)
    elif new_status == TicketStatus.closed:
        ticket.closed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": f"Ticket status updated to {new_status}"}
