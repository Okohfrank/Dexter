"""
Analytics and Post History API Router.
"""

import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.analytics_service import AnalyticsService


router = APIRouter()


@router.get("/history")
async def get_publish_history(
    business_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get published post history with linked analytics engagement performance.
    """
    service = AnalyticsService(db)
    return await service.get_published_posts_with_metrics(business_id)


@router.get("/learnings")
async def get_learning_insights(
    business_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get plain-language AI learning reflections tied to business goals.
    """
    service = AnalyticsService(db)
    return await service.generate_learning_insights(business_id)
