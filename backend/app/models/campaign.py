"""Campaign goal model for RL-driven scheduling."""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimestampedBase


class Campaign(TimestampedBase):
    """Tracks a growth campaign with follower targets for the DQN agent."""
    __tablename__ = "campaigns"

    business_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("businesses.id"), index=True)
    follower_target: Mapped[int] = mapped_column(Integer, default=1000)
    current_followers: Mapped[int] = mapped_column(Integer, default=0)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    posts_per_week_target: Mapped[int] = mapped_column(Integer, default=4)
    autonomy_mode: Mapped[str] = mapped_column(String(50), default="approval_required")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    business: Mapped["Business"] = relationship()
