"""
Autonomous Content Creation Service.
Orchestrates AI-driven post generation, media selection, and scheduling for businesses.
"""

import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.llm import LLMGateway
from app.core.enums import PostStatus, Platform
from app.models.business import Business
from app.models.connected_account import ConnectedAccount
from app.models.media_asset import MediaAsset
from app.models.post import ScheduledPost
from app.schemas.chat import ChatMessage


SYSTEM_AUTONOMOUS_PROMPT = """You are Dexter's Autonomous Content Engine.
Your job is to act as an executive-level social media manager for a high-growth company.
Based on the company's profile, audience, and goals, create a compelling, viral-ready LinkedIn post.

Guidelines:
1. First line must be a powerful, curiosity-inducing hook (max 12 words).
2. Use short, punchy paragraphs (1-2 sentences) with clear line breaks.
3. Deliver high-value actionable insights, frameworks, or thought leadership.
4. Include 2-4 targeted hashtags at the bottom.
5. Include a conversational call to action that encourages comments.
6. Tone should be confident, authentic, and founder-level.

Output your result strictly as JSON:
```json
{
  "topic": "Topic summary",
  "content_text": "The complete post text with line breaks and hashtags",
  "suggested_time_offset_hours": 36,
  "rationale": "Why this time and angle was chosen"
}
```
"""


class AutonomousContentService:
    """Service to generate and queue posts autonomously for active businesses."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._logger = get_logger(__name__)
        self._gateway = LLMGateway()

    async def generate_post_for_business(
        self,
        business_id: uuid.UUID,
        override_topic: Optional[str] = None,
    ) -> Optional[ScheduledPost]:
        """
        Generate a single brand-tailored post and schedule it in the database.
        """
        # Fetch business and linked account
        stmt = select(Business).where(Business.id == business_id)
        res = await self.db.execute(stmt)
        business = res.scalar_one_or_none()
        if not business:
            self._logger.warning("business_not_found_for_generation", business_id=str(business_id))
            return None

        stmt_account = select(ConnectedAccount).where(
            ConnectedAccount.business_id == business_id,
            ConnectedAccount.platform == Platform.LINKEDIN,
            ConnectedAccount.is_active == True,
        )
        res_acc = await self.db.execute(stmt_account)
        account = res_acc.scalar_one_or_none()
        if not account:
            self._logger.warning("no_active_linkedin_account", business_id=str(business_id))
            return None

        # Fetch optional media asset to pair
        stmt_media = select(MediaAsset).where(MediaAsset.business_id == business_id)
        res_media = await self.db.execute(stmt_media)
        media_assets = res_media.scalars().all()
        selected_media: Optional[MediaAsset] = media_assets[0] if media_assets else None

        # Prepare context for LLM
        user_prompt = f"""
Business Name: {business.name}
Industry: {business.industry or 'Technology / SaaS'}
Description: {business.description or 'Autonomous AI tools for modern founders'}
Website: {business.website or 'https://dexter.ai'}
Topic Focus: {override_topic or 'Founder lessons, scaling insights, or future of autonomous AI'}
"""
        messages = [ChatMessage(role="user", content=user_prompt)]

        try:
            ai_reply = await self._gateway.generate_chat_reply(messages, SYSTEM_AUTONOMOUS_PROMPT)
            post_data = self._parse_json(ai_reply, business.name)
        except Exception as e:
            self._logger.error("autonomous_generation_failed", error=str(e))
            post_data = {
                "content_text": (
                    f"Building {business.name} has taught our team one fundamental lesson:\n\n"
                    "Consistency in brand communication beats sporadic bursts of effort every single time.\n\n"
                    "What is one principle that guides your growth strategy? #Founders #Automation #Growth"
                ),
                "suggested_time_offset_hours": 36,
            }

        # Calculate scheduled time (e.g. 36 hours from now at peak 8:30 AM)
        offset_hours = post_data.get("suggested_time_offset_hours", 36)
        scheduled_for = datetime.now(timezone.utc) + timedelta(hours=offset_hours)

        scheduled_post = ScheduledPost(
            business_id=business.id,
            connected_account_id=account.id,
            content_text=post_data["content_text"],
            media_asset_id=selected_media.id if selected_media else None,
            scheduled_for=scheduled_for,
            status=PostStatus.QUEUED,
            platform_post_type="linkedin",
        )
        self.db.add(scheduled_post)
        await self.db.commit()
        await self.db.refresh(scheduled_post)

        self._logger.info(
            "autonomous_post_created",
            post_id=str(scheduled_post.id),
            business_id=str(business.id),
            scheduled_for=scheduled_post.scheduled_for.isoformat(),
        )
        return scheduled_post

    def _parse_json(self, raw: str, business_name: str) -> Dict[str, Any]:
        """Safely extract JSON payload from LLM output."""
        if "```json" in raw:
            json_str = raw.split("```json")[1].split("```")[0].strip()
            return json.loads(json_str)
        elif raw.strip().startswith("{") and raw.strip().endswith("}"):
            return json.loads(raw.strip())
        return {
            "content_text": raw.strip(),
            "suggested_time_offset_hours": 36,
        }
