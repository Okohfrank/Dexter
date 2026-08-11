"""
MediaAsset model.
"""
import uuid
from typing import Optional, Dict, Any
from sqlalchemy import String, ForeignKey, Integer, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimestampedBase
from app.core.enums import MediaType

class MediaAsset(TimestampedBase):
    """
    Model for media files (images, videos, etc.) uploaded by a business.
    """
    __tablename__ = "media_assets"

    business_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("businesses.id"), index=True)
    file_url: Mapped[str] = mapped_column(String)
    file_type: Mapped[MediaType] = mapped_column(Enum(MediaType))
    mime_type: Mapped[str] = mapped_column(String(255))
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    original_filename: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    business: Mapped["Business"] = relationship(back_populates="media_assets")
