from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.customers import router as customers_router
from app.api.v1.endpoints.leads import leads_router, opportunities_router
from app.api.v1.endpoints.products import router as products_router, inventory_router
from app.api.v1.endpoints.orders import router as orders_router
from app.api.v1.endpoints.deliveries import router as deliveries_router
from app.api.v1.endpoints.invoices import router as invoices_router
from app.api.v1.endpoints.support import router as support_router
from app.api.v1.endpoints.analytics import router as analytics_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(customers_router)
api_router.include_router(leads_router)
api_router.include_router(opportunities_router)
api_router.include_router(products_router)
api_router.include_router(inventory_router)
api_router.include_router(orders_router)
api_router.include_router(deliveries_router)
api_router.include_router(invoices_router)
api_router.include_router(support_router)
api_router.include_router(analytics_router)
