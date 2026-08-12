from typing import Any
from uuid import UUID

from app.core.logging import get_logger

logger = get_logger(__name__)


class MemoryRetriever:
    """Semantic search across all memory types.

    Phase 1: Interface only.
    Phase 2: Hybrid retrieval combining vector search, keyword search,
             and structured brain data.
    """

    async def recall(self, business_id: UUID, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        """Search across all memory for relevant context."""
        # Phase 1: Return empty list
        logger.debug("recalling_memory", business_id=str(business_id), query=query, top_k=top_k)
        return []
