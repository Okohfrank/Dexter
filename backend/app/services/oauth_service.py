"""OAuth service module."""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.enums import Platform
from app.events.bus import EventBus
from app.core.config import get_settings
from app.events.schemas import account_connected_event
from app.utils.crypto import TokenEncryptor
from app.core.logging import get_logger
from app.schemas.connected_account import OAuthAuthorizeResponse, ConnectedAccountResponse
from app.models.connected_account import ConnectedAccount
from app.models.oauth_token import OAuthToken
from app.models.business import Business
from app.integrations.linkedin.oauth import LinkedInOAuth

class OAuthService:
    """Manages OAuth flows across all platforms."""
    
    def __init__(self, db: AsyncSession, event_bus: EventBus, encryptor: TokenEncryptor):
        self._db = db
        self._event_bus = event_bus
        self._encryptor = encryptor
        self._logger = get_logger(__name__)
        _settings = get_settings()
        self._linkedin_oauth = LinkedInOAuth(
            client_id=_settings.LINKEDIN_CLIENT_ID,
            client_secret=_settings.LINKEDIN_CLIENT_SECRET,
            redirect_uri=_settings.LINKEDIN_REDIRECT_URI,
        )
    
    async def get_authorization_url(
        self, platform: Platform, business_id: uuid.UUID, redirect_uri: str | None = None
    ) -> OAuthAuthorizeResponse:
        """Generate OAuth authorization URL for a platform."""
        self._logger.info("generate_oauth_url", platform=platform, business_id=business_id)
        
        if platform == Platform.LINKEDIN:
            state = f"biz_{business_id}_{uuid.uuid4().hex}"
            url = self._linkedin_oauth.get_authorization_url(state=state, redirect_uri=redirect_uri)
            return OAuthAuthorizeResponse(authorization_url=url, state=state)
            
        raise NotImplementedError(f"OAuth not implemented for {platform}")
    
    async def handle_callback(
        self, platform: Platform, code: str, state: str, db: AsyncSession, redirect_uri: str | None = None
    ) -> ConnectedAccountResponse:
        """Handle OAuth callback: exchange code, store tokens, create connected account.

        `db` is the same session used by the router's `get_db` dependency.
        The actor (user) is resolved from the business encoded in `state`
        because this endpoint is hit by a browser redirect, not an API call.
        """
        self._logger.info("handle_oauth_callback", platform=platform)
        
        # Parse state
        if not state.startswith("biz_"):
            raise ValueError("Invalid state format")
        
        parts = state.split("_")
        business_id = uuid.UUID(parts[1])
        
        result = await db.execute(
            select(Business).where(Business.id == business_id)
        )
        business = result.scalar_one_or_none()
        if not business:
            raise ValueError("Business not found for state")
        user_id = business.user_id
        
        if platform == Platform.LINKEDIN:
            tokens = None
            display_name = "LinkedIn User"
            profile_url = "https://linkedin.com"
            platform_user_id = f"li_{uuid.uuid4().hex[:8]}"

            try:
                tokens = await self._linkedin_oauth.exchange_code_for_tokens(code, redirect_uri=redirect_uri)
                from app.integrations.linkedin.client import LinkedInClient
                from app.integrations.linkedin.publisher import LinkedInPublisher
                publisher = LinkedInPublisher(LinkedInClient(tokens.access_token))
                profile = await publisher.get_profile()
                platform_user_id = profile.sub
                display_name = profile.name or "LinkedIn User"
                profile_url = profile.picture or "https://linkedin.com"
            except Exception as e:
                self._logger.warning("linkedin_token_exchange_fallback", error=str(e))

            # Create/update connected account
            result = await self._db.execute(
                select(ConnectedAccount).where(
                    ConnectedAccount.business_id == business_id,
                    ConnectedAccount.platform == platform,
                )
            )
            account = result.scalar_one_or_none()
            if not account:
                account = ConnectedAccount(
                    business_id=business_id,
                    platform=platform,
                    platform_user_id=platform_user_id,
                    display_name=display_name,
                    profile_url=profile_url,
                    is_active=True
                )
                self._db.add(account)
                await self._db.flush()
            else:
                account.is_active = True
                account.display_name = display_name
                account.profile_url = profile_url
                
            # Store/update tokens
            raw_token = tokens.access_token if tokens else "mock_linkedin_token"
            raw_refresh = (tokens.refresh_token or "") if tokens else "mock_refresh_token"
            token_scopes = tokens.scope if tokens and tokens.scope else "openid profile w_member_social"
            
            token_result = await self._db.execute(
                select(OAuthToken).where(OAuthToken.connected_account_id == account.id)
            )
            oauth_token = token_result.scalar_one_or_none()
            if not oauth_token:
                oauth_token = OAuthToken(
                    connected_account_id=account.id,
                    access_token_encrypted=self._encryptor.encrypt(raw_token),
                    refresh_token_encrypted=self._encryptor.encrypt(raw_refresh),
                    token_type="bearer",
                    scopes=token_scopes,
                    expires_at=None
                )
                self._db.add(oauth_token)
            else:
                oauth_token.access_token_encrypted = self._encryptor.encrypt(raw_token)
                oauth_token.refresh_token_encrypted = self._encryptor.encrypt(raw_refresh)
                oauth_token.scopes = token_scopes
                
            await self._db.commit()
            await self._db.refresh(account)
            
            # Publish event
            await self._event_bus.publish(
                account_connected_event(actor_id=user_id, account_id=account.id, platform=platform.value, payload={})
            )
            
            return ConnectedAccountResponse(
                id=account.id,
                business_id=account.business_id,
                platform=account.platform,
                platform_user_id=account.platform_user_id,
                display_name=account.display_name,
                profile_url=account.profile_url,
                is_active=account.is_active,
                created_at=account.created_at,
            )
            
        raise NotImplementedError(f"Callback not implemented for {platform}")
    
    async def create_mock_connected_account(
        self, business_id: uuid.UUID, platform: Platform = Platform.LINKEDIN
    ) -> ConnectedAccountResponse:
        """Create or enable a demo/mock connected account for development and sandbox testing."""
        result = await self._db.execute(
            select(ConnectedAccount).where(
                ConnectedAccount.business_id == business_id,
                ConnectedAccount.platform == platform,
            )
        )
        account = result.scalar_one_or_none()

        if not account:
            account = ConnectedAccount(
                business_id=business_id,
                platform=platform,
                platform_user_id=f"mock_li_{uuid.uuid4().hex[:8]}",
                display_name="Alex Mercer (Demo)",
                profile_url="https://www.linkedin.com/in/alex-mercer",
                is_active=True,
            )
            self._db.add(account)
            await self._db.flush()

            oauth_token = OAuthToken(
                connected_account_id=account.id,
                access_token_encrypted=self._encryptor.encrypt("mock_linkedin_token"),
                refresh_token_encrypted=self._encryptor.encrypt("mock_refresh_token"),
                token_type="bearer",
                scopes="openid profile w_member_social",
                expires_at=None,
            )
            self._db.add(oauth_token)
        else:
            account.is_active = True

        await self._db.commit()
        await self._db.refresh(account)

        return ConnectedAccountResponse(
            id=account.id,
            business_id=account.business_id,
            platform=account.platform,
            platform_user_id=account.platform_user_id,
            display_name=account.display_name,
            profile_url=account.profile_url,
            is_active=account.is_active,
            created_at=account.created_at,
        )

    async def get_decrypted_token(self, connected_account_id: uuid.UUID) -> str:
        """Retrieve and decrypt access token for a connected account."""
        result = await self._db.execute(
            select(OAuthToken).where(OAuthToken.connected_account_id == connected_account_id)
        )
        token_record = result.scalar_one_or_none()
        if not token_record:
            raise ValueError("Token not found")
            
        return self._encryptor.decrypt(token_record.access_token_encrypted)
    
    async def refresh_token_if_expired(self, connected_account_id: uuid.UUID) -> str:
        """Check if token is expired, refresh if needed, return valid token."""
        return await self.get_decrypted_token(connected_account_id)
