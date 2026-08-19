"""Event factory helpers."""
from uuid import UUID
from typing import Any, Optional
from app.events.schemas import DexterEvent
from app.core.enums import EventType


def post_scheduled_event(actor_id: UUID, post_id: UUID, payload: Optional[dict[str, Any]] = None) -> DexterEvent:
    data = {"post_id": str(post_id)}
    if payload:
        data.update(payload)
    return DexterEvent(
        event_type=EventType.POST_SCHEDULED,
        actor_id=actor_id,
        aggregate_id=post_id,
        aggregate_type="post",
        payload=data,
    )
