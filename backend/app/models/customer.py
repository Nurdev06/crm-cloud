import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum as SAEnum,
    Text, Numeric, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class CustomerSegment(str, enum.Enum):
    vip = "vip"
    regular = "regular"
    wholesale = "wholesale"
    retail = "retail"
    new = "new"
    inactive = "inactive"


class CustomerStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    blocked = "blocked"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    contact_person = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=False)
    phone2 = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), default="Uzbekistan")
    tax_id = Column(String(100), nullable=True)
    registration_number = Column(String(100), nullable=True)
    segment = Column(SAEnum(CustomerSegment), default=CustomerSegment.new)
    status = Column(SAEnum(CustomerStatus), default=CustomerStatus.active)
    credit_limit = Column(Numeric(15, 2), default=0)
    current_balance = Column(Numeric(15, 2), default=0)
    discount_percent = Column(Numeric(5, 2), default=0)
    notes = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    leads = relationship("Lead", back_populates="customer")
    orders = relationship("Order", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")
    support_tickets = relationship("SupportTicket", back_populates="customer")
    opportunities = relationship("Opportunity", back_populates="customer")
    documents = relationship("Document", primaryjoin="and_(Document.entity_type=='customer', foreign(Document.entity_id)==Customer.id)")

    __table_args__ = (
        Index("ix_customers_company_segment", "company_name", "segment"),
        Index("ix_customers_status", "status"),
    )
