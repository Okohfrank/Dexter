"""Publishing service module."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.enums import Platform, PostStatus, EventType
from app.events.bus import EventBus
from app.events.schemas import post_scheduled_event, post_published_event, post_failed_event
from app.models.post import ScheduledPost, PublishedPost
from app.schemas.publishing import PublishRequest, PublishResponse, PostStatusResponse
from app.publishing.registry import PublisherRegistry
from app.services.oauth_service import OAuthService
from app.core.logging import get_logger

class PublishingService:
    """Orchestrates content publishing across platforms.
    
    This is the public API for publishing. AI agents and API routes
    call this — never the platform adapters directly.
    """
    
    def __init__(
        self, db: AsyncSession, registry: PublisherRegistry,
        event_bus: EventBus, oauth_service: OAuthService
    ):
        self._db = db
        self._registry = registry
        self._event_bus = event_bus
        self._oauth = oauth_service
        self._logger = get_logger(__name__)
    
    async def publish(
        self, user_id: uuid.UUID, request: PublishRequest
    ) -> PublishResponse:
        """Schedule or immediately publish content."""
        self._logger.info("schedule_publish", user_id=user_id, account_id=request.connected_account_id)
        
        # Validations would go here...
        
        post = ScheduledPost(
            business_id=uuid.uuid4(), # Would be fetched properly
            connected_account_id=request.connected_account_id,
            content_text=request.content_text,
            media_asset_id=request.media_asset_id,
            scheduled_for=request.scheduled_for,
            status=PostStatus.QUEUED,
            platform_post_type="text" if not request.media_asset_id else "media",
            retry_count=0,
            max_retries=3
        )
        self._db.add(post)
        await self._db.commit()
        await self._db.refresh(post)
        
        # Enqueue ARQ task (simplified here)
        # from app.workers.arq_app import redis
        # await redis.enqueue_job("publish_post_task", str(post.id))
        
        await self._event_bus.publish(
            post_scheduled_event(actor_id=user_id, post_id=post.id, payload={})
        )
        
        return PublishResponse(
            post_id=post.id,
            status=post.status,
            scheduled_for=post.scheduled_for,
            message="Post queued successfully"
        )
    
    async def execute_publish(self, post_id: uuid.UUID) -> dict:
        """Actually publish a post (called by worker)."""
        self._logger.info("executing_publish", post_id=post_id)
        
        result = await self._db.execute(select(ScheduledPost).where(ScheduledPost.id == post_id))
        post = result.scalar_one_or_none()
        
        if not post:
            raise ValueError(f"Post {post_id} not found")
            
        post.status = PostStatus.PUBLISHING
        await self._db.commit()
        
        try:
            token = await self._oauth.get_decrypted_token(post.connected_account_id)
            # Find publisher via registry (hardcoded lookup for mock)
            # publisher = self._registry.get_publisher("linkedin")
            # pub_result = await publisher.publish_text(...)
            
            published_post = PublishedPost(
                scheduled_post_id=post.id,
                platform_post_id="mock_external_id",
                permalink="https://mock.url",
                published_at=datetime.now(timezone.utc),
            )
            self._db.add(published_post)
            
            post.status = PostStatus.PUBLISHED
            await self._db.commit()
            
            await self._event_bus.publish(
                post_published_event(actor_id=post.business_id, post_id=post.id, platform_post_id="mock", payload={})
            )
            return {"success": True, "post_id": str(post.id)}
            
        except Exception as e:
            post.status = PostStatus.FAILED
            post.error_message = str(e)
            await self._db.commit()
            
            await self._event_bus.publish(
                post_failed_event(actor_id=post.business_id, post_id=post.id, error=str(e), payload={})
            )
            return {"success": False, "error": str(e)}
    
    async def get_post_status(self, post_id: uuid.UUID, user_id: uuid.UUID) -> PostStatusResponse:
        """Get current status of a post."""
        result = await self._db.execute(select(ScheduledPost).where(ScheduledPost.id == post_id))
        post = result.scalar_one_or_none()
        if not post:
            raise ValueError("Post not found")
        return PostStatusResponse(
            post_id=post.id,
            status=post.status,
            platform=Platform.LINKEDIN,
            error_message=post.error_message,
        )
    
    async def cancel_post(self, post_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Cancel a scheduled post (only if DRAFT or QUEUED)."""
        result = await self._db.execute(select(ScheduledPost).where(ScheduledPost.id == post_id))
        post = result.scalar_one_or_none()
        if not post:
            raise ValueError("Post not found")
            
        if post.status in (PostStatus.DRAFT, PostStatus.QUEUED):
            post.status = PostStatus.CANCELLED
            await self._db.commit()
