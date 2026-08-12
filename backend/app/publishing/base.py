"""Base classes for publishing to platforms."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
from app.core.enums import Platform


@dataclass
class PublishResult:
    """Result of a publishing operation."""
    success: bool
    platform: Platform
    platform_post_id: str | None = None
    permalink: str | None = None
    error: str | None = None
    raw_response: dict[str, Any] | None = None


@dataclass
class PlatformProfile:
    """Normalized platform profile."""
    platform: Platform
    platform_user_id: str
    display_name: str
    profile_url: str | None = None
    avatar_url: str | None = None


class PlatformPublisher(ABC):
    """Abstract interface for platform-specific publishers.
    
    Every social media platform implements this interface.
    The PublishingService and AI agents only interact with this abstraction.
    """
    
    @property
    @abstractmethod
    def platform(self) -> Platform:
        """Get the platform this publisher handles."""
        pass
    
    @abstractmethod
    async def publish_text(
        self, access_token: str, platform_user_id: str, text: str
    ) -> PublishResult:
        """Publish a text post."""
        pass
    
    @abstractmethod
    async def publish_image(
        self, access_token: str, platform_user_id: str, text: str,
        image_data: bytes, image_mime: str
    ) -> PublishResult:
        """Publish an image post."""
        pass
    
    @abstractmethod
    async def publish_video(
        self, access_token: str, platform_user_id: str, text: str,
        video_data: bytes, video_mime: str
    ) -> PublishResult:
        """Publish a video post."""
        pass
    
    @abstractmethod
    async def get_profile(self, access_token: str) -> PlatformProfile:
        """Get user profile from the platform."""
        pass
