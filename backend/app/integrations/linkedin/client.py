"""Authenticated HTTP client for LinkedIn APIs."""

import asyncio
import httpx
from typing import Any
from app.core.logging import get_logger
from app.integrations.linkedin.constants import (
    API_BASE_URL,
    API_VERSION,
    DEFAULT_TIMEOUT_SECONDS,
    MAX_RETRIES,
    RETRY_BACKOFF_FACTOR,
)
from app.integrations.linkedin.exceptions import (
    LinkedInError,
    LinkedInAuthError,
    LinkedInRateLimitError,
)


class LinkedInClient:
    """Low-level authenticated HTTP client for LinkedIn APIs."""
    
    def __init__(self, access_token: str):
        """Initialize the client with an access token."""
        self._access_token = access_token
        self._http = httpx.AsyncClient(
            base_url=API_BASE_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0",
                "LinkedIn-Version": API_VERSION,
            },
            timeout=DEFAULT_TIMEOUT_SECONDS,
        )
        self._logger = get_logger(__name__)
    
    async def get(self, path: str, **kwargs: Any) -> dict:
        """Perform a GET request."""
        response = await self._request("GET", path, **kwargs)
        return response.json()
    
    async def post(self, path: str, json: dict | None = None, **kwargs: Any) -> dict:
        """Perform a POST request."""
        response = await self._request("POST", path, json=json, **kwargs)
        if response.content:
            return response.json()
        return {}

    async def post_with_headers(self, path: str, json: dict | None = None, **kwargs: Any) -> tuple[dict, dict]:
        """Perform a POST request and return (json_body, headers_dict)."""
        response = await self._request("POST", path, json=json, **kwargs)
        body = response.json() if response.content else {}
        headers = {k.lower(): v for k, v in response.headers.items()}
        return body, headers
    
    async def put(self, path: str, data: bytes | None = None, **kwargs: Any) -> httpx.Response:
        """Perform a PUT request."""
        # Typically used for binary uploads where we want the raw response
        return await self._request("PUT", path, data=data, **kwargs)
    
    async def _request(self, method: str, path: str, **kwargs: Any) -> httpx.Response:
        """Core request method with exponential backoff retry logic."""
        attempt = 0
        while attempt <= MAX_RETRIES:
            attempt += 1
            try:
                self._logger.debug(f"LinkedIn API Request: {method} {path}")
                response = await self._http.request(method, path, **kwargs)
                
                if response.is_success:
                    return response
                
                # Check for rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 60))
                    self._logger.warning(f"Rate limited by LinkedIn. Retry after {retry_after}s.")
                    raise LinkedInRateLimitError(
                        "LinkedIn API rate limit exceeded.",
                        status_code=429,
                        response_body=response.json() if response.content else {},
                        retry_after=retry_after
                    )
                
                # Check for auth errors
                if response.status_code == 401:
                    raise LinkedInAuthError(
                        "Unauthorized: Invalid or expired access token.",
                        status_code=401,
                        response_body=response.json() if response.content else {}
                    )
                
                # 5xx errors can be retried
                if response.status_code >= 500 and attempt <= MAX_RETRIES:
                    delay = RETRY_BACKOFF_FACTOR ** attempt
                    self._logger.warning(f"LinkedIn API 5xx error. Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                    continue
                
                # 4xx or exhaust retries
                body = response.json() if response.content else {}
                error_message = body.get("message", f"LinkedIn API Error {response.status_code}")

                # If version is not active, try fallback versions automatically
                if "is not active" in error_message.lower():
                    for fallback_ver in ["202601", "202512", "202506", "202501"]:
                        if self._http.headers.get("LinkedIn-Version") != fallback_ver:
                            self._logger.info(f"Retrying LinkedIn API with active version: {fallback_ver}")
                            self._http.headers["LinkedIn-Version"] = fallback_ver
                            retry_res = await self._http.request(method, path, **kwargs)
                            if retry_res.is_success:
                                return retry_res
                            retry_body = retry_res.json() if retry_res.content else {}
                            if "is not active" not in retry_body.get("message", "").lower():
                                body = retry_body
                                error_message = body.get("message", f"LinkedIn API Error {retry_res.status_code}")
                                break

                raise LinkedInError(
                    error_message,
                    status_code=response.status_code,
                    response_body=body
                )
                
            except httpx.RequestError as e:
                self._logger.error(f"Network error communicating with LinkedIn: {e}")
                if attempt <= MAX_RETRIES:
                    delay = RETRY_BACKOFF_FACTOR ** attempt
                    await asyncio.sleep(delay)
                    continue
                raise LinkedInError(f"Network error: {e}")
                
        raise LinkedInError("Max retries exceeded.")
    
    async def close(self) -> None:
        """Close the underlying HTTP client."""
        await self._http.aclose()
