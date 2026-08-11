"""
ConnectedAccount model.
"""
import uuid
from typing import List, Optional
from sqlalchemy import String, Boolean, ForeignKey, UniqueConstraint, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimestampedBase
from app.core.enums import Platform

class ConnectedAccount(TimestampedBase):
    """
    Model for an external social media account connected to a business.
    """
    __tablename__ = "connected_accounts"

    business_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("businesses.id"), index=True)
    platform: Mapped[Platform] = mapped_column(Enum(Platform))
    platform_user_id: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    profile_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    business: Mapped["Business"] = relationship(back_populates="connected_accounts")
    oauth_token: Mapped[Optional["OAuthToken"]] = relationship(back_populates="connected_account")
    scheduled_posts: Mapped[List["ScheduledPost"]] = relationship(back_populates="connected_account")

    __table_args__ = (
        UniqueConstraint("business_id", "platform", "platform_user_id", name="uq_business_platform_user"),
    )
