"""
Models for scheduled and published posts.
"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimestampedBase
from app.core.enums import PostStatus

class ScheduledPost(TimestampedBase):
    """
    Model for a post scheduled to be published.
    """
    __tablename__ = "scheduled_posts"

    business_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("businesses.id"), index=True)
    connected_account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("connected_accounts.id"), index=True)
    content_text: Mapped[str] = mapped_column(String)
    media_asset_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("media_assets.id"), nullable=True)
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[PostStatus] = mapped_column(Enum(PostStatus), default=PostStatus.DRAFT)
    platform_post_type: Mapped[str] = mapped_column(String(50), default="text")
    error_message: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)

    business: Mapped["Business"] = relationship()
    connected_account: Mapped["ConnectedAccount"] = relationship(back_populates="scheduled_posts")
    media_asset: Mapped[Optional["MediaAsset"]] = relationship()
    published_post: Mapped[Optional["PublishedPost"]] = relationship(back_populates="scheduled_post")

    __table_args__ = (
        Index("idx_status_scheduled_for", "status", "scheduled_for"),
    )

class PublishedPost(TimestampedBase):
    """
    Model for a post that has been successfully published to a platform.
    """
    __tablename__ = "published_posts"

    scheduled_post_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("scheduled_posts.id"), unique=True, index=True)
    platform_post_id: Mapped[str] = mapped_column(String(255))
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    permalink: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    raw_response: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    scheduled_post: Mapped["ScheduledPost"] = relationship(back_populates="published_post")
