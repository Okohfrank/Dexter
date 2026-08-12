"""
Dexter — 100% Dynamic Interactive AI Agent Chat (Zero Hardcoding)
===================================================================

This script connects your terminal directly to Groq Llama 3.3 70B & LinkedIn.
There are ZERO hardcoded templates or text. Every single response is generated 
100% dynamically by the AI model in real time based on your exact input.

Usage:
    cd backend
    .venv\Scripts\python.exe scripts/interactive_ai_chat.py
"""

import asyncio
import sys
import os
import json
import webbrowser
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:8000/api/v1/oauth/linkedin/callback")

SYSTEM_PROMPT = """You are Dexter, an autonomous AI Social Media Manager powered by Llama 3.3 70B.
Your job is to talk with the user, understand their social media growth goals, create content strategies, and draft LinkedIn posts.

Instructions:
1. Respond naturally to whatever the user says or asks.
2. If the user asks for a strategy, growth plan, or post draft, generate it dynamically.
3. If you have drafted a post that is ready to publish to LinkedIn, include a JSON block at the very end of your response like this:

```json
{
  "ready_to_post": true,
  "topic": "Brief topic",
  "content_text": "The complete post text to publish"
}
```
Otherwise, just converse naturally. Never use hardcoded templates or rigid scripts.
"""


async def main():
    print()
    print("=" * 70)
    print("  💬 DEXTER — Dynamic Real-Time AI Agent Chat (Groq Llama 3.3 70B)")
    print("  (Zero hardcoded text — 100% live AI generation)")
    print("=" * 70)
    print("  Type your message below (or type 'exit' to quit).")
    print()

    from app.core.llm import LLMGateway
    from app.schemas.chat import ChatMessage
    
    gateway = LLMGateway()
    conversation_history = []

    # Optional LinkedIn publisher handles
    publisher = None
    author_urn = None

    while True:
        try:
            user_input = input("YOU > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting chat.")
            break

        if not user_input:
            continue
        if user_input.lower() in ["exit", "quit", "q"]:
            print("\nGoodbye!")
            break

        conversation_history.append(ChatMessage(role="user", content=user_input))

        print("\n🤖 DEXTER (Thinking...)", end="\r")

        # 100% Live Call to Groq Llama 3.3 70B
        ai_reply = await gateway.generate_chat_reply(conversation_history, SYSTEM_PROMPT)
        
        # Remove thinking indicator
        print(" " * 30, end="\r")

        # Extract clean reply text
        clean_text = ai_reply
        post_data = None

        if "```json" in ai_reply:
            try:
                parts = ai_reply.split("```json")
                clean_text = parts[0].strip()
                json_block = parts[1].split("```")[0].strip()
                post_data = json.loads(json_block)
            except Exception:
                pass

        print(f"\n🤖 DEXTER:\n{clean_text}\n")
        
        # Save AI reply to history for multi-turn conversation context
        conversation_history.append(ChatMessage(role="assistant", content=ai_reply))

        # If AI generated a ready_to_post object, offer live publishing
        if post_data and post_data.get("ready_to_post"):
            draft_text = post_data.get("content_text", "")
            print("-" * 70)
            print("🚀 DEXTER PROPOSES THIS POST FOR YOUR LINKEDIN:")
            print(f"\"{draft_text}\"")
            print("-" * 70)

            confirm = input("\nWould you like Dexter to publish this live to your LinkedIn now? (yes/no): ").strip().lower()
            
            if confirm in ["yes", "y"]:
                print("\n[1/2] Connecting to LinkedIn...")
                
                if not publisher:
                    from app.integrations.linkedin.oauth import LinkedInOAuth
                    from app.integrations.linkedin.client import LinkedInClient
                    from app.integrations.linkedin.publisher import LinkedInPublisher

                    oauth = LinkedInOAuth(
                        client_id=CLIENT_ID,
                        client_secret=CLIENT_SECRET,
                        redirect_uri=REDIRECT_URI,
                    )
                    state = f"chat_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    auth_url = oauth.get_authorization_url(state=state)

                    auth_code = None

                    class CallbackHandler(BaseHTTPRequestHandler):
                        def do_GET(self):
                            nonlocal auth_code
                            import urllib.parse
                            params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                            if "code" in params:
                                auth_code = params["code"][0]
                                self.send_response(200)
                                self.send_header("Content-Type", "text/html")
                                self.end_headers()
                                self.wfile.write(b"<html><body style='font-family:sans-serif;background:#0a0a0a;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;'><h1>&#10003; Post Approved! Publishing to LinkedIn...</h1></body></html>")

                        def log_message(self, format, *args):
                            pass

                    server = HTTPServer(("127.0.0.1", 8000), CallbackHandler)
                    Thread(target=server.handle_request, daemon=True).start()

                    webbrowser.open(auth_url)

                    import time
                    start_t = time.time()
                    while auth_code is None and (time.time() - start_t) < 60:
                        await asyncio.sleep(0.5)

                    server.server_close()

                    if not auth_code:
                        print("❌ Failed: Authorization timed out.")
                        continue

                    tokens = await oauth.exchange_code_for_tokens(auth_code)
                    client = LinkedInClient(access_token=tokens.access_token)
                    publisher = LinkedInPublisher(client=client)

                    prof = await publisher.get_profile()
                    author_urn = f"urn:li:person:{prof.sub}"

                print("[2/2] Publishing live post to LinkedIn...")
                try:
                    post_urn = await publisher.publish_text(author_urn=author_urn, text=draft_text)
                    print("\n" + "=" * 70)
                    print(f"✅ LIVE POST PUBLISHED! URN: {post_urn}")
                    print(f"🔗 View Post: https://www.linkedin.com/feed/update/{post_urn}")
                    print("=" * 70 + "\n")
                except Exception as ex:
                    print(f"❌ Publishing error: {ex}\n")
            else:
                print("\nPost kept as draft. Tell Dexter how you'd like to edit it!\n")


if __name__ == "__main__":
    asyncio.run(main())
