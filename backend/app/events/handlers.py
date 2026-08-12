from app.core.enums import EventType
from app.core.logging import get_logger
from app.events.bus import EventBus
from app.events.schemas import DexterEvent

logger = get_logger(__name__)


async def logging_handler(event: DexterEvent) -> None:
    """Default handler that logs every event using structlog."""
    logger.info(
        "event_received",
        event_id=str(event.event_id),
        event_type=event.event_type.value,
        actor_id=str(event.actor_id) if event.actor_id else None,
        aggregate_id=str(event.aggregate_id) if event.aggregate_id else None,
        payload=event.payload,
    )


def register_default_handlers(bus: EventBus) -> None:
    """Subscribe the logging handler to all event types."""
    for event_type in EventType:
        bus.subscribe(event_type, logging_handler)
    logger.info("default_event_handlers_registered")
