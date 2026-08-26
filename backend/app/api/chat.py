"""Chat and Conversational AI API Router."""

from typing import Optional
from fastapi import APIRouter, Depends
from app.api.deps import get_miso_service, get_publishing_service, get_optional_current_user
from app.services.miso_service import MisoService
from app.services.publishing_service import PublishingService
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.publishing import PublishRequest
from app.core.enums import Platform
from app.models.user import User

router = APIRouter()


@router.post("/message", response_model=ChatResponse)
async def chat_message(
    request: ChatRequest,
    miso_service: MisoService = Depends(get_miso_service),
    publishing_service: PublishingService = Depends(get_publishing_service),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> ChatResponse:
    """Send a text or voice-transcribed message to Miso AI to refine intent and draft a LinkedIn post."""
    
    # 1. Process conversation through Miso AI
    response = await miso_service.converse(request.messages)

    # 2. If brief is finalized and auto_publish is requested, schedule/publish directly
    if response.is_finalized and response.brief and request.auto_publish and request.connected_account_id and current_user:
        pub_request = PublishRequest(
            platform=Platform.LINKEDIN,
            content_text=response.brief.content_text,
            connected_account_id=request.connected_account_id,
        )
        pub_response = await publishing_service.publish(current_user.id, pub_request)
        response.published_post_id = pub_response.post_id

    return response
