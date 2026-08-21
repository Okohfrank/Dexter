"""
Push Notifications API Router.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.notification_service import NotificationService

router = APIRouter()


class RegisterTokenRequest(BaseModel):
    push_token: str


class TestNotificationRequest(BaseModel):
    title: Optional[str] = "Dexter Notification"
    body: Optional[str] = "Dexter autonomous agent test alert."


@router.post("/register-token")
async def register_push_token(
    payload: RegisterTokenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register Expo push token for authenticated user."""
    service = NotificationService(db)
    success = await service.register_push_token(current_user.id, payload.push_token)
    return {"status": "registered", "success": success}


@router.post("/test")
async def send_test_notification(
    payload: TestNotificationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger a test notification to verify delivery."""
    service = NotificationService(db)
    res = await service.send_push_notification(
        push_tokens=["ExponentPushToken[mock_founder_token]"],
        title=payload.title or "Dexter Notification",
        body=payload.body or "Your autonomous brand employee is active.",
    )
    return res
