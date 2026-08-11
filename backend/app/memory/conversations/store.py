from typing import Any
from uuid import UUID

from app.core.logging import get_logger

logger = get_logger(__name__)


class ConversationStore:
    """Persists raw conversation turns.

    Phase 1: Interface defined, returns empty data.
    Phase 2: Full persistence + summarization trigger.
    """

    async def add_turn(
        self, business_id: UUID, role: str, content: str, metadata: dict[str, Any] | None = None
    ) -> None:
        """Add a turn to the conversation history."""
        logger.debug("adding_conversation_turn", business_id=str(business_id), role=role)

    async def get_history(self, business_id: UUID, limit: int = 50) -> list[dict[str, Any]]:
        """Get recent conversation history."""
        logger.debug("getting_conversation_history", business_id=str(business_id), limit=limit)
        return []

    async def clear(self, business_id: UUID) -> None:
        """Clear conversation history for a business."""
        logger.info("clearing_conversation_history", business_id=str(business_id))
