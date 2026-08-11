"""Exceptions for LinkedIn API integration."""

from app.core.exceptions import DexterIntegrationError


class LinkedInError(DexterIntegrationError):
    """Base LinkedIn error."""
    
    def __init__(self, message: str, status_code: int | None = None, response_body: dict | None = None):
        self.linkedin_status_code = status_code
        self.response_body = response_body or {}
        super().__init__(message)


class LinkedInAuthError(LinkedInError):
    """Authentication or authorization failure."""
    pass


class LinkedInRateLimitError(LinkedInError):
    """Rate limit exceeded."""
    
    def __init__(self, message: str, status_code: int | None = None, response_body: dict | None = None, retry_after: int | None = None):
        self.retry_after = retry_after
        super().__init__(message, status_code, response_body)


class LinkedInMediaUploadError(LinkedInError):
    """Failed to upload media."""
    pass


class LinkedInPublishError(LinkedInError):
    """Failed to publish a post."""
    pass


class LinkedInProfileError(LinkedInError):
    """Failed to fetch user profile."""
    pass
