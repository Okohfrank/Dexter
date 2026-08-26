"""FastAPI Dependencies."""
from typing import AsyncGenerator
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.core.security import verify_token
from app.core.exceptions import DexterAuthError
from app.models.user import User
from app.events.bus import EventBus
from app.utils.crypto import TokenEncryptor
from app.services.oauth_service import OAuthService
from app.services.publishing_service import PublishingService
from app.publishing.registry import PublisherRegistry
from sqlalchemy import select

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """Extract and validate current user from JWT."""
    try:
        payload = verify_token(token)
    except Exception:
        raise DexterAuthError(detail="Invalid credentials")
        
    result = await db.execute(select(User).where(User.id == payload.sub))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise DexterAuthError(detail="Inactive or non-existent user")
    return user


async def get_optional_current_user(
    token: str | None = Depends(oauth2_scheme_optional),
    db: AsyncSession = Depends(get_db)
) -> User | None:
    """Extract optional current user from JWT without failing if unauthenticated."""
    if not token:
        return None
    try:
        payload = verify_token(token)
        result = await db.execute(select(User).where(User.id == payload.sub))
        user = result.scalar_one_or_none()
        if user and user.is_active:
            return user
    except Exception:
        pass
    return None

_event_bus: EventBus | None = None

def get_event_bus() -> EventBus:
    """Get the application event bus instance."""
    global _event_bus
    if _event_bus is None:
        _event_bus = EventBus()
    return _event_bus

def get_token_encryptor() -> TokenEncryptor:
    """Get token encryptor."""
    from app.core.config import get_settings
    return TokenEncryptor(secret_key=get_settings().SECRET_KEY)

def get_oauth_service(
    db: AsyncSession = Depends(get_db), 
    event_bus: EventBus = Depends(get_event_bus), 
    encryptor: TokenEncryptor = Depends(get_token_encryptor)
) -> OAuthService:
    return OAuthService(db, event_bus, encryptor)

def get_publishing_service(
    db: AsyncSession = Depends(get_db), 
    event_bus: EventBus = Depends(get_event_bus), 
    oauth: OAuthService = Depends(get_oauth_service)
) -> PublishingService:
    registry = PublisherRegistry()
    return PublishingService(db, registry, event_bus, oauth)

def get_miso_service() -> "MisoService":
    from app.services.miso_service import MisoService
    return MisoService()
