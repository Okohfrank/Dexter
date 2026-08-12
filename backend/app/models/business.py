"""
Business model.
"""
import uuid
from typing import List, Optional
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimestampedBase

class Business(TimestampedBase):
    """
    Business model representing a company or brand managed by a user.
    """
    __tablename__ = "businesses"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    industry: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="businesses")
    connected_accounts: Mapped[List["ConnectedAccount"]] = relationship(back_populates="business")
    media_assets: Mapped[List["MediaAsset"]] = relationship(back_populates="business")
