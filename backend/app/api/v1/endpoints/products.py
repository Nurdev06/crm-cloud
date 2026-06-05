from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.product import Product, Inventory, Warehouse, StockMovement, ProductCategory
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/products", tags=["Products"])


class ProductCreate(BaseModel):
    sku: str
    product_code: str
    name: str
    description: Optional[str] = None
    category: ProductCategory = ProductCategory.other
    brand: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    supplier: Optional[str] = None
    purchase_price: float
    selling_price: float
    min_stock_level: int = 10
    barcode: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    brand: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    supplier: Optional[str] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    min_stock_level: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("")
async def list_products(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[ProductCategory] = None,
    is_active: Optional[bool] = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Product, func.coalesce(func.sum(Inventory.quantity), 0).label("total_stock"))
        .outerjoin(Inventory, Product.id == Inventory.product_id)
        .group_by(Product.id)
    )
    filters = []
    if search:
        filters.append(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
                Product.brand.ilike(f"%{search}%"),
            )
        )
    if category:
        filters.append(Product.category == category)
    if is_active is not None:
        filters.append(Product.is_active == is_active)
    if filters:
        query = query.where(and_(*filters))

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Apply pagination and sorting on the subquery / grouped query
    query = query.offset((page - 1) * size).limit(size).order_by(Product.created_at.desc())
    result = await db.execute(query)
    rows = result.all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size,
        "items": [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "category": p.category,
                "brand": p.brand,
                "size": p.size,
                "color": p.color,
                "wholesale_price": float(p.selling_price),
                "retail_price": float(p.selling_price) * 1.5,
                "selling_price": float(p.selling_price),
                "purchase_price": float(p.purchase_price),
                "is_active": p.is_active,
                "image_urls": p.image_urls,
                "total_stock": int(total_stock),
                "min_stock_alert": p.min_stock_level,
                "updated_at": p.updated_at,
            }
            for p, total_stock in rows
        ],
    }


@router.post("", status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check unique SKU
    existing = await db.execute(select(Product).where(Product.sku == data.sku))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"SKU '{data.sku}' already exists")

    product = Product(**data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return {"id": product.id, "message": "Product created"}


@router.get("/{product_id}")
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get inventory
    inv_result = await db.execute(
        select(Inventory, Warehouse)
        .join(Warehouse, Inventory.warehouse_id == Warehouse.id)
        .where(Inventory.product_id == product_id)
    )
    inventory = inv_result.all()

    return {
        "id": product.id,
        "sku": product.sku,
        "product_code": product.product_code,
        "name": product.name,
        "description": product.description,
        "category": product.category,
        "brand": product.brand,
        "size": product.size,
        "color": product.color,
        "material": product.material,
        "supplier": product.supplier,
        "purchase_price": float(product.purchase_price),
        "selling_price": float(product.selling_price),
        "min_stock_level": product.min_stock_level,
        "is_active": product.is_active,
        "barcode": product.barcode,
        "image_urls": product.image_urls,
        "tags": product.tags,
        "inventory": [
            {
                "warehouse_name": row[1].name,
                "quantity": row[0].quantity,
                "reserved": row[0].reserved_quantity,
                "available": row[0].quantity - row[0].reserved_quantity,
                "location": row[0].location_code,
            }
            for row in inventory
        ],
        "created_at": product.created_at,
    }


@router.put("/{product_id}")
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    await db.commit()
    return {"message": "Product updated"}


# ─── Inventory endpoints ───────────────────────────────────────────────────────
inventory_router = APIRouter(prefix="/inventory", tags=["Inventory"])


@inventory_router.get("")
async def list_inventory(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    warehouse_id: Optional[int] = None,
    low_stock: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Inventory, Product, Warehouse)
        .join(Product, Inventory.product_id == Product.id)
        .join(Warehouse, Inventory.warehouse_id == Warehouse.id)
    )
    if warehouse_id:
        query = query.where(Inventory.warehouse_id == warehouse_id)
    if low_stock:
        query = query.where(Inventory.quantity <= Product.min_stock_level)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    rows = result.all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [
            {
                "id": row[0].id,
                "product_id": row[0].product_id,
                "product_name": row[1].name,
                "product_sku": row[1].sku,
                "warehouse_name": row[2].name,
                "quantity": row[0].quantity,
                "reserved_quantity": row[0].reserved_quantity,
                "available_quantity": row[0].quantity - row[0].reserved_quantity,
                "location_code": row[0].location_code,
                "batch_number": row[0].batch_number,
            }
            for row in rows
        ],
    }


@inventory_router.patch("/{inventory_id}/adjust")
async def adjust_stock(
    inventory_id: int,
    quantity: int,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Inventory).where(Inventory.id == inventory_id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    old_qty = inv.quantity
    inv.quantity = quantity

    # Record movement
    movement = StockMovement(
        product_id=inv.product_id,
        to_warehouse_id=inv.warehouse_id,
        quantity=quantity - old_qty,
        movement_type="adjustment",
        notes=notes,
        performed_by=current_user.id,
    )
    db.add(movement)
    await db.commit()
    return {"message": "Stock adjusted", "old_quantity": old_qty, "new_quantity": quantity}
