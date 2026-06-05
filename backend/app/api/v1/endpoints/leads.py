from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.lead import Lead, Opportunity, LeadStage, LeadSource
from app.core.security import get_current_user
from app.models.user import User

leads_router = APIRouter(prefix="/leads", tags=["Leads"])
opportunities_router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


class LeadCreate(BaseModel):
    title: str
    first_name: str
    last_name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: LeadSource = LeadSource.other
    stage: LeadStage = LeadStage.new
    estimated_value: float = 0
    notes: Optional[str] = None
    assigned_to: Optional[int] = None


class LeadUpdate(BaseModel):
    title: Optional[str] = None
    stage: Optional[LeadStage] = None
    score: Optional[int] = None
    estimated_value: Optional[float] = None
    notes: Optional[str] = None
    assigned_to: Optional[int] = None


class OpportunityCreate(BaseModel):
    title: str
    customer_id: int
    lead_id: Optional[int] = None
    stage: LeadStage = LeadStage.new
    value: float = 0
    probability: int = 10
    expected_close_date: Optional[datetime] = None
    notes: Optional[str] = None
    assigned_to: Optional[int] = None


@leads_router.get("")
async def list_leads(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    stage: Optional[LeadStage] = None,
    search: Optional[str] = None,
    assigned_to: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Lead)
    filters = [Lead.is_converted == False]
    if stage:
        filters.append(Lead.stage == stage)
    if search:
        filters.append(
            or_(
                Lead.first_name.ilike(f"%{search}%"),
                Lead.last_name.ilike(f"%{search}%"),
                Lead.company.ilike(f"%{search}%"),
                Lead.email.ilike(f"%{search}%"),
            )
        )
    if assigned_to:
        filters.append(Lead.assigned_to == assigned_to)
    query = query.where(and_(*filters))

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    query = query.offset((page - 1) * size).limit(size).order_by(Lead.created_at.desc())
    result = await db.execute(query)
    leads = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [
            {
                "id": l.id,
                "title": l.title,
                "name": f"{l.first_name} {l.last_name}",
                "company": l.company,
                "email": l.email,
                "phone": l.phone,
                "source": l.source,
                "stage": l.stage,
                "score": l.score,
                "estimated_value": float(l.estimated_value or 0),
                "created_at": l.created_at,
            }
            for l in leads
        ],
    }


@leads_router.post("", status_code=201)
async def create_lead(
    data: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = Lead(**data.model_dump(), created_by=current_user.id)
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return {"id": lead.id, "message": "Lead created"}


@leads_router.put("/{lead_id}")
async def update_lead(
    lead_id: int,
    data: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lead, field, value)
    await db.commit()
    return {"message": "Lead updated"}


@leads_router.patch("/{lead_id}/convert")
async def convert_lead(
    lead_id: int,
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.is_converted = True
    lead.converted_at = datetime.now(timezone.utc)
    lead.customer_id = customer_id
    lead.stage = LeadStage.won
    await db.commit()
    return {"message": "Lead converted to customer"}


# ─── Opportunities ─────────────────────────────────────────────────────────────
@opportunities_router.get("")
async def list_opportunities(
    stage: Optional[LeadStage] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Opportunity)
    if stage:
        query = query.where(Opportunity.stage == stage)
    result = await db.execute(query.order_by(Opportunity.created_at.desc()))
    opps = result.scalars().all()
    return [
        {
            "id": o.id,
            "title": o.title,
            "customer_id": o.customer_id,
            "stage": o.stage,
            "value": float(o.value or 0),
            "probability": o.probability,
            "expected_close_date": o.expected_close_date,
            "created_at": o.created_at,
        }
        for o in opps
    ]


@opportunities_router.post("", status_code=201)
async def create_opportunity(
    data: OpportunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    opp = Opportunity(**data.model_dump(), created_by=current_user.id)
    db.add(opp)
    await db.commit()
    await db.refresh(opp)
    return {"id": opp.id, "message": "Opportunity created"}


@opportunities_router.patch("/{opp_id}/stage")
async def update_opportunity_stage(
    opp_id: int,
    stage: LeadStage,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Opportunity).where(Opportunity.id == opp_id))
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    opp.stage = stage
    if stage in [LeadStage.won, LeadStage.lost]:
        opp.actual_close_date = datetime.now(timezone.utc)
    await db.commit()
    return {"message": f"Stage updated to {stage}"}
