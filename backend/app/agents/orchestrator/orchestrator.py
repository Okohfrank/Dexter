from app.agents.base import AgentContext, AgentResult, BaseAgent
from app.core.logging import get_logger
from app.events.bus import EventBus
from app.memory.engine import MemoryEngine


class AgentOrchestrator:
    """Routes incoming tasks to the appropriate agent.

    The orchestrator is the entry point for all AI-driven actions.
    It:
    1. Receives a task
    2. Retrieves context from the Memory Engine
    3. Routes to the appropriate agent
    4. Handles the agent lifecycle (pre_execute → execute → post_execute)
    5. Returns results

    Phase 1: Skeleton — no agents registered.
    Phase 2: Conversation + Planning agents.
    Phase 3: Full multi-agent pipeline via LangGraph.
    """

    def __init__(self, memory: MemoryEngine, event_bus: EventBus) -> None:
        self._memory = memory
        self._event_bus = event_bus
        self._agents: dict[str, BaseAgent] = {}
        self._logger = get_logger(__name__)

    def register_agent(self, agent: BaseAgent) -> None:
        """Register an agent for a specific task type."""
        self._agents[agent.agent_type] = agent
        self._logger.info("agent_registered", agent_type=agent.agent_type)

    async def route(self, context: AgentContext) -> AgentResult:
        """Route a task to the appropriate agent."""
        agent = self._agents.get(context.task_type)
        if not agent:
            available = list(self._agents.keys())
            self._logger.warning("no_agent_for_task", task_type=context.task_type, available=available)
            return AgentResult(
                success=False,
                error=f"No agent registered for task type: {context.task_type}",
            )

        try:
            context = await agent.pre_execute(context)
            result = await agent.execute(context)
            await agent.post_execute(context, result)
            return result
        except Exception as e:
            self._logger.error("agent_execution_failed", task_type=context.task_type, error=str(e))
            return AgentResult(success=False, error=str(e))

    @property
    def registered_agents(self) -> list[str]:
        """List all registered agent types."""
        return list(self._agents.keys())
