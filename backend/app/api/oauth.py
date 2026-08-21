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

@router.post("/mock-connect", response_model=ConnectedAccountResponse)
async def mock_connect(
    business_id: uuid.UUID,
    platform: Platform = Platform.LINKEDIN,
    oauth_service: OAuthService = Depends(get_oauth_service),
    current_user: User = Depends(get_current_user),
) -> ConnectedAccountResponse:
    """Connect a demo/sandbox account instantly for seamless onboarding and testing."""
    return await oauth_service.create_mock_connected_account(business_id, platform)


@router.get("/{platform}/callback")
async def callback(
    platform: Platform,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
    oauth_service: OAuthService = Depends(get_oauth_service),
):
    """OAuth callback — public (browser redirect). The user is resolved from
    the state token (biz_{business_id}) instead of a Bearer header, because
    LinkedIn redirects the browser here with no Authorization header."""
    from fastapi.responses import HTMLResponse
    account = await oauth_service.handle_callback(platform, code, state, db)

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <title>Channel Connected - Dexter</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #F8F9FB;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          text-align: center;
          box-sizing: border-box;
        }}
        .card {{
          background: white;
          padding: 40px 28px;
          border-radius: 24px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
          max-width: 380px;
          width: 100%;
          border: 1px solid #E2E8F0;
        }}
        .icon {{
          width: 60px;
          height: 60px;
          background: #EEF2FF;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 28px;
          color: #4F46E5;
        }}
        h2 {{ color: #1E293B; margin: 0 0 8px; font-size: 22px; }}
        p {{ color: #64748B; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }}
        .btn {{
          display: inline-block;
          background: #4F46E5;
          color: white;
          text-decoration: none;
          padding: 13px 28px;
          border-radius: 99px;
          font-weight: 700;
          font-size: 15px;
        }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">✓</div>
        <h2>LinkedIn Connected!</h2>
        <p>Linked as <strong>{account.display_name}</strong>. Dexter is now authorized to create and manage posts.</p>
        <a href="dexter://" class="btn">Return to Dexter App</a>
      </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
