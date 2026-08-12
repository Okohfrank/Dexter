"""Auth service module."""
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.exceptions import DexterConflictError, DexterAuthError, DexterForbiddenError, DexterNotFoundError
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse

class AuthService:
    """Handles user registration, login, and token management."""
    
    def __init__(self, db: AsyncSession):
        self._db = db
        self._logger = get_logger(__name__)
    
    async def register(self, data: UserCreate) -> UserResponse:
        """Register a new user."""
        self._logger.info("registering_user", email=data.email)
        result = await self._db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise DexterConflictError(detail="Email already registered")
            
        hashed_pwd = hash_password(data.password)
        new_user = User(
            email=data.email,
            hashed_password=hashed_pwd,
            full_name=data.full_name,
            is_active=True,
            is_verified=False
        )
        self._db.add(new_user)
        await self._db.commit()
        await self._db.refresh(new_user)
        
        return UserResponse(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            is_active=new_user.is_active,
            is_verified=new_user.is_verified,
            created_at=new_user.created_at
        )
    
    async def login(self, data: UserLogin) -> TokenResponse:
        """Authenticate and return tokens."""
        self._logger.info("login_attempt", email=data.email)
        result = await self._db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise DexterAuthError(detail="Invalid credentials")
            
        if not verify_password(data.password, user.hashed_password):
            raise DexterAuthError(detail="Invalid credentials")
            
        if not user.is_active:
            raise DexterForbiddenError(detail="Account is inactive")
            
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
    
    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        """Refresh access token using refresh token."""
        # Note: verify_token logic needs to be implemented to extract sub and type
        from app.core.security import verify_token
        
        try:
            payload = verify_token(refresh_token)
        except Exception:
            raise DexterAuthError(detail="Invalid refresh token")
            
        if payload.type != "refresh":
            raise DexterAuthError(detail="Invalid token type")
            
        user = await self.get_user_by_id(payload.sub)
        
        new_access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer"
        )
    
    async def get_user_by_id(self, user_id: uuid.UUID) -> User:
        """Get user by ID. Raises DexterNotFoundError."""
        result = await self._db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise DexterNotFoundError(detail="User not found")
        return user
