"""
Dexter Voice AI Service (Hear Voice & Speak Back Audio).
"""

import os
import asyncio
import edge_tts
from typing import Optional
from app.core.logging import get_logger
from app.core.llm import LLMGateway
from app.schemas.chat import ChatMessage


class VoiceService:
    """Conversational Voice AI Service that processes input and generates spoken human voice audio."""

    def __init__(self, voice_name: str = "en-US-ChristopherNeural"):
        self._logger = get_logger(__name__)
        self._gateway = LLMGateway()
        self._voice_name = voice_name  # Premium natural neural voice

    async def converse_with_voice(
        self, user_speech_text: str, output_audio_path: str = "dexter_reply.mp3"
    ) -> tuple[str, str]:
        """
        Process incoming user speech text, generate AI reply via Groq/Gemini, 
        and render spoken audio back as an MP3 file.
        
        Returns (ai_text_reply, audio_file_path).
        """
        system_prompt = (
            "You are Dexter, a friendly, ultra-smart AI social media consultant. "
            "Speak conversationally, concisely, and naturally as if talking out loud on a phone call. "
            "Keep replies to 2-3 spoken sentences max."
        )

        messages = [ChatMessage(role="user", content=user_speech_text)]
        ai_reply = await self._gateway.generate_chat_reply(messages, system_prompt)

        # Generate Spoken Neural Voice Audio
        communicate = edge_tts.Communicate(ai_reply, self._voice_name)
        await communicate.save(output_audio_path)

        self._logger.info("voice_audio_generated", path=output_audio_path)
        return ai_reply, output_audio_path
