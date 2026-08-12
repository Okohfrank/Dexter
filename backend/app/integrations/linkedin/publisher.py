"""High-level LinkedIn publishing operations."""

import json
from app.core.logging import get_logger
from app.integrations.linkedin.client import LinkedInClient
from app.integrations.linkedin.schemas import (
    LinkedInProfile,
    LinkedInMediaUploadResponse,
)
from app.integrations.linkedin.exceptions import (
    LinkedInProfileError,
    LinkedInPublishError,
    LinkedInMediaUploadError,
)


class LinkedInPublisher:
    """High-level LinkedIn publishing operations."""
    
    def __init__(self, client: LinkedInClient):
        self._client = client
        self._logger = get_logger(__name__)
    
    async def get_profile(self) -> LinkedInProfile:
        """Fetch the authenticated user's LinkedIn profile."""
        try:
            # We use the OpenID Connect userinfo endpoint
            data = await self._client.get("https://api.linkedin.com/v2/userinfo")
            return LinkedInProfile(**data)
        except Exception as e:
            self._logger.error(f"Error fetching profile: {e}")
            raise LinkedInProfileError(f"Failed to fetch profile: {e}")
    
    async def publish_text(self, author_urn: str, text: str) -> str:
        """Publish a text-only post. Returns post URN."""
        payload = self._build_text_post_payload(author_urn, text)
        try:
            # LinkedIn posts API
            response_body, headers = await self._client.post_with_headers("https://api.linkedin.com/rest/posts", json=payload)
            post_id = response_body.get("id") or headers.get("x-restli-id") or headers.get("x-linkedin-id") or "UNKNOWN_URN"
            return str(post_id)
        except Exception as e:
            self._logger.error(f"Error publishing text: {e}")
            raise LinkedInPublishError(f"Failed to publish text post: {e}")
    
    async def publish_image(
        self, author_urn: str, text: str, image_data: bytes, image_mime: str
    ) -> str:
        """Publish a post with an image. Returns post URN."""
        try:
            upload_info = await self._initialize_image_upload(author_urn)
            await self._upload_image(upload_info.upload_url, image_data, image_mime)
            payload = self._build_image_post_payload(author_urn, text, upload_info.asset)
            response_body, headers = await self._client.post_with_headers("https://api.linkedin.com/rest/posts", json=payload)
            post_id = response_body.get("id") or headers.get("x-restli-id") or headers.get("x-linkedin-id") or "UNKNOWN_URN"
            return str(post_id)
        except Exception as e:
            self._logger.error(f"Error publishing image: {e}")
            raise LinkedInPublishError(f"Failed to publish image post: {e}")
            
    async def _initialize_image_upload(
        self, author_urn: str
    ) -> LinkedInMediaUploadResponse:
        """Register an image upload with LinkedIn using the REST Images API."""
        payload = {
            "initializeUploadRequest": {
                "owner": author_urn
            }
        }
        try:
            data = await self._client.post("https://api.linkedin.com/rest/images?action=initializeUpload", json=payload)
            value = data["value"]
            image_urn = value["image"]
            upload_url = value["uploadUrl"]
            return LinkedInMediaUploadResponse(asset=image_urn, upload_url=upload_url)
        except Exception as e:
            self._logger.warning(f"Failed rest/images upload init, trying assets fallback: {e}")
            return await self._initialize_image_upload_legacy(author_urn)

    async def _initialize_image_upload_legacy(
        self, author_urn: str
    ) -> LinkedInMediaUploadResponse:
        """Legacy Assets API fallback."""
        payload = {
            "registerUploadRequest": {
                "owner": author_urn,
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "serviceRelationships": [
                    {
                        "identifier": "urn:li:userGeneratedContent",
                        "relationshipType": "OWNER"
                    }
                ]
            }
        }
        data = await self._client.post("/assets?action=registerUpload", json=payload)
        asset = data["value"]["asset"]
        upload_url = data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]
        return LinkedInMediaUploadResponse(asset=asset, upload_url=upload_url)
            
    async def _upload_image(
        self, upload_url: str, image_data: bytes, image_mime: str
    ) -> None:
        """Upload image bytes to LinkedIn's upload URL."""
        headers = {"Content-Type": image_mime}
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                 response = await client.put(upload_url, data=image_data, headers=headers)
                 response.raise_for_status()
        except Exception as e:
            raise LinkedInMediaUploadError(f"Failed to upload image bytes: {e}")
            
    def _build_text_post_payload(self, author_urn: str, text: str) -> dict:
        """Build the JSON payload for a text-only post using the Posts API."""
        return {
            "author": author_urn,
            "commentary": text,
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": []
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False
        }
        
    def _build_image_post_payload(
        self, author_urn: str, text: str, asset_urn: str
    ) -> dict:
        """Build the JSON payload for an image post using the Posts API."""
        return {
            "author": author_urn,
            "commentary": text,
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": []
            },
            "content": {
                "media": {
                    "id": asset_urn
                }
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False
        }
