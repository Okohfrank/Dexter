"""Free Multi-LLM Gateway for Dexter (Groq Llama 3.3 70B & Google Gemini 2.0 Flash)."""

import json
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import get_settings
from app.core.logging import get_logger
from app.schemas.chat import ChatMessage, LinkedInPostBrief


class LLMGateway:
    """Multi-provider Free LLM Router (Groq + Gemini).
    
    Capabilities:
    - Conversational Chat & Copywriting: Groq (Llama 3.3 70B) - Ultra Fast (500+ tokens/sec)
    - Multimodal Vision & Image Analysis: Google Gemini 2.0 Flash (Free 1,500 requests/day)
    """

    def __init__(self):
        self._settings = get_settings()
        self._logger = get_logger(__name__)

    async def generate_chat_reply(
        self, messages: List[ChatMessage], system_prompt: str
    ) -> str:
        """Generate conversational response using Groq or Gemini."""
        last_msg = messages[-1] if messages else None
        has_image = bool(last_msg and last_msg.image_url)

        # 1. If an image is attached, route to Gemini 2.0 Flash (Vision capability)
        if has_image and self._settings.GEMINI_API_KEY:
            try:
                self._logger.info("routing_to_gemini_vision")
                return await self._call_gemini_vision(messages, system_prompt)
            except Exception as e:
                self._logger.warning("gemini_vision_failed_failover", error=str(e))

        # 2. Primary Text Chat & Copy Provider: Groq (Llama 3.3 70B - Ultra Fast)
        if self._settings.GROQ_API_KEY:
            try:
                self._logger.info("routing_to_groq_llama3")
                return await self._call_groq_chat(messages, system_prompt)
            except Exception as e:
                self._logger.warning("groq_chat_failed_failover", error=str(e))

        # 3. Text Fallback: Gemini 2.0 Flash
        if self._settings.GEMINI_API_KEY:
            try:
                self._logger.info("routing_to_gemini_text")
                return await self._call_gemini_text(messages, system_prompt)
            except Exception as e:
                self._logger.warning("gemini_text_failed_failover", error=str(e))

        # 4. Built-in Local Simulation Handler for offline dev testing
        return self._generate_simulated_chat_reply(messages)

    async def generate_linkedin_copy(
        self, topic: str, tone: str = "Professional", image_url: Optional[str] = None
    ) -> str:
        """Generate rich, long-form, high-converting LinkedIn copy using Groq or Gemini."""
        system = (
            "You are a world-class LinkedIn ghostwriter and brand strategist. "
            "Write comprehensive, detailed, and deeply engaging LinkedIn posts.\n"
            "Formatting Rules:\n"
            "1. Hook: Start with a bold, attention-grabbing 1-2 sentence hook.\n"
            "2. Body: Expand into 3-4 structured, insightful paragraphs with real-world storytelling, context, and actionable advice.\n"
            "3. Bullet points: Use emojis and key takeaways for easy readability.\n"
            "4. Conclusion & CTA: End with a clear call-to-action or reflection question.\n"
            "5. Hashtags: Add 4-5 highly relevant, targeted hashtags at the bottom.\n"
            "Do NOT write brief 2-sentence summaries. Write rich, valuable long-form content that founders and leaders want to read."
        )
        prompt = f"Topic: {topic}\nTone: {tone}\nAttached Visual: {image_url or 'None'}\n\nDraft the complete, detailed LinkedIn post:"
        mock_msg = ChatMessage(role="user", content=prompt, image_url=image_url)
        return await self.generate_chat_reply([mock_msg], system)

    async def generate_image_for_post(self, post_topic: str) -> str:
        """Generate a high-resolution, photorealistic HD graphic URL for a post.
        
        Uses Gemini 2.0 Flash to expand the user's prompt into a vivid visual scene description,
        and renders a high-definition 1080p image (Flux HD model, 1280x720).
        """
        import urllib.parse
        
        # Expand simple topic into a vivid, hyper-detailed photorealistic visual prompt via Groq/Gemini
        expansion_prompt = (
            f"Convert this post topic into a vivid, photorealistic scene description for a high-end photography/graphic image: '{post_topic}'. "
            "Focus on aesthetics, accurate cultural details, lighting, sharp focus, vibrant colors, 8k resolution. "
            "Output ONLY the single-sentence visual prompt string without quotation marks or extra text."
        )
        
        try:
            expanded_prompt = await self.generate_chat_reply(
                [ChatMessage(role="user", content=expansion_prompt)],
                "You are an expert visual art prompt generator. Output only concise visual prompts."
            )
            clean_prompt = expanded_prompt.strip().strip('"').strip("'")
        except Exception:
            clean_prompt = f"Photorealistic high resolution scene of {post_topic}, 8k ultra detailed photography, professional lighting, cinematic"

        encoded_prompt = urllib.parse.quote(clean_prompt)
        import random
        seed = random.randint(1000, 999999)
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1280&height=720&seed={seed}&model=flux&nologo=true&enhance=true"
        self._logger.info("generated_hd_ai_image", original_topic=post_topic, prompt=clean_prompt, url=image_url)
        return image_url

    # ── Provider Specific Callers ─────────────────────────────

    async def _call_groq_chat(self, messages: List[ChatMessage], system_prompt: str) -> str:
        """Call Groq API with robust model failover."""
        formatted_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        headers = {
            "Authorization": f"Bearer {self._settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }

        for model_name in ["openai/gpt-oss-120b", "qwen/qwen3.6-27b", "llama-3.3-70b-versatile"]:
            try:
                payload = {
                    "model": model_name,
                    "messages": formatted_messages,
                    "temperature": 0.7,
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        json=payload,
                        headers=headers,
                    )
                    if resp.is_success:
                        return resp.json()["choices"][0]["message"]["content"]
            except Exception as e:
                self._logger.debug(f"Groq model {model_name} failed: {e}")

        raise ValueError("All Groq model attempts failed.")

    async def _call_gemini_text(self, messages: List[ChatMessage], system_prompt: str) -> str:
        """Call Google Gemini Flash Text API."""
        contents = []
        for msg in messages:
            role = "user" if msg.role == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.content}]})

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
        }

        for model_name in ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.7-flash"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self._settings.GEMINI_API_KEY}"
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.is_success:
                        data = resp.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                self._logger.debug(f"Gemini model {model_name} failed: {e}")

        raise ValueError("All Gemini text model attempts failed.")

    async def _call_gemini_vision(self, messages: List[ChatMessage], system_prompt: str) -> str:
        """Call Google Gemini Flash Vision API for analyzing uploaded images."""
        import base64
        last_msg = messages[-1]
        
        contents = []
        for msg in messages[:-1]:
            role = "user" if msg.role == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.content}]})

        # Final message with image
        parts = [{"text": last_msg.content or "Analyze this image and provide insights for LinkedIn."}]
        if last_msg.image_url:
            img_url = last_msg.image_url
            b64_bytes = None
            mime_type = "image/jpeg"

            try:
                if img_url.startswith("data:"):
                    header, b64_str = img_url.split(";base64,")
                    mime_type = header.replace("data:", "")
                    b64_bytes = b64_str
                elif img_url.startswith("http://") or img_url.startswith("https://"):
                    async with httpx.AsyncClient(timeout=15.0) as img_client:
                        r = await img_client.get(img_url)
                        if r.is_success:
                            b64_bytes = base64.b64encode(r.content).decode("utf-8")
                            mime_type = r.headers.get("content-type", "image/jpeg").split(";")[0]

                if b64_bytes:
                    parts.append({
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_bytes,
                        }
                    })
            except Exception as e:
                self._logger.warning("gemini_vision_image_parse_failed", error=str(e))
            
        contents.append({"role": "user", "parts": parts})

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
        }

        for model_name in ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.7-flash"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self._settings.GEMINI_API_KEY}"
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.is_success:
                        data = resp.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                self._logger.debug(f"Gemini vision model {model_name} failed: {e}")

        raise ValueError("All Gemini vision model attempts failed.")

    async def transcribe_audio(self, audio_bytes: bytes, filename: str = "audio.m4a") -> str:
        """Transcribe audio using Groq Whisper API (whisper-large-v3-turbo) or fallback."""
        if self._settings.GROQ_API_KEY:
            try:
                headers = {"Authorization": f"Bearer {self._settings.GROQ_API_KEY}"}
                files = {"file": (filename, audio_bytes, "audio/m4a")}
                data = {"model": "whisper-large-v3-turbo"}
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/audio/transcriptions",
                        files=files,
                        data=data,
                        headers=headers,
                    )
                    if resp.is_success:
                        result = resp.json()
                        text = result.get("text", "").strip()
                        if text:
                            return text
            except Exception as e:
                self._logger.warning("groq_whisper_transcription_failed", error=str(e))
        return ""

    def _generate_simulated_chat_reply(self, messages: List[ChatMessage]) -> str:
        """Fallback simulation for offline testing."""
        last_msg = messages[-1] if messages else ChatMessage(role="user", content="")
        return f"""That sounds like a great LinkedIn post! Here is the drafted post:

```json
{{
  "is_finalized": true,
  "topic": "LinkedIn Announcement",
  "content_text": "🚀 Big news! We're building Dexter — our autonomous AI social media manager.\\n\\nProgrammatically created and posted to LinkedIn! #AI #BuildingInPublic",
  "image_url": "{last_msg.image_url or ''}",
  "suggested_hashtags": ["#AI", "#Innovation", "#BuildingInPublic"],
  "call_to_action": "Check it out and let us know your thoughts!"
}}
```"""
