"""OAuth router."""
from fastapi import APIRouter, Depends
import uuid

from app.api.deps import get_oauth_service, get_current_user
from app.core.enums import Platform
from app.services.oauth_service import OAuthService
from app.schemas.connected_account import OAuthAuthorizeResponse, OAuthCallbackRequest, ConnectedAccountResponse
from app.models.user import User

router = APIRouter()

@router.get("/{platform}/authorize", response_model=OAuthAuthorizeResponse)
async def authorize(
    platform: Platform,
    business_id: uuid.UUID,
    oauth_service: OAuthService = Depends(get_oauth_service),
    current_user: User = Depends(get_current_user)
) -> OAuthAuthorizeResponse:
    return await oauth_service.get_authorization_url(platform, business_id)

@router.get("/{platform}/callback", response_model=ConnectedAccountResponse)
async def callback(
    platform: Platform,
    code: str,
    state: str,
    oauth_service: OAuthService = Depends(get_oauth_service),
    current_user: User = Depends(get_current_user)
) -> ConnectedAccountResponse:
    return await oauth_service.handle_callback(platform, code, state, current_user.id)
