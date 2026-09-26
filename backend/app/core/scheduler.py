"""In-process async scheduler for background tasks.

Runs cron-like background tasks inside the Uvicorn process.
No Redis or external queue required.
"""

import asyncio
from datetime import datetime, timezone
from typing import Callable, Awaitable, List, Tuple

from app.core.logging import get_logger

logger = get_logger(__name__)


class ScheduledTask:
    """A recurring background task."""

    def __init__(self, name: str, func: Callable[..., Awaitable], interval_seconds: int):
        self.name = name
        self.func = func
        self.interval_seconds = interval_seconds
        self._task: asyncio.Task | None = None

    async def _run_loop(self):
        while True:
            try:
                await asyncio.sleep(self.interval_seconds)
                logger.info("scheduler_task_start", task=self.name)
                await self.func()
                logger.info("scheduler_task_complete", task=self.name)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("scheduler_task_error", task=self.name, error=str(e))

    def start(self):
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass


class InProcessScheduler:
    """Manages multiple recurring background tasks."""

    def __init__(self):
        self._tasks: List[ScheduledTask] = []
        self._logger = get_logger(__name__)

    def register(self, name: str, func: Callable[..., Awaitable], interval_seconds: int):
        self._tasks.append(ScheduledTask(name, func, interval_seconds))

    async def start(self):
        self._logger.info("scheduler_starting", task_count=len(self._tasks))
        for task in self._tasks:
            task.start()
            self._logger.info("scheduler_task_registered", task=task.name, interval=task.interval_seconds)

    async def stop(self):
        self._logger.info("scheduler_stopping")
        for task in self._tasks:
            await task.stop()
