import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, Enum as SAEnum,
    Text, Numeric, ForeignKey, Boolean, Index, JSON
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class ProductCategory(str, enum.Enum):
    shirts = "shirts"
    pants = "pants"
    dresses = "dresses"
    jackets = "jackets"
    suits = "suits"
    sportswear = "sportswear"
    underwear = "underwear"
    accessories = "accessories"
    other = "other"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    product_code = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(SAEnum(ProductCategory), default=ProductCategory.other)
    brand = Column(String(100), nullable=True)
    size = Column(String(50), nullable=True)       # XS,S,M,L,XL,XXL
    color = Column(String(50), nullable=True)
    material = Column(String(100), nullable=True)
    supplier = Column(String(255), nullable=True)
    purchase_price = Column(Numeric(15, 2), nullable=False, default=0)
    selling_price = Column(Numeric(15, 2), nullable=False, default=0)
    min_stock_level = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    barcode = Column(String(100), nullable=True, index=True)
    qr_code = Column(String(100), nullable=True)
    image_urls = Column(JSON, default=list)  # List of S3 URLs
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    inventory_records = relationship("Inventory", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")

    __table_args__ = (
        Index("ix_products_category_active", "category", "is_active"),
    )


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    capacity = Column(Integer, nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    inventory_records = relationship("Inventory", back_populates="warehouse")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0)  # Reserved for orders
    batch_number = Column(String(100), nullable=True)
    location_code = Column(String(100), nullable=True)  # Shelf/rack location
    last_counted_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    product = relationship("Product", back_populates="inventory_records")
    warehouse = relationship("Warehouse", back_populates="inventory_records")

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

    __table_args__ = (
        Index("ix_inventory_product_warehouse", "product_id", "warehouse_id"),
    )


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    movement_type = Column(String(50), nullable=False)  # in, out, transfer, adjustment
    reference = Column(String(255), nullable=True)  # Order ID, etc.
    notes = Column(Text, nullable=True)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
