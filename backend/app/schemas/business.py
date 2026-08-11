"""
Business schemas.
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class BusinessCreate(BaseModel):
    """Schema for creating a business."""
    name: str
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None

class BusinessUpdate(BaseModel):
    """Schema for updating a business."""
    name: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    is_active: Optional[bool] = None

class BusinessResponse(BaseModel):
    """Schema for business response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    is_active: bool
    created_at: datetime
