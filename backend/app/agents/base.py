from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, TYPE_CHECKING
from uuid import UUID

from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.events.bus import EventBus
    from app.memory.engine import MemoryEngine


@dataclass
class AgentContext:
    """Context passed to every agent execution."""

    business_id: UUID
    user_id: UUID
    task_type: str
    parameters: dict[str, Any] = field(default_factory=dict)
    memory_context: dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentResult:
    """Result returned by every agent execution."""

    success: bool
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None
    events: list[Any] = field(default_factory=list)  # DexterEvents to emit


class BaseAgent(ABC):
    """Base class for all Dexter AI agents.

    Every agent follows the same lifecycle:
    1. Receive context (including memory)
    2. Make decisions
    3. Take actions
    4. Return results (including events to emit)

    The orchestrator handles memory retrieval before execution
    and event emission after execution.
    """

    def __init__(self, memory: "MemoryEngine", event_bus: "EventBus") -> None:
        self._memory = memory
        self._event_bus = event_bus
        self._logger = get_logger(self.__class__.__name__)

    @property
    @abstractmethod
    def agent_type(self) -> str:
        """Unique identifier for this agent type."""
        ...

    @abstractmethod
    async def execute(self, context: AgentContext) -> AgentResult:
        """Execute the agent's task."""
        ...

    async def pre_execute(self, context: AgentContext) -> AgentContext:
        """Hook: enrich context with memory before execution."""
        memory_context = await self._memory.get_business_context(context.business_id)
        context.memory_context = memory_context
        return context

    async def post_execute(self, context: AgentContext, result: AgentResult) -> None:
        """Hook: emit events and update memory after execution."""
        for event in result.events:
            await self._event_bus.publish(event)
