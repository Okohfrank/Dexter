from typing import Any
from uuid import UUID

from app.core.logging import get_logger
from app.memory.business.brain import BusinessBrain
from app.memory.conversations.store import ConversationStore
from app.memory.embeddings.manager import EmbeddingManager
from app.memory.retrieval.retriever import MemoryRetriever
from app.memory.summarizer.summarizer import MemorySummarizer


class MemoryEngine:
    """Central nervous system of Dexter.

    Every AI agent reads from and writes to the Memory Engine.
    The Memory Engine coordinates between:
    - BusinessBrain: structured knowledge about each business
    - ConversationStore: raw conversation history
    - EmbeddingManager: vector representations for semantic search
    - MemoryRetriever: semantic search across all memory types
    - MemorySummarizer: compresses conversations into structured knowledge

    Phase 1: Interfaces defined, basic CRUD operations.
    Phase 2: AI-powered summarization and embedding.
    Phase 3: Full retrieval-augmented generation pipeline.
    """

    def __init__(
        self,
        brain: BusinessBrain,
        conversations: ConversationStore,
        embeddings: EmbeddingManager,
        retriever: MemoryRetriever,
        summarizer: MemorySummarizer,
    ) -> None:
        self._brain = brain
        self._conversations = conversations
        self._embeddings = embeddings
        self._retriever = retriever
        self._summarizer = summarizer
        self._logger = get_logger(__name__)

    # Write operations
    async def record_conversation_turn(
        self, business_id: UUID, role: str, content: str, metadata: dict[str, Any] | None = None
    ) -> None:
        """Record a single turn in a conversation."""
        await self._conversations.add_turn(business_id, role, content, metadata)
        self._logger.debug("conversation_turn_recorded", business_id=str(business_id), role=role)

    async def update_business_brain(
        self, business_id: UUID, section: str, data: dict[str, Any]
    ) -> None:
        """Update a specific section of the structured business brain."""
        await self._brain.update_section(business_id, section, data)
        self._logger.info("business_brain_updated", business_id=str(business_id), section=section)

    # Read operations
    async def get_business_context(self, business_id: UUID) -> dict[str, Any]:
        """Get full business context for AI agent consumption."""
        try:
            brain_data = await self._brain.get(business_id)
            return brain_data.model_dump()
        except NotImplementedError as e:
            self._logger.warning("get_business_context_not_implemented", error=str(e))
            return {}

    async def recall(
        self, business_id: UUID, query: str, top_k: int = 5
    ) -> list[dict[str, Any]]:
        """Semantic search across all memory for a business."""
        try:
            return await self._retriever.recall(business_id, query, top_k)
        except NotImplementedError as e:
            self._logger.warning("recall_not_implemented", error=str(e))
            return []

    async def get_conversation_history(
        self, business_id: UUID, limit: int = 50
    ) -> list[dict[str, Any]]:
        """Retrieve recent conversation history."""
        try:
            return await self._conversations.get_history(business_id, limit)
        except NotImplementedError as e:
            self._logger.warning("get_conversation_history_not_implemented", error=str(e))
            return []
