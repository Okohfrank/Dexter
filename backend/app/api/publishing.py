"""Publishing router."""
import uuid
from fastapi import APIRouter, Depends

from app.api.deps import get_publishing_service, get_current_user
from app.services.publishing_service import PublishingService
from app.schemas.publishing import PublishRequest, PublishResponse, PostStatusResponse
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=PublishResponse)
async def publish(
    request: PublishRequest,
    publishing_service: PublishingService = Depends(get_publishing_service),
    current_user: User = Depends(get_current_user)
) -> PublishResponse:
    return await publishing_service.publish(current_user.id, request)

@router.get("/{post_id}/status", response_model=PostStatusResponse)
async def get_post_status(
    post_id: uuid.UUID,
    publishing_service: PublishingService = Depends(get_publishing_service),
    current_user: User = Depends(get_current_user)
) -> PostStatusResponse:
    return await publishing_service.get_post_status(post_id, current_user.id)

@router.get("/account/{connected_account_id}")
async def get_scheduled_posts(
    connected_account_id: uuid.UUID,
    publishing_service: PublishingService = Depends(get_publishing_service),
    current_user: User = Depends(get_current_user)
):
    """List all scheduled posts for frontend plans/schedule page."""
    posts = await publishing_service.get_scheduled_posts(connected_account_id)
    return [
        {
            "id": p.id,
            "content_text": p.content_text,
            "scheduled_for": p.scheduled_for,
            "status": p.status,
            "platform_post_type": p.platform_post_type,
        }
        for p in posts
    ]

@router.put("/{post_id}")
async def update_scheduled_post(
    post_id: uuid.UUID,
    content_text: str = None,
    scheduled_for: str = None,
    platform: str = None,
    publishing_service: PublishingService = Depends(get_publishing_service),
    current_user: User = Depends(get_current_user)
):
    """User edit/override of a scheduled post."""
    from datetime import datetime
    parsed_dt = None
    if scheduled_for:
        try:
            parsed_dt = datetime.fromisoformat(scheduled_for.replace("Z", "+00:00"))
        except Exception:
            pass
    updated = await publishing_service.update_scheduled_post(
        post_id,
        content_text=content_text,
        scheduled_for=parsed_dt,
        platform=platform,
    )
    return {
        "id": updated.id,
        "content_text": updated.content_text,
        "scheduled_for": updated.scheduled_for,
        "platform_post_type": updated.platform_post_type,
        "status": updated.status,
    }

@router.post("/{post_id}/publish-now")
async def publish_now_override(
    post_id: uuid.UUID,
    publishing_service: PublishingService = Depends(get_publishing_service),
    current_user: User = Depends(get_current_user)
):
    """Urgent override: publish a queued post immediately right now!"""
    return await publishing_service.execute_publish(post_id)

@router.delete("/{post_id}")
async def cancel_post(
    post_id: uuid.UUID,
    publishing_service: PublishingService = Depends(get_publishing_service),
    current_user: User = Depends(get_current_user)
) -> dict:
    await publishing_service.cancel_post(post_id, current_user.id)
    return {"message": "Post cancelled successfully"}
