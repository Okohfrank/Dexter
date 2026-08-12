"""
Publishing schemas.
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.core.enums import Platform, PostStatus

class PublishRequest(BaseModel):
    """Schema for requesting a post publication."""
    platform: Platform
    content_text: str
    media_asset_id: Optional[uuid.UUID] = None
    scheduled_for: Optional[datetime] = None
    connected_account_id: uuid.UUID

class PublishResponse(BaseModel):
    """Schema for post publication response."""
    post_id: uuid.UUID
    status: PostStatus
    scheduled_for: Optional[datetime] = None
    message: str

class PostStatusResponse(BaseModel):
    """Schema for checking post status."""
    post_id: uuid.UUID
    status: PostStatus
    platform: Platform
    published_at: Optional[datetime] = None
    permalink: Optional[str] = None
    error_message: Optional[str] = None
