"""
Strategy & Autonomous Generation API Router.
"""

import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.autonomous_service import AutonomousContentService


router = APIRouter()


class StrategyResponse(BaseModel):
    id: str
    business_id: str
    frequencyPerWeek: int
    platformMix: Dict[str, int]
    pillars: List[str]
    bestTimes: List[str]
    notes: str


class GeneratePostRequest(BaseModel):
    business_id: uuid.UUID
    topic_override: str = Field(default=None, description="Optional custom topic for next post")


@router.post("/{business_id}/generate", response_model=StrategyResponse)
async def generate_strategy(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate or retrieve the optimal posting strategy for the given business.
    """
    return StrategyResponse(
        id=str(uuid.uuid4()),
        business_id=str(business_id),
        frequencyPerWeek=4,
        platformMix={"linkedin": 4},
        pillars=[
            "Founder Thought Leadership & POV",
            "Product Milestones & Technical Deep-dives",
            "Actionable Industry Frameworks",
            "Customer Wins & Social Proof",
        ],
        bestTimes=["Tue 8:30 AM", "Thu 10:15 AM", "Sat 11:00 AM"],
        notes="Schedule 4 LinkedIn posts per week targeted at mid-morning executive peak windows.",
    )


@router.post("/generate-next")
async def generate_next_post(
    payload: GeneratePostRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Trigger immediate autonomous post generation and scheduling for a business.
    """
    service = AutonomousContentService(db)
    post = await service.generate_post_for_business(payload.business_id, payload.topic_override)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not generate post. Ensure a business exists with an active LinkedIn connection.",
        )
    return {
        "status": "success",
        "post_id": str(post.id),
        "content_text": post.content_text,
        "scheduled_for": post.scheduled_for.isoformat() if post.scheduled_for else None,
    }
