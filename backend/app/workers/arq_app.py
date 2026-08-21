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
    send_pre_publish_warnings_task,
    send_weekly_summary_notifications_task,
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
        send_pre_publish_warnings_task,
        send_weekly_summary_notifications_task,
    ]
    cron_jobs = [
        # Check and publish due posts every 30 seconds
        cron(publish_due_posts_task, second={0, 30}),
        # Scan for posts in next 15 mins to send pre-publish push warnings (every 5 mins)
        cron(send_pre_publish_warnings_task, minute={0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55}),
        # Autonomous generation check hourly
        cron(autonomous_post_generation_task, minute={0}),
        # Sync LinkedIn analytics every 4 hours
        cron(sync_linkedin_analytics_task, hour={0, 4, 8, 12, 16, 20}, minute=15),
        # Weekly performance brief on Monday 9 AM
        cron(send_weekly_summary_notifications_task, weekday={0}, hour={9}, minute=0),
    ]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(get_settings().REDIS_URL)
    max_jobs = 10
    job_timeout = 300  # 5 minutes
    retry_jobs = True
    max_tries = 3
