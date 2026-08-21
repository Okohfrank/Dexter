"""
Autonomous AI Visual & Graphic Generation Service.
Generates branded thought-leadership cards, quote graphics, and framework banners.
"""

import os
import io
import uuid
import base64
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.core.enums import MediaType
from app.models.media_asset import MediaAsset


class ImageGenerationService:
    """Service to create branded thought-leadership cards and infographics."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._logger = get_logger(__name__)
        self._uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
        os.makedirs(self._uploads_dir, exist_ok=True)

    async def generate_thought_leadership_card(
        self,
        business_id: uuid.UUID,
        quote_text: str,
        topic: str = "THOUGHT LEADERSHIP",
        author_name: str = "Alex Mercer",
        author_headline: str = "Founder & CEO",
        brand_name: str = "Dexter AI",
    ) -> MediaAsset:
        """
        Create a branded square (1080x1080) graphic for social media.
        """
        self._logger.info("generating_visual_card", topic=topic, business_id=str(business_id))

        # Truncate / clean quote text for punchy presentation
        lines = [l.strip() for l in quote_text.split("\n") if l.strip() and not l.startswith("#")]
        primary_quote = lines[0] if lines else quote_text
        if len(primary_quote) > 180:
            primary_quote = primary_quote[:177] + "…"

        image_bytes = self._render_pil_graphic(
            quote=primary_quote,
            topic=topic.upper(),
            author=author_name,
            headline=author_headline,
            brand=brand_name,
        )

        filename = f"graphic_{uuid.uuid4().hex[:8]}.png"
        filepath = os.path.join(self._uploads_dir, filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)

        # Base64 data URL for instant frontend rendering & local persistence
        b64_str = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:image/png;base64,{b64_str}"

        media_asset = MediaAsset(
            business_id=business_id,
            file_url=data_url,
            file_type=MediaType.IMAGE,
            mime_type="image/png",
            file_size_bytes=len(image_bytes),
            original_filename=filename,
            metadata_json={
                "generated_by": "dexter_ai_visual_engine",
                "topic": topic,
                "local_path": filepath,
            },
        )
        self.db.add(media_asset)
        await self.db.commit()
        await self.db.refresh(media_asset)

        self._logger.info("visual_card_created", asset_id=str(media_asset.id), filename=filename)
        return media_asset

    def _render_pil_graphic(
        self, quote: str, topic: str, author: str, headline: str, brand: str
    ) -> bytes:
        """Render high-resolution branded 1080x1080 graphic."""
        try:
            from PIL import Image, ImageDraw, ImageFont

            width, height = 1080, 1080
            image = Image.new("RGB", (width, height), color="#0F172A")
            draw = ImageDraw.Draw(image)

            # 1. Gradient / Subtle background background lighting
            for y in range(height):
                r = int(15 + (y / height) * 20)
                g = int(23 + (y / height) * 25)
                b = int(42 + (y / height) * 60)
                draw.line([(0, y), (width, y)], fill=(r, g, b))

            # 2. Glowing brand accent blob in top-left
            draw.ellipse([-100, -100, 450, 450], fill=(79, 70, 229, 60))
            draw.ellipse([700, 700, 1200, 1200], fill=(13, 148, 136, 40))

            # 3. Inner Card / Border Frame
            card_rect = [60, 60, width - 60, height - 60]
            draw.rounded_rectangle(card_rect, radius=32, fill=(30, 41, 59, 220), outline="#334155", width=2)

            # 4. Top Topic Pill
            pill_rect = [100, 100, 100 + len(topic) * 16 + 40, 150]
            draw.rounded_rectangle(pill_rect, radius=25, fill="#4F46E5")
            draw.text((120, 115), topic, fill="#FFFFFF")

            # 5. Brand Watermark top right
            draw.text((width - 260, 115), brand, fill="#94A3B8")

            # 6. Main Quote Text (Word wrapping)
            words = quote.split()
            wrapped_lines = []
            curr_line = ""
            for w in words:
                if len(curr_line) + len(w) + 1 <= 32:
                    curr_line = f"{curr_line} {w}".strip()
                else:
                    wrapped_lines.append(curr_line)
                    curr_line = w
            if curr_line:
                wrapped_lines.append(curr_line)

            y_text = 280
            # Quote mark decoration
            draw.text((100, 210), "\u201C", fill="#818CF8")

            for line in wrapped_lines:
                draw.text((100, y_text), line, fill="#F8FAFC")
                y_text += 68

            # 7. Divider Line
            draw.line([(100, height - 230), (width - 100, height - 230)], fill="#334155", width=2)

            # 8. Author Profile Bar
            draw.ellipse([100, height - 200, 164, height - 136], fill="#4F46E5")
            draw.text((122, height - 180), author[0], fill="#FFFFFF")

            draw.text((184, height - 192), author, fill="#F8FAFC")
            draw.text((184, height - 156), f"{headline} • {brand}", fill="#94A3B8")

            out_buf = io.BytesIO()
            image.save(out_buf, format="PNG", quality=95)
            return out_buf.getvalue()

        except Exception as e:
            self._logger.warning("pil_rendering_fallback", error=str(e))
            # Fallback simple 1x1 PNG or minimal binary if PIL is loading
            return b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
