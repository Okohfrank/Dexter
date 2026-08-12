import pytest
import uuid
from app.events.bus import EventBus
from app.events.factories import post_scheduled_event
from app.core.enums import EventType

@pytest.mark.asyncio
async def test_event_publish_subscribe():
    bus = EventBus()
    received_events = []

    async def mock_handler(event):
        received_events.append(event)

    bus.subscribe(EventType.POST_SCHEDULED, mock_handler)

    actor_id = uuid.uuid4()
    post_id = uuid.uuid4()
    event = post_scheduled_event(actor_id=actor_id, post_id=post_id)

    await bus.publish(event)
    
    assert len(received_events) == 1
    assert received_events[0].event_type == EventType.POST_SCHEDULED
    assert received_events[0].actor_id == actor_id
    assert received_events[0].payload["post_id"] == str(post_id)

def test_event_creation():
    actor_id = uuid.uuid4()
    post_id = uuid.uuid4()
    
    event = post_scheduled_event(actor_id=actor_id, post_id=post_id)
    
    assert event.event_type == EventType.POST_SCHEDULED
    assert event.aggregate_type == "post"
    assert event.aggregate_id == post_id
    assert event.actor_id == actor_id
    assert "post_id" in event.payload
