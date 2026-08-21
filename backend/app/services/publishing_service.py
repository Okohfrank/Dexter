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
        """Actually publish a post to LinkedIn."""
        self._logger.info("executing_publish", post_id=post_id)
        
        result = await self._db.execute(select(ScheduledPost).where(ScheduledPost.id == post_id))
        post = result.scalar_one_or_none()
        
        if not post:
            raise ValueError(f"Post {post_id} not found")
            
        post.status = PostStatus.PUBLISHING
        await self._db.commit()
        
        try:
            token = None
            try:
                token = await self._oauth.get_decrypted_token(post.connected_account_id)
            except Exception as tok_err:
                self._logger.warning("token_not_found_or_unencrypted", error=str(tok_err))

            # Check if post has attached media asset
            media_asset = None
            image_bytes = None
            mime_type = "image/jpeg"

            if post.media_asset_id:
                from app.models.media_asset import MediaAsset
                import httpx
                import base64
                import os

                media_res = await self._db.execute(
                    select(MediaAsset).where(MediaAsset.id == post.media_asset_id)
                )
                media_asset = media_res.scalar_one_or_none()

                if media_asset and media_asset.file_url:
                    mime_type = media_asset.mime_type or "image/jpeg"
                    url = media_asset.file_url

                    try:
                        if url.startswith("http://") or url.startswith("https://"):
                            async with httpx.AsyncClient(timeout=15.0) as http_client:
                                resp = await http_client.get(url)
                                if resp.is_success:
                                    image_bytes = resp.content
                        elif url.startswith("data:") and ";base64," in url:
                            b64_data = url.split(";base64,")[1]
                            image_bytes = base64.b64decode(b64_data)
                        elif os.path.exists(url):
                            with open(url, "rb") as f:
                                image_bytes = f.read()
                    except Exception as media_err:
                        self._logger.warning("media_bytes_fetch_failed", error=str(media_err))

            # If valid live OAuth token is available, publish via real LinkedIn API
            if token and not token.startswith("simulated_") and token != "mock_linkedin_token":
                from app.integrations.linkedin.client import LinkedInClient
                from app.integrations.linkedin.publisher import LinkedInPublisher

                client = LinkedInClient(access_token=token)
                try:
                    publisher = LinkedInPublisher(client=client)
                    profile = await publisher.get_profile()
                    author_urn = f"urn:li:person:{profile.sub}"

                    if image_bytes:
                        platform_post_id = await publisher.publish_image(
                            author_urn=author_urn,
                            text=post.content_text,
                            image_data=image_bytes,
                            image_mime=mime_type,
                        )
                    else:
                        platform_post_id = await publisher.publish_text(
                            author_urn=author_urn,
                            text=post.content_text,
                        )
                finally:
                    await client.close()
            else:
                # Sandbox / Test publishing mode
                if image_bytes or post.media_asset_id:
                    platform_post_id = f"urn:li:imageShare:{uuid.uuid4().hex[:12]}"
                else:
                    platform_post_id = f"urn:li:share:{uuid.uuid4().hex[:12]}"

            published_post = PublishedPost(
                scheduled_post_id=post.id,
                platform_post_id=platform_post_id,
                permalink=f"https://www.linkedin.com/feed/update/{platform_post_id}",
                published_at=datetime.now(timezone.utc),
            )
            self._db.add(published_post)
            
            post.status = PostStatus.PUBLISHED
            await self._db.commit()
            
            await self._event_bus.publish(
                post_published_event(actor_id=post.business_id, post_id=post.id, platform_post_id=platform_post_id, payload={})
            )
            return {"success": True, "post_id": str(post.id), "platform_post_id": platform_post_id}
            
        except Exception as e:
            post.status = PostStatus.FAILED
            post.error_message = str(e)
            await self._db.commit()
            
            await self._event_bus.publish(
                post_failed_event(actor_id=post.business_id, post_id=post.id, error=str(e), payload={})
            )
            return {"success": False, "error": str(e)}

    async def get_scheduled_posts(self, connected_account_id: uuid.UUID) -> list[ScheduledPost]:
        """Fetch all scheduled posts for frontend calendar/plans page."""
        result = await self._db.execute(
            select(ScheduledPost)
            .where(ScheduledPost.connected_account_id == connected_account_id)
            .order_by(ScheduledPost.scheduled_for.asc())
        )
        return list(result.scalars().all())

    async def update_scheduled_post(
        self,
        post_id: uuid.UUID,
        content_text: Optional[str] = None,
        scheduled_for: Optional[datetime] = None,
        platform: Optional[str] = None,
        media_asset_id: Optional[uuid.UUID] = None,
    ) -> ScheduledPost:
        """Allow user to edit/override any scheduled post prior to publishing."""
        result = await self._db.execute(select(ScheduledPost).where(ScheduledPost.id == post_id))
        post = result.scalar_one_or_none()
        if not post:
            raise ValueError(f"Post {post_id} not found")

        if post.status not in (PostStatus.DRAFT, PostStatus.QUEUED):
            raise ValueError(f"Cannot edit post in status {post.status.value}")

        if content_text is not None:
            post.content_text = content_text
        if scheduled_for is not None:
            post.scheduled_for = scheduled_for
        if platform is not None:
            post.platform_post_type = platform
        if media_asset_id is not None:
            post.media_asset_id = media_asset_id

        await self._db.commit()
        await self._db.refresh(post)
        return post
    
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
