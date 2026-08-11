"""Pydantic schemas for internal LinkedIn API structures."""

from pydantic import BaseModel, ConfigDict


class LinkedInProfile(BaseModel):
    """LinkedIn user profile from /userinfo endpoint."""
    model_config = ConfigDict(extra="ignore")
    
    sub: str
    name: str
    email: str | None = None
    picture: str | None = None


class LinkedInTokenResponse(BaseModel):
    """Response from LinkedIn OAuth token endpoint."""
    model_config = ConfigDict(extra="ignore")
    
    access_token: str
    expires_in: int
    refresh_token: str | None = None
    refresh_token_expires_in: int | None = None
    scope: str | None = None


class LinkedInMediaUploadRequest(BaseModel):
    """Request body for initializing media upload."""
    model_config = ConfigDict(extra="ignore")
    
    owner: str


class LinkedInMediaUploadResponse(BaseModel):
    """Response from media upload initialization."""
    model_config = ConfigDict(extra="ignore")
    
    asset: str
    upload_url: str


class LinkedInPostResponse(BaseModel):
    """Response from creating a post."""
    model_config = ConfigDict(extra="ignore")
    
    id: str
