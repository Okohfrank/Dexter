"""Registry for platform publishers."""

from app.core.enums import Platform
from app.core.exceptions import DexterValidationError
from .base import PlatformPublisher


class PublisherRegistry:
    """Maps Platform enum values to their PlatformPublisher implementations.
    
    Usage:
        registry = PublisherRegistry()
        registry.register(Platform.LINKEDIN, LinkedInPlatformPublisher())
        publisher = registry.get(Platform.LINKEDIN)
    """
    
    def __init__(self) -> None:
        self._publishers: dict[Platform, PlatformPublisher] = {}
        
    def register(self, platform: Platform, publisher: PlatformPublisher) -> None:
        """Register a publisher for a platform."""
        self._publishers[platform] = publisher
        
    def get(self, platform: Platform) -> PlatformPublisher:
        """Get the publisher for a platform."""
        publisher = self._publishers.get(platform)
        if not publisher:
            raise DexterValidationError(f"Platform publisher not found for: {platform}")
        return publisher
        
    def get_supported_platforms(self) -> list[Platform]:
        """Get list of supported platforms."""
        return list(self._publishers.keys())
