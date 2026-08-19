"""OAuth router."""
from fastapi import APIRouter, Depends
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_oauth_service, get_current_user, get_db
from app.core.enums import Platform
from app.services.oauth_service import OAuthService
from app.schemas.connected_account import OAuthAuthorizeResponse, OAuthCallbackRequest, ConnectedAccountResponse
from app.models.user import User
from app.models.connected_account import ConnectedAccount

router = APIRouter()

@router.get("/accounts", response_model=list[ConnectedAccountResponse])
async def list_connected_accounts(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ConnectedAccount]:
    """List connected accounts for a business (used for connection status UI)."""
    result = await db.execute(
        select(ConnectedAccount).where(
            ConnectedAccount.business_id == business_id,
            ConnectedAccount.is_active == True,  # noqa: E712
        )
    )
    return list(result.scalars().all())

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
    db: AsyncSession = Depends(get_db),
    oauth_service: OAuthService = Depends(get_oauth_service),
) -> ConnectedAccountResponse:
    """OAuth callback — public (browser redirect). The user is resolved from
    the state token (biz_{business_id}) instead of a Bearer header, because
    LinkedIn redirects the browser here with no Authorization header."""
    return await oauth_service.handle_callback(platform, code, state, db)
