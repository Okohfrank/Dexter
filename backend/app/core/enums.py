"""Shared enumerations for the application."""

from enum import Enum

class Platform(str, Enum):
    """Supported social media platforms."""
    LINKEDIN = "linkedin"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"

class PostStatus(str, Enum):
    """Statuses for a social media post."""
    DRAFT = "draft"
    QUEUED = "queued"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELLED = "cancelled"

class MediaType(str, Enum):
    """Types of media attachments."""
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"

class EventType(str, Enum):
    """System event types for the event bus."""
    BUSINESS_CREATED = "business.created"
    ACCOUNT_CONNECTED = "account.connected"
    MEDIA_UPLOADED = "media.uploaded"
    POST_SCHEDULED = "post.scheduled"
    POST_PUBLISHED = "post.published"
    POST_FAILED = "post.failed"
    STRATEGY_GENERATED = "strategy.generated"
    GOAL_UPDATED = "goal.updated"
    ANALYTICS_COLLECTED = "analytics.collected"
    LEARNING_COMPLETED = "learning.completed"
    MEMORY_UPDATED = "memory.updated"

__all__ = ["Platform", "PostStatus", "MediaType", "EventType"]
