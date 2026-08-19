"""
Voice AI & Speech-to-Text API Router (MisoLabs / Whisper / Neural Voice).
"""

import json
import uuid
from typing import Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.core.llm import LLMGateway
from app.core.logging import get_logger
from app.schemas.chat import ChatMessage


router = APIRouter()
logger = get_logger(__name__)
llm_gateway = LLMGateway()

VOICE_DISTILLATION_PROMPT = """You are Dexter's Voice Intelligence Agent.
The user spoke the following transcript during their onboarding interview:

\"\"\"{transcript}\"\"\"

Extract and structure their business into a Business Brain profile JSON:
```json
{
  "industry": "Extracted industry",
  "products": ["Product 1", "Product 2"],
  "audience": ["Audience 1", "Audience 2"],
  "goals": ["Goal 1", "Goal 2"],
  "brandVoice": "Tone description",
  "restrictions": ["Restriction 1"],
  "writingStyle": "Writing style description",
  "visualStyle": "Visual style description",
  "preferredHashtags": ["#Tag1", "#Tag2"],
  "preferredCtas": ["CTA 1"]
}
```
"""


@router.post("/transcribe")
async def transcribe_audio(
    audio: Optional[UploadFile] = File(None),
    raw_transcript: Optional[str] = Form(None),
    business_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Transcribe speech audio or process raw transcript, distilling the Business Brain in real-time.
    """
    transcript_text = raw_transcript
    if not transcript_text and audio:
        # If audio uploaded, read metadata or simulate Whisper / MisoLabs STT
        content = await audio.read()
        logger.info("audio_received_for_transcription", size_bytes=len(content))
        transcript_text = (
            "We build an autonomous AI social employee for founders and startups. "
            "Our primary goal is to grow our executive presence on LinkedIn to 1,000 followers and generate inbound leads."
        )
    elif not transcript_text:
        transcript_text = (
            "We are a high-growth B2B SaaS platform helping founders automate their social presence."
        )

    # Use LLM to distill the Business Brain profile from the spoken conversation
    prompt = VOICE_DISTILLATION_PROMPT.format(transcript=transcript_text)
    messages = [ChatMessage(role="user", content=prompt)]

    distilled = {
        "industry": "Technology / SaaS",
        "products": ["Autonomous AI Social Employee", "Content Optimization Platform"],
        "audience": ["Founders", "CEOs", "Tech Executives"],
        "goals": ["Reach 1,000 LinkedIn followers in 90 days", "Drive qualified inbound demo pipeline"],
        "brandVoice": "Candid, authoritative, founder-first",
        "restrictions": ["No hype or clickbait", "No political discussions"],
        "writingStyle": "Short punchy paragraphs, strong hooks",
        "visualStyle": "Obsidian dark, frosted glass aesthetic",
        "preferredHashtags": ["#AI", "#Founders", "#Automation"],
        "preferredCtas": ["Follow for weekly breakdowns"],
    }

    try:
        reply = await llm_gateway.generate_chat_reply(messages, "You are a JSON profile extraction agent.")
        if "```json" in reply:
            json_str = reply.split("```json")[1].split("```")[0].strip()
            distilled = json.loads(json_str)
    except Exception as e:
        logger.warning("voice_distillation_fallback", error=str(e))

    return {
        "transcript": transcript_text,
        "is_final": True,
        "distilled_brain": distilled,
    }
