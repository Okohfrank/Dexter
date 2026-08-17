"""
User schemas.
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field

class UserCreate(BaseModel):
    """Schema for user creation."""
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str

class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema for user response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    email: EmailStr
    full_name: str
    is_active: bool
    is_verified: bool
    created_at: datetime

class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class AuthResponse(BaseModel):
    """Schema returned after successful registration."""
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    """Schema for refreshing an access token."""
    refresh_token: str

class VerificationRequest(BaseModel):
    """Schema for email verification."""
    token: str

class ResendVerificationRequest(BaseModel):
    """Schema for requesting a new verification email."""
    email: EmailStr

class TokenPayload(BaseModel):
    """Schema for token payload."""
    sub: uuid.UUID
    exp: datetime
    type: str = "access"
