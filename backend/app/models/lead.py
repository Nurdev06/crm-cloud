import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, Enum as SAEnum,
    Text, Numeric, ForeignKey, Boolean, Index
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class LeadStage(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal_sent = "proposal_sent"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"


class LeadSource(str, enum.Enum):
    website = "website"
    referral = "referral"
    cold_call = "cold_call"
    exhibition = "exhibition"
    social_media = "social_media"
    other = "other"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    company = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    source = Column(SAEnum(LeadSource), default=LeadSource.other)
    stage = Column(SAEnum(LeadStage), default=LeadStage.new, index=True)
    score = Column(Integer, default=0)  # 0-100 lead score
    estimated_value = Column(Numeric(15, 2), default=0)
    notes = Column(Text, nullable=True)
    is_converted = Column(Boolean, default=False)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("Customer", back_populates="leads")
    assigned_to_user = relationship("User", back_populates="assigned_leads", foreign_keys=[assigned_to])
    opportunities = relationship("Opportunity", back_populates="lead")

    __table_args__ = (
        Index("ix_leads_stage_assigned", "stage", "assigned_to"),
    )


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    stage = Column(SAEnum(LeadStage), default=LeadStage.new, index=True)
    value = Column(Numeric(15, 2), default=0)
    probability = Column(Integer, default=10)  # 0-100%
    expected_close_date = Column(DateTime(timezone=True), nullable=True)
    actual_close_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("Customer", back_populates="opportunities")
    lead = relationship("Lead", back_populates="opportunities")

    __table_args__ = (
        Index("ix_opportunities_stage_assigned", "stage", "assigned_to"),
    )
