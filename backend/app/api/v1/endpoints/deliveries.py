from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.support import Delivery, DeliveryStatus
from app.models.order import Order
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


class DeliveryCreate(BaseModel):
    order_id: int
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_number: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    shipping_address: Optional[str] = None
    notes: Optional[str] = None


class DeliveryUpdate(BaseModel):
    status: Optional[DeliveryStatus] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_number: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    tracking_url: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
async def list_deliveries(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[DeliveryStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Delivery)
    if status:
        query = query.where(Delivery.status == status)
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    query = query.offset((page - 1) * size).limit(size).order_by(Delivery.created_at.desc())
    result = await db.execute(query)
    deliveries = result.scalars().all()
    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [
            {
                "id": d.id,
                "delivery_number": d.delivery_number,
                "order_id": d.order_id,
                "status": d.status,
                "driver_name": d.driver_name,
                "driver_phone": d.driver_phone,
                "vehicle_number": d.vehicle_number,
                "scheduled_at": d.scheduled_at,
                "delivered_at": d.delivered_at,
            }
            for d in deliveries
        ],
    }


@router.post("", status_code=201)
async def create_delivery(
    data: DeliveryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count_result = await db.execute(select(func.count(Delivery.id)))
    count = count_result.scalar() or 0
    delivery_number = f"DLV-{datetime.now(timezone.utc).strftime('%Y%m')}-{count + 1:05d}"

    delivery = Delivery(
        delivery_number=delivery_number,
        order_id=data.order_id,
        driver_name=data.driver_name,
        driver_phone=data.driver_phone,
        vehicle_number=data.vehicle_number,
        scheduled_at=data.scheduled_at,
        shipping_address=data.shipping_address,
        notes=data.notes,
        assigned_by=current_user.id,
    )
    db.add(delivery)
    await db.commit()
    await db.refresh(delivery)
    return {"id": delivery.id, "delivery_number": delivery_number}


@router.get("/{delivery_id}")
async def get_delivery(
    delivery_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).where(Delivery.id == delivery_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return d


@router.put("/{delivery_id}")
async def update_delivery(
    delivery_id: int,
    data: DeliveryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).where(Delivery.id == delivery_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Delivery not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(d, field, value)
    if data.status == DeliveryStatus.in_transit:
        d.picked_up_at = datetime.now(timezone.utc)
    elif data.status == DeliveryStatus.delivered:
        d.delivered_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Delivery updated"}


@router.patch("/{delivery_id}/gps")
async def update_gps(
    delivery_id: int,
    lat: float,
    lng: float,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Delivery).where(Delivery.id == delivery_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Delivery not found")
    d.gps_lat = lat
    d.gps_lng = lng
    await db.commit()
    return {"message": "GPS updated", "lat": lat, "lng": lng}
