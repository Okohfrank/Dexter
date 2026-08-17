"""API Router aggregation."""
from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.oauth import router as oauth_router
from app.api.publishing import router as publishing_router
from app.api.chat import router as chat_router
from app.api.business import router as business_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(oauth_router, prefix="/oauth", tags=["OAuth"])
api_router.include_router(publishing_router, prefix="/publish", tags=["Publishing"])
api_router.include_router(chat_router, prefix="/chat", tags=["Conversational AI"])
api_router.include_router(business_router, prefix="/businesses", tags=["Businesses"])
