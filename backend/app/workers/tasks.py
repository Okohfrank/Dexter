"""ARQ background worker tasks module."""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy import select, and_

from app.core.logging import get_logger
from app.core.database import async_session_factory
from app.core.enums import PostStatus
from app.models.business import Business
from app.models.post import ScheduledPost, PublishedPost
from app.services.autonomous_service import AutonomousContentService
from app.services.analytics_service import AnalyticsService
from app.services.publishing_service import PublishingService
from app.events.bus import EventBus
from app.utils.crypto import TokenEncryptor
from app.core.config import get_settings
from app.services.oauth_service import OAuthService
from app.publishing.registry import PublisherRegistry

logger = get_logger(__name__)


def _create_publishing_service(db) -> PublishingService:
    """Helper to instantiate PublishingService within background worker."""
    event_bus = EventBus()
    encryptor = TokenEncryptor(secret_key=get_settings().SECRET_KEY)
    oauth = OAuthService(db, event_bus, encryptor)
    registry = PublisherRegistry()
    return PublishingService(db, registry, event_bus, oauth)


async def publish_post_task(ctx: dict, post_id: str) -> dict:
    """
    Directly publish a specific scheduled post.
    Called on-demand or queued by workers.
    """
    logger.info("start_publish_task", post_id=post_id)
    post_uuid = uuid.UUID(post_id)
    async with async_session_factory() as db:
        service = _create_publishing_service(db)
        result = await service.execute_publish(post_uuid)
        logger.info("finish_publish_task", post_id=post_id, success=result.get("success"))
        return result


async def publish_due_posts_task(ctx: dict) -> dict:
    """
    Background worker cron/polling task:
    Scans for posts where scheduled_for <= NOW and status == QUEUED,
    then automatically publishes each one.
    """
    now = datetime.now(timezone.utc)
    logger.info("start_publish_due_posts", timestamp=now.isoformat())

    async with async_session_factory() as db:
        stmt = (
            select(ScheduledPost)
            .where(
                and_(
                    ScheduledPost.status == PostStatus.QUEUED,
                    ScheduledPost.scheduled_for <= now,
                )
            )
            .order_by(ScheduledPost.scheduled_for.asc())
        )
        result = await db.execute(stmt)
        due_posts = result.scalars().all()

        if not due_posts:
            return {"status": "success", "published_count": 0, "failed_count": 0}

        published_count = 0
        failed_count = 0
        service = _create_publishing_service(db)

        for post in due_posts:
            try:
                res = await service.execute_publish(post.id)
                if res.get("success"):
                    published_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                failed_count += 1
                logger.error("error_publishing_due_post", post_id=str(post.id), error=str(e))

        logger.info(
            "publish_due_posts_completed",
            published=published_count,
            failed=failed_count,
        )
        return {
            "status": "success",
            "published_count": published_count,
            "failed_count": failed_count,
        }


async def autonomous_post_generation_task(ctx: dict, business_id: Optional[str] = None) -> dict:
    """
    Background worker cron task: Scans active businesses and generates the next scheduled post.
    """
    logger.info("start_autonomous_post_generation", business_id=business_id)
    async with async_session_factory() as db:
        service = AutonomousContentService(db)
        if business_id:
            post = await service.generate_post_for_business(uuid.UUID(business_id))
            return {"status": "success", "generated_posts": 1 if post else 0}

        # Otherwise scan all active businesses
        stmt = select(Business).where(Business.is_active == True)
        result = await db.execute(stmt)
        businesses = result.scalars().all()

        count = 0
        for biz in businesses:
            p = await service.generate_post_for_business(biz.id)
            if p:
                count += 1

        logger.info("autonomous_post_generation_completed", total_generated=count)
        return {"status": "success", "total_generated": count}


async def sync_linkedin_analytics_task(ctx: dict, business_id: Optional[str] = None) -> dict:
    """
    Background worker cron task: Syncs LinkedIn analytics performance for published posts.
    """
    logger.info("start_sync_linkedin_analytics", business_id=business_id)
    async with async_session_factory() as db:
        service = AnalyticsService(db)
        biz_uuid = uuid.UUID(business_id) if business_id else None
        synced = await service.sync_linkedin_post_metrics(biz_uuid)
        insights = await service.generate_learning_insights(biz_uuid)

        logger.info(
            "sync_linkedin_analytics_completed",
            synced_posts=len(synced),
            generated_insights=len(insights),
        )
        return {
            "status": "success",
            "synced_posts": len(synced),
            "generated_insights": len(insights),
        }
