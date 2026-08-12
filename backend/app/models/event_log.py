"""
Model for event logs.
"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import String, Boolean, DateTime, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import TimestampedBase
from sqlalchemy.types import JSON

class EventLog(TimestampedBase):
    """
    Model for logging domain events.
    """
    __tablename__ = "event_log"

    event_type: Mapped[str] = mapped_column(String(255))
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    aggregate_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    aggregate_type: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON().with_variant(JSONB, 'postgresql'))
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_event_type_processed", "event_type", "processed"),
        Index("idx_aggregate_type_id", "aggregate_type", "aggregate_id"),
    )
