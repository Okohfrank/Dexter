"""API Router aggregation."""
from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.oauth import router as oauth_router
from app.api.publishing import router as publishing_router
from app.api.chat import router as chat_router
from app.api.business import router as business_router
from app.api.strategy import router as strategy_router
from app.api.analytics import router as analytics_router
from app.api.voice import router as voice_router
from app.api.media import router as media_router
from app.api.notifications import router as notifications_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(oauth_router, prefix="/oauth", tags=["OAuth"])
api_router.include_router(publishing_router, prefix="/publish", tags=["Publishing"])
api_router.include_router(chat_router, prefix="/chat", tags=["Conversational AI"])
api_router.include_router(business_router, prefix="/businesses", tags=["Businesses"])
api_router.include_router(strategy_router, prefix="/strategy", tags=["Strategy & Planning"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics & Growth"])
api_router.include_router(voice_router, prefix="/voice", tags=["Voice Engine"])
api_router.include_router(media_router, prefix="/media", tags=["Media & Visuals"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Push Notifications"])
