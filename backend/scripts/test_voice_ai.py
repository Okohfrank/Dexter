"""
Dexter — Spoken Conversational Voice AI Test
============================================

Tests Bidirectional Conversational Voice AI:
  1. You type or speak a message to Dexter.
  2. Groq (Llama 3.3 70B) generates a natural conversational reply.
  3. Dexter converts the text into natural human neural speech and SPEAKS BACK to you out loud!

Usage:
    cd backend
    .venv\Scripts\python.exe scripts/test_voice_ai.py
"""

import asyncio
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


async def main():
    print()
    print("=" * 70)
    print(" 🎙️ DEXTER — Bidirectional Conversational Voice AI")
    print(" (Hears your input & speaks back out loud with neural voice)")
    print("=" * 70)
    print()

    from app.services.voice_service import VoiceService
    voice_service = VoiceService()

    while True:
        try:
            user_input = input("YOU (Speak/Type) > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nVoice session ended.")
            break

        if not user_input:
            continue
        if user_input.lower() in ["exit", "quit", "q"]:
            print("\nGoodbye!")
            break

        print("\n🤖 DEXTER is thinking & generating spoken audio...", end="\r")

        audio_file = os.path.join(os.path.dirname(__file__), "dexter_reply.mp3")
        ai_reply, saved_path = await voice_service.converse_with_voice(user_input, audio_file)

        print(" " * 50, end="\r")
        print(f"🤖 DEXTER (Spoken Text): \"{ai_reply}\"")
        print(f"🔊 Playing Audio ({saved_path})...\n")

        # Play audio through system default player or powershell audio
        try:
            if sys.platform == "win32":
                os.system(f'powershell -c "(New-Object Media.SoundPlayer \'{saved_path}\').PlaySync()" 2>$null || start "" "{saved_path}"')
            else:
                os.system(f'afplay "{saved_path}" || mpg123 "{saved_path}" || vlc "{saved_path}"')
        except Exception:
            pass


if __name__ == "__main__":
    asyncio.run(main())
