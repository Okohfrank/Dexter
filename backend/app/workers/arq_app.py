"""ARQ App setup for background jobs and cron schedules."""
import asyncio
from arq.connections import RedisSettings
from arq.cron import cron
from app.core.config import get_settings
from app.workers.tasks import (
    publish_post_task,
    publish_due_posts_task,
    autonomous_post_generation_task,
    sync_linkedin_analytics_task,
)
from app.core.logging import configure_logging, get_logger

logger = get_logger(__name__)

async def startup(ctx: dict) -> None:
    """Worker startup: initialize configuration & logging."""
    settings = get_settings()
    configure_logging(settings.ENVIRONMENT)
    logger.info("worker_startup")
    ctx['settings'] = settings

async def shutdown(ctx: dict) -> None:
    """Worker shutdown: close connections."""
    logger.info("worker_shutdown")

class WorkerSettings:
    functions = [
        publish_post_task,
        publish_due_posts_task,
        autonomous_post_generation_task,
        sync_linkedin_analytics_task,
    ]
    cron_jobs = [
        # Check and publish due posts every 60 seconds
        cron(publish_due_posts_task, second={0, 30}),
        # Autonomous generation check hourly
        cron(autonomous_post_generation_task, minute={0}),
        # Sync LinkedIn analytics every 4 hours
        cron(sync_linkedin_analytics_task, hour={0, 4, 8, 12, 16, 20}, minute=15),
    ]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(get_settings().REDIS_URL)
    max_jobs = 10
    job_timeout = 300  # 5 minutes
    retry_jobs = True
    max_tries = 3
