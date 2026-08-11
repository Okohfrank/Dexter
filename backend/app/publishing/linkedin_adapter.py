"""Adapter to integrate LinkedIn into the generic publishing framework."""

from app.core.enums import Platform
from app.integrations.linkedin.client import LinkedInClient
from app.integrations.linkedin.publisher import LinkedInPublisher
from app.integrations.linkedin.exceptions import LinkedInError
from .base import PlatformPublisher, PublishResult, PlatformProfile


class LinkedInPlatformPublisher(PlatformPublisher):
    """LinkedIn implementation of the platform publisher interface.
    
    Bridges the generic PlatformPublisher interface with the
    LinkedIn-specific client and publisher classes.
    """
    
    @property
    def platform(self) -> Platform:
        return Platform.LINKEDIN
        
    async def get_profile(self, access_token: str) -> PlatformProfile:
        client = LinkedInClient(access_token)
        try:
            publisher = LinkedInPublisher(client)
            profile = await publisher.get_profile()
            return PlatformProfile(
                platform=self.platform,
                platform_user_id=profile.sub,
                display_name=profile.name,
                avatar_url=profile.picture,
            )
        finally:
            await client.close()
    
    async def publish_text(
        self, access_token: str, platform_user_id: str, text: str
    ) -> PublishResult:
        client = LinkedInClient(access_token)
        try:
            publisher = LinkedInPublisher(client)
            post_id = await publisher.publish_text(platform_user_id, text)
            return PublishResult(
                success=True,
                platform=self.platform,
                platform_post_id=post_id,
            )
        except LinkedInError as e:
            return PublishResult(
                success=False,
                platform=self.platform,
                error=str(e),
                raw_response=e.response_body
            )
        except Exception as e:
            return PublishResult(
                success=False,
                platform=self.platform,
                error=str(e)
            )
        finally:
            await client.close()
            
    async def publish_image(
        self, access_token: str, platform_user_id: str, text: str,
        image_data: bytes, image_mime: str
    ) -> PublishResult:
        client = LinkedInClient(access_token)
        try:
            publisher = LinkedInPublisher(client)
            post_id = await publisher.publish_image(platform_user_id, text, image_data, image_mime)
            return PublishResult(
                success=True,
                platform=self.platform,
                platform_post_id=post_id,
            )
        except LinkedInError as e:
            return PublishResult(
                success=False,
                platform=self.platform,
                error=str(e),
                raw_response=e.response_body
            )
        except Exception as e:
            return PublishResult(
                success=False,
                platform=self.platform,
                error=str(e)
            )
        finally:
            await client.close()
            
    async def publish_video(
        self, access_token: str, platform_user_id: str, text: str,
        video_data: bytes, video_mime: str
    ) -> PublishResult:
        # Placeholder for video upload logic which follows a similar pattern to image upload
        return PublishResult(
            success=False,
            platform=self.platform,
            error="Video publishing not yet implemented for LinkedIn."
        )
