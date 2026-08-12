from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import EventType


class DexterEvent(BaseModel):
    """Base event emitted by any Dexter component."""

    event_id: UUID = Field(default_factory=uuid4)
    event_type: EventType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actor_id: UUID | None = None
    aggregate_id: UUID | None = None
    aggregate_type: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(frozen=True)


def business_created_event(actor_id: UUID, business_id: UUID, payload: dict[str, Any]) -> DexterEvent:
    return DexterEvent(
        event_type=EventType.BUSINESS_CREATED,
        actor_id=actor_id,
        aggregate_id=business_id,
        aggregate_type="business",
        payload=payload,
    )


def account_connected_event(actor_id: UUID, account_id: UUID, platform: str, payload: dict[str, Any]) -> DexterEvent:
    return DexterEvent(
        event_type=EventType.ACCOUNT_CONNECTED,
        actor_id=actor_id,
        aggregate_id=account_id,
        aggregate_type="account",
        payload={"platform": platform, **payload},
    )


def post_scheduled_event(actor_id: UUID, post_id: UUID, payload: dict[str, Any]) -> DexterEvent:
    return DexterEvent(
        event_type=EventType.POST_SCHEDULED,
        actor_id=actor_id,
        aggregate_id=post_id,
        aggregate_type="post",
        payload=payload,
    )


def post_published_event(actor_id: UUID, post_id: UUID, platform_post_id: str, payload: dict[str, Any]) -> DexterEvent:
    return DexterEvent(
        event_type=EventType.POST_PUBLISHED,
        actor_id=actor_id,
        aggregate_id=post_id,
        aggregate_type="post",
        payload={"platform_post_id": platform_post_id, **payload},
    )


def post_failed_event(actor_id: UUID, post_id: UUID, error: str, payload: dict[str, Any]) -> DexterEvent:
    return DexterEvent(
        event_type=EventType.POST_FAILED,
        actor_id=actor_id,
        aggregate_id=post_id,
        aggregate_type="post",
        payload={"error": error, **payload},
    )


def media_uploaded_event(actor_id: UUID, asset_id: UUID, payload: dict[str, Any]) -> DexterEvent:
    return DexterEvent(
        event_type=EventType.MEDIA_UPLOADED,
        actor_id=actor_id,
        aggregate_id=asset_id,
        aggregate_type="asset",
        payload=payload,
    )


def memory_updated_event(actor_id: UUID, business_id: UUID, payload: dict[str, Any]) -> DexterEvent:
    return DexterEvent(
        event_type=EventType.MEMORY_UPDATED,
        actor_id=actor_id,
        aggregate_id=business_id,
        aggregate_type="business",
        payload=payload,
    )
