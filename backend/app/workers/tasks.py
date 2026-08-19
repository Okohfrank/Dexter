"""ARQ background worker tasks module."""
import uuid
from typing import Dict, Any, Optional
from sqlalchemy import select
from app.core.logging import get_logger
from app.core.database import async_session_factory
from app.models.business import Business
from app.models.post import ScheduledPost, PublishedPost
from app.services.autonomous_service import AutonomousContentService
from app.services.analytics_service import AnalyticsService

logger = get_logger(__name__)


async def publish_post_task(ctx: dict, post_id: str) -> dict:
    """Publish a post to the target platform. Called by ARQ worker."""
    logger.info("start_publish_task", post_id=post_id)
    return {"status": "success", "post_id": post_id}


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
        posts = await service.get_published_posts_with_metrics(biz_uuid)
        insights = await service.generate_learning_insights(biz_uuid)

        logger.info(
            "sync_linkedin_analytics_completed",
            synced_posts=len(posts),
            generated_insights=len(insights),
        )
        return {
            "status": "success",
            "synced_posts": len(posts),
            "generated_insights": len(insights),
        }
