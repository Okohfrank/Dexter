"""
Connected account schemas.
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.core.enums import Platform

class ConnectedAccountResponse(BaseModel):
    """Schema for connected account response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    business_id: uuid.UUID
    platform: Platform
    platform_user_id: str
    display_name: Optional[str] = None
    profile_url: Optional[str] = None
    is_active: bool
    created_at: datetime

class OAuthAuthorizeResponse(BaseModel):
    """Schema for OAuth authorization URL response."""
    authorization_url: str
    state: str

class OAuthCallbackRequest(BaseModel):
    """Schema for OAuth callback request."""
    code: str
    state: str
