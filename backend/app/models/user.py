import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum as SAEnum,
    Text, Numeric, ForeignKey, JSON, BigInteger, Index
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    sales_manager = "sales_manager"
    sales_rep = "sales_rep"
    warehouse_manager = "warehouse_manager"
    logistics_manager = "logistics_manager"
    customer_support = "customer_support"
    finance_manager = "finance_manager"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.sales_rep)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    assigned_leads = relationship("Lead", back_populates="assigned_to_user", foreign_keys="Lead.assigned_to")
    created_orders = relationship("Order", back_populates="created_by_user", foreign_keys="Order.created_by")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

    __table_args__ = (
        Index("ix_users_email_active", "email", "is_active"),
    )
