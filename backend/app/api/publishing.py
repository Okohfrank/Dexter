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

@router.delete("/{post_id}")
async def cancel_post(
    post_id: uuid.UUID,
    publishing_service: PublishingService = Depends(get_publishing_service),
    current_user: User = Depends(get_current_user)
) -> dict:
    await publishing_service.cancel_post(post_id, current_user.id)
    return {"message": "Post cancelled successfully"}
