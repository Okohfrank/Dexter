"""LinkedIn OAuth 2.0 implementation."""

import httpx
import urllib.parse
from app.core.logging import get_logger
from app.integrations.linkedin.constants import AUTH_URL, TOKEN_URL, DEFAULT_SCOPES, DEFAULT_TIMEOUT_SECONDS
from app.integrations.linkedin.exceptions import LinkedInAuthError
from app.integrations.linkedin.schemas import LinkedInTokenResponse


class LinkedInOAuth:
    """Handles LinkedIn OAuth 2.0 authorization code flow.
    
    Responsibilities:
    - Generate authorization URL with state parameter (CSRF protection)
    - Exchange authorization code for access + refresh tokens
    - Refresh expired access tokens
    """
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """Initialize OAuth handler."""
        self._client_id = client_id
        self._client_secret = client_secret
        self._redirect_uri = redirect_uri
        self._http = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_SECONDS)
        self._logger = get_logger(__name__)
    
    def get_authorization_url(self, state: str) -> str:
        """Generate LinkedIn OAuth authorization URL."""
        params = {
            "response_type": "code",
            "client_id": self._client_id,
            "redirect_uri": self._redirect_uri,
            "state": state,
            "scope": " ".join(DEFAULT_SCOPES),
        }
        url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"
        return url
    
    async def exchange_code_for_tokens(self, code: str) -> LinkedInTokenResponse:
        """Exchange authorization code for access/refresh tokens."""
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self._redirect_uri,
            "client_id": self._client_id,
            "client_secret": self._client_secret,
        }
        
        try:
            response = await self._http.post(
                TOKEN_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            response.raise_for_status()
            return LinkedInTokenResponse(**response.json())
        except httpx.HTTPStatusError as e:
            self._logger.error(f"Failed to exchange code: {e.response.text}")
            raise LinkedInAuthError(f"Failed to exchange code for tokens: {e.response.text}", status_code=e.response.status_code, response_body=e.response.json())
        except Exception as e:
            self._logger.error(f"Unexpected error during token exchange: {e}")
            raise LinkedInAuthError(f"Unexpected error during token exchange: {e}")
    
    async def refresh_access_token(self, refresh_token: str) -> LinkedInTokenResponse:
        """Refresh an expired access token."""
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self._client_id,
            "client_secret": self._client_secret,
        }
        
        try:
            response = await self._http.post(
                TOKEN_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            response.raise_for_status()
            return LinkedInTokenResponse(**response.json())
        except httpx.HTTPStatusError as e:
            self._logger.error(f"Failed to refresh token: {e.response.text}")
            raise LinkedInAuthError(f"Failed to refresh token: {e.response.text}", status_code=e.response.status_code, response_body=e.response.json())
        except Exception as e:
            self._logger.error(f"Unexpected error during token refresh: {e}")
            raise LinkedInAuthError(f"Unexpected error during token refresh: {e}")
    
    async def close(self) -> None:
        """Close the underlying HTTP client."""
        await self._http.aclose()
