"""
OAuthToken model.
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimestampedBase

class OAuthToken(TimestampedBase):
    """
    OAuth tokens for a connected account.
    """
    __tablename__ = "oauth_tokens"

    connected_account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("connected_accounts.id"), unique=True, index=True)
    access_token_encrypted: Mapped[str] = mapped_column(String)
    refresh_token_encrypted: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    token_type: Mapped[str] = mapped_column(String(50), default="Bearer")
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scopes: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    connected_account: Mapped["ConnectedAccount"] = relationship(back_populates="oauth_token")
