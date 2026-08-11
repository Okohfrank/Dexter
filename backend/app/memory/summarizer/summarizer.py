from typing import Any
from uuid import UUID


class MemorySummarizer:
    """Compresses conversation history into structured business knowledge.

    This is the bridge between raw conversations and the Business Brain.

    Phase 1: Interface only.
    Phase 2: LLM-powered extraction. After N conversation turns,
             summarize new information and update the Business Brain.
    Phase 3: Continuous background summarization with conflict resolution.
    """

    async def summarize_conversations(
        self, business_id: UUID, conversations: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Extract structured knowledge from conversations."""
        raise NotImplementedError("Summarization requires Phase 2 (LLM integration)")

    async def should_summarize(self, business_id: UUID) -> bool:
        """Check if there are enough new conversations to warrant summarization."""
        return False
