"""Auth router."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.services.auth_service import AuthService
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    AuthResponse,
    RefreshRequest,
    VerificationRequest,
    ResendVerificationRequest,
)

router = APIRouter()

def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)

@router.post("/register", response_model=AuthResponse)
async def register(
    data: UserCreate, 
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    return await auth_service.register(data)

@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin, 
    auth_service: AuthService = Depends(get_auth_service)
) -> TokenResponse:
    return await auth_service.login(data)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    data: RefreshRequest, 
    auth_service: AuthService = Depends(get_auth_service)
) -> TokenResponse:
    return await auth_service.refresh_tokens(data.refresh_token)

@router.post("/verify-email", response_model=UserResponse)
async def verify_email(
    data: VerificationRequest, 
    auth_service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    return await auth_service.verify_email(data.token)

@router.post("/resend-verification", status_code=204)
async def resend_verification(
    data: ResendVerificationRequest, 
    auth_service: AuthService = Depends(get_auth_service)
) -> None:
    await auth_service.resend_verification(data.email)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at
    )
