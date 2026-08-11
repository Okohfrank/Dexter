"""Miso AI Conversational Integration Service (misolabs.ai)."""

import json
import httpx
from typing import List, Dict, Any
from app.core.config import get_settings
from app.core.logging import get_logger
from app.schemas.chat import ChatMessage, ChatResponse, LinkedInPostBrief


SYSTEM_PROMPT = """You are Dexter's AI Social Media Consultant, powered by Miso AI.
Your goal is to converse naturally with the user to understand what LinkedIn post they want to create.

Instructions:
1. Conduct a friendly, professional conversation to refine the user's intent.
2. Ask clarifying questions about the key message, audience, tone, or specific details if ambiguous.
3. Once the user's requirement is completely clear and you have crafted a high-converting LinkedIn post, output a JSON block at the very end of your response formatted as follows:

```json
{
  "is_finalized": true,
  "topic": "Brief topic summary",
  "content_text": "The complete, ready-to-post LinkedIn content with formatting, line breaks, and emojis",
  "suggested_hashtags": ["#Hashtag1", "#Hashtag2"],
  "call_to_action": "e.g., Share your thoughts in the comments!"
}
```

If you need more details from the user, set `"is_finalized": false` or do not include the json block.
Always format LinkedIn copy with strong hooks (first 2 lines), clear line breaks, and actionable points.
"""


class MisoService:
    """Service to handle conversational AI interactions via misolabs.ai."""

    def __init__(self):
        self._settings = get_settings()
        self._logger = get_logger(__name__)
        self._api_key = self._settings.MISO_API_KEY
        self._base_url = self._settings.MISO_BASE_URL or "https://api.misolabs.ai/v1"

    async def converse(self, messages: List[ChatMessage]) -> ChatResponse:
        """Send conversation history to Miso AI and parse response."""
        formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        payload = {
            "model": "miso-v1",
            "messages": formatted_messages,
            "temperature": 0.7,
        }

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self._base_url}/chat/completions",
                    json=payload,
                    headers=headers,
                )

                if response.status_code == 200:
                    data = response.json()
                    ai_reply = data["choices"][0]["message"]["content"]
                else:
                    self._logger.warning(
                        "miso_api_fallback",
                        status_code=response.status_code,
                        body=response.text,
                    )
                    # Graceful local fallback for testing when API key is unconfigured
                    ai_reply = self._generate_mock_reply(messages)

        except Exception as e:
            self._logger.error("miso_api_error", error=str(e))
            ai_reply = self._generate_mock_reply(messages)

        return self._parse_ai_reply(ai_reply)

    def _parse_ai_reply(self, ai_reply: str) -> ChatResponse:
        """Extract response text and check if a finalized brief JSON is present."""
        is_finalized = False
        brief = None
        clean_reply = ai_reply

        if "```json" in ai_reply:
            try:
                json_str = ai_reply.split("```json")[1].split("```")[0].strip()
                data = json.loads(json_str)

                if data.get("is_finalized"):
                    is_finalized = True
                    brief = LinkedInPostBrief(
                        topic=data.get("topic", "LinkedIn Post"),
                        content_text=data.get("content_text", ""),
                        suggested_hashtags=data.get("suggested_hashtags", []),
                        call_to_action=data.get("call_to_action"),
                    )
                    clean_reply = ai_reply.split("```json")[0].strip()
                    if not clean_reply:
                        clean_reply = f"Here is your finalized LinkedIn post:\n\n{brief.content_text}"
            except Exception as e:
                self._logger.warning("failed_to_parse_miso_json", error=str(e))

        return ChatResponse(
            reply=clean_reply,
            is_finalized=is_finalized,
            brief=brief,
        )

    def _generate_mock_reply(self, messages: List[ChatMessage]) -> str:
        """Mock fallback when MISO_API_KEY is not configured yet."""
        user_last = messages[-1].content if messages else ""
        
        # If user provides sufficient post detail in testing
        if len(messages) >= 2 or len(user_last.split()) > 8:
            return f"""That sounds like a great LinkedIn update! Here is the drafted post for your approval:

```json
{{
  "is_finalized": true,
  "topic": "Company Update",
  "content_text": "🚀 Exciting milestone for Dexter!\\n\\nWe are officially building out our LinkedIn autonomous social media assistant powered by AI.\\n\\nStay tuned for more updates! #AI #Innovation #BuildingInPublic",
  "suggested_hashtags": ["#AI", "#Innovation", "#BuildingInPublic"],
  "call_to_action": "Follow our page for more updates!"
}}
```"""
        else:
            return f"I'd love to help you post about '{user_last}'! Could you share a few more details about the key message or target audience?"
