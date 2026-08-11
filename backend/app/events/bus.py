import asyncio
from collections import defaultdict
from typing import Awaitable, Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import EventType
from app.core.logging import get_logger
from app.events.schemas import DexterEvent
# Assuming EventLog model is available here
from app.models.event_log import EventLog

EventHandler = Callable[[DexterEvent], Awaitable[None]]


class EventBus:
    """In-process async event bus with database outbox.

    Phase 1: In-process dispatch + outbox persistence.
    Phase 2: Redis Streams for cross-process events.
    Phase 3: Full event sourcing with replay.

    Design: Handlers are registered per event type. When an event is published,
    it is persisted to the event_log table (outbox pattern) and then dispatched
    to all registered handlers. If a handler fails, the event is still persisted.
    """

    def __init__(self) -> None:
        self._handlers: dict[EventType, list[EventHandler]] = defaultdict(list)
        self._logger = get_logger(__name__)

    def subscribe(self, event_type: EventType, handler: EventHandler) -> None:
        """Subscribe a handler to a specific event type."""
        self._handlers[event_type].append(handler)
        self._logger.info("handler_subscribed", event_type=event_type, handler=handler.__name__)

    async def publish(self, event: DexterEvent, db: AsyncSession | None = None) -> None:
        """Persist event to outbox, then dispatch to handlers."""
        # 1. Persist to event_log table if db session provided
        if db is not None:
            await self._persist_event(event, db)
        
        # 2. Dispatch to all registered handlers for this event type
        await self._dispatch(event)

    async def _persist_event(self, event: DexterEvent, db: AsyncSession) -> None:
        """Write event to the event_log outbox table."""
        try:
            event_log = EventLog(
                id=event.event_id,
                event_type=event.event_type.value,
                actor_id=event.actor_id,
                aggregate_id=event.aggregate_id,
                aggregate_type=event.aggregate_type,
                payload=event.payload,
            )
            db.add(event_log)
            await db.commit()
            self._logger.debug("event_persisted", event_id=str(event.event_id))
        except Exception as e:
            self._logger.error("event_persistence_failed", event_id=str(event.event_id), error=str(e))
            await db.rollback()

    async def _dispatch(self, event: DexterEvent) -> None:
        """Dispatch event to all registered handlers."""
        handlers = self._handlers.get(event.event_type, [])
        if not handlers:
            self._logger.debug("no_handlers_for_event", event_type=event.event_type)
            return

        for handler in handlers:
            try:
                # 3. Log any handler failures but don't re-raise (events are fire-and-dispatch)
                await handler(event)
            except Exception as e:
                self._logger.error(
                    "event_handler_failed",
                    event_type=event.event_type,
                    handler=handler.__name__,
                    error=str(e),
                )
