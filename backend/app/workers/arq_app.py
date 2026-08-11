"""ARQ App setup for background jobs."""
import asyncio
from arq.connections import RedisSettings
from app.core.config import get_settings
from app.workers.tasks import publish_post_task
from app.core.logging import configure_logging, get_logger

logger = get_logger(__name__)

async def startup(ctx: dict) -> None:
    """Worker startup: initialize DB, event bus, services."""
    settings = get_settings()
    configure_logging(settings.ENVIRONMENT)
    logger.info("worker_startup")
    
    # Normally we would init db session maker here and attach to ctx
    ctx['settings'] = settings

async def shutdown(ctx: dict) -> None:
    """Worker shutdown: close connections."""
    logger.info("worker_shutdown")

class WorkerSettings:
    functions = [publish_post_task]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(get_settings().REDIS_URL)
    max_jobs = 10
    job_timeout = 300  # 5 minutes
    retry_jobs = True
    max_tries = 3
