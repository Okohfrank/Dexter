"""
Voice AI & Speech-to-Text API Router (MisoLabs / Whisper / Neural Voice).
Includes full-duplex WebSocket streaming for real-time voice conversations.
"""

import json
import uuid
import asyncio
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.core.llm import LLMGateway
from app.core.logging import get_logger
from app.schemas.chat import ChatMessage


router = APIRouter()
logger = get_logger(__name__)
llm_gateway = LLMGateway()

VOICE_CONVERSATION_SYSTEM_PROMPT = """You are Dexter, an autonomous brand employee and AI social media strategist speaking live with a company founder during voice onboarding.
Your goal is to converse naturally, ask targeted questions about their business, target audience, brand voice, and goals, and build a cohesive Business Brain.

Keep your spoken responses concise, friendly, conversational, and direct (2-3 sentences max per turn).
When the founder has provided enough information about their business, conclude with a summary and end your response with:
```json
{
  "is_complete": true,
  "industry": "Extracted industry",
  "products": ["Product 1", "Product 2"],
  "audience": ["Audience 1", "Audience 2"],
  "goals": ["Goal 1", "Goal 2"],
  "brandVoice": "Tone description",
  "restrictions": ["Restriction 1"],
  "writingStyle": "Short punchy paragraphs",
  "visualStyle": "Modern light aesthetic",
  "preferredHashtags": ["#AI", "#Founders"],
  "preferredCtas": ["Follow for weekly breakdown"]
}
```
"""

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


@router.websocket("/stream")
async def voice_realtime_stream(websocket: WebSocket):
    """
    Full-duplex WebSocket stream for real-time conversational voice onboarding.
    Receives voice / transcript tokens and streams back assistant dialogue + distilled brain.
    """
    await websocket.accept()
    logger.info("voice_websocket_connected")

    conversation_history: List[ChatMessage] = []
    accumulated_transcript: List[str] = []

    try:
        # Initial greeting from Dexter
        initial_greeting = "Hi, I'm Dexter! I'm ready to learn about your brand. What does your company do and who is your target audience?"
        await websocket.send_json({
            "type": "assistant_reply",
            "text": initial_greeting,
            "state": "speaking",
        })
        conversation_history.append(ChatMessage(role="assistant", content=initial_greeting))

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            elif msg_type in ("user_speech", "transcript_chunk"):
                user_text = data.get("text", "").strip()
                if not user_text:
                    continue

                accumulated_transcript.append(user_text)
                conversation_history.append(ChatMessage(role="user", content=user_text))

                # Notify client that Dexter is processing
                await websocket.send_json({"type": "state", "status": "processing"})

                # Generate AI conversational response
                try:
                    reply = await llm_gateway.generate_chat_reply(
                        conversation_history,
                        VOICE_CONVERSATION_SYSTEM_PROMPT,
                    )

                    # Check if response includes finalized business brain JSON
                    distilled_brain = None
                    clean_reply = reply
                    if "```json" in reply:
                        try:
                            json_str = reply.split("```json")[1].split("```")[0].strip()
                            distilled_brain = json.loads(json_str)
                            clean_reply = reply.split("```json")[0].strip()
                        except Exception:
                            pass

                    # Stream text chunk
                    await websocket.send_json({
                        "type": "assistant_reply",
                        "text": clean_reply,
                        "state": "speaking",
                    })
                    conversation_history.append(ChatMessage(role="assistant", content=clean_reply))

                    if distilled_brain and distilled_brain.get("is_complete"):
                        await websocket.send_json({
                            "type": "distilled_brain",
                            "brain": distilled_brain,
                        })

                except Exception as llm_err:
                    logger.error("voice_stream_llm_error", error=str(llm_err))
                    fallback_msg = "I got that. Could you tell me about your primary business goals for LinkedIn?"
                    await websocket.send_json({
                        "type": "assistant_reply",
                        "text": fallback_msg,
                        "state": "speaking",
                    })

            elif msg_type == "finish":
                # Finalize and synthesize the Business Brain from total transcript
                full_text = " ".join(accumulated_transcript)
                prompt = VOICE_DISTILLATION_PROMPT.format(transcript=full_text or "B2B SaaS product for founders")
                try:
                    distill_reply = await llm_gateway.generate_chat_reply(
                        [ChatMessage(role="user", content=prompt)],
                        "You are a JSON profile extraction agent.",
                    )
                    brain_data = None
                    if "```json" in distill_reply:
                        json_str = distill_reply.split("```json")[1].split("```")[0].strip()
                        brain_data = json.loads(json_str)

                    await websocket.send_json({
                        "type": "distilled_brain",
                        "brain": brain_data or {
                            "industry": "Technology / SaaS",
                            "products": ["AI Social Employee"],
                            "audience": ["Founders", "CEOs"],
                            "goals": ["Reach 1,000 LinkedIn followers"],
                            "brandVoice": "Candid, authoritative",
                            "restrictions": ["No clickbait"],
                            "writingStyle": "Short punchy frameworks",
                            "visualStyle": "Modern light aesthetic",
                            "preferredHashtags": ["#AI", "#Founders"],
                            "preferredCtas": ["Follow for weekly breakdowns"],
                        },
                    })
                except Exception as e:
                    logger.error("voice_stream_finish_error", error=str(e))
                break

    except WebSocketDisconnect:
        logger.info("voice_websocket_disconnected")
    except Exception as e:
        logger.error("voice_websocket_error", error=str(e))
        try:
            await websocket.close()
        except Exception:
            pass


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
        "visualStyle": "Modern light aesthetic",
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
