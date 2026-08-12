"""LinkedIn Integration Package.

This package provides a clean interface to the LinkedIn Marketing API v2 and Auth.
"""

from .client import LinkedInClient
from .oauth import LinkedInOAuth
from .publisher import LinkedInPublisher
from .exceptions import (
    LinkedInError,
    LinkedInAuthError,
    LinkedInRateLimitError,
    LinkedInMediaUploadError,
    LinkedInPublishError,
    LinkedInProfileError,
)

__all__ = [
    "LinkedInClient",
    "LinkedInOAuth",
    "LinkedInPublisher",
    "LinkedInError",
    "LinkedInAuthError",
    "LinkedInRateLimitError",
    "LinkedInMediaUploadError",
    "LinkedInPublishError",
    "LinkedInProfileError",
]
