from typing import Any
from uuid import UUID


class EmbeddingManager:
    """Manages vector embeddings for semantic search.

    Phase 1: Interface only (no LLM or pgvector dependency yet).
    Phase 2: Generate embeddings via OpenAI, store in pgvector.
    Phase 3: Hybrid search (vector + keyword + metadata filters).
    """

    async def embed_and_store(
        self, business_id: UUID, content: str, metadata: dict[str, Any] | None = None
    ) -> None:
        """Generate and store embeddings for content."""
        raise NotImplementedError("Embedding support requires Phase 2 (pgvector + LLM)")

    async def search(self, business_id: UUID, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        """Search for content using vector embeddings."""
        raise NotImplementedError("Embedding search requires Phase 2")
