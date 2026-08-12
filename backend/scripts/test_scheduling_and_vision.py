"""
Dexter — Full Interactive Test: Autonomous Scheduling, User Overrides, Vision & Voice
=======================================================================================

Features tested:
  1. Campaign Scheduling (e.g., "500 followers by month's end" -> Multi-day queue)
  2. Frontend Schedule Page Simulation & Urgent Overrides
  3. Image Processing (Gemini 2.0 Flash Vision reading picture graphics)
  4. Voice Input Simulation

Usage:
    cd backend
    .venv\Scripts\python.exe scripts/test_scheduling_and_vision.py
"""

import asyncio
import sys
import os
import json
import webbrowser
from datetime import datetime, timedelta, timezone

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:8000/api/v1/oauth/linkedin/callback")


async def main():
    print()
    print("=" * 75)
    print(" 🚀 DEXTER — Interactive Autonomous Campaign Scheduling & Vision Test")
    print("=" * 75)
    print("  1. Test Autonomous Campaign Scheduling & Overrides")
    print("  2. Test Image Processing (Gemini Vision)")
    print("  3. Test Voice Input Simulation")
    print("  4. Exit")
    print("=" * 75)

    choice = input("\nSelect an option (1-4): ").strip()

    if choice == "1":
        await test_autonomous_scheduling()
    elif choice == "2":
        await test_image_processing()
    elif choice == "3":
        await test_voice_input()
    else:
        print("Exiting test menu.")


async def test_autonomous_scheduling():
    print("\n--- 1. AUTONOMOUS CAMPAIGN SCHEDULING & OVERRIDES ---")
    goal = input("\nEnter your goal (e.g. 'I want 500 followers by month's end'): ").strip()
    if not goal:
        goal = "I want 500 followers by month's end with daily thought leadership posts."

    print(f"\n🤖 DEXTER (Groq Llama 3.3 70B) is generating your multi-post schedule for goal: \"{goal}\"...\n")

    from app.core.llm import LLMGateway
    from app.schemas.chat import ChatMessage
    gateway = LLMGateway()

    prompt = f"""
    User Goal: "{goal}"
    Generate a 3-post initial schedule to kick off this goal.
    Return JSON format:
    ```json
    {{
      "campaign_title": "500 Follower Growth Engine",
      "scheduled_posts": [
        {{
          "offset_minutes": 0,
          "topic": "Day 1 - Major Announcement",
          "content_text": "🚀 We're aiming for 500 new connections this month! Here is our vision for building autonomous AI tools. What is your top tech priority this year? #AI #Growth #Innovation"
        }},
        {{
          "offset_minutes": 1440,
          "topic": "Day 2 - Technical Deep Dive",
          "content_text": "💡 How multi-agent AI systems automate repetitive workflows without hardcoded scripts. #TechLeadership #Engineering"
        }},
        {{
          "offset_minutes": 2880,
          "topic": "Day 3 - Community Engagement",
          "content_text": "🔥 Question for founders and engineers: What tool has saved you the most time this month? #Productivity #Startup"
        }}
      ]
    }}
    ```
    """

    res = await gateway.generate_chat_reply([ChatMessage(role="user", content=prompt)], "You are Dexter's Campaign Strategist.")
    
    plan_data = {}
    if "```json" in res:
        try:
            plan_data = json.loads(res.split("```json")[1].split("```")[0].strip())
        except Exception:
            pass

    posts = plan_data.get("scheduled_posts", [
        {
            "offset_minutes": 0,
            "topic": "Kickoff Post",
            "content_text": "🚀 Launching our 500 follower growth campaign! Powered by Dexter AI."
        }
    ])

    print("=" * 75)
    print(f" 📋 FRONTEND SCHEDULE PAGE PREVIEW (Campaign: {plan_data.get('campaign_title', 'Growth Plan')})")
    print("=" * 75)
    
    now = datetime.now()
    for idx, p in enumerate(posts, 1):
        time_str = (now + timedelta(minutes=p.get("offset_minutes", 0))).strftime("%Y-%m-%d %H:%M")
        print(f"\n  [Post #{idx}] Status: QUEUED  | Scheduled For: {time_str}")
        print(f"  Topic: {p.get('topic')}")
        print(f"  Content: \"{p.get('content_text')[:100]}...\"")

    print("\n" + "=" * 75)
    print(" 🛠️ OVERRIDE OPTIONS:")
    print("  a) Approve and publish Post #1 NOW directly to LinkedIn")
    print("  b) Edit/Override Post #1 text before publishing")
    print("  c) Cancel schedule")
    print("=" * 75)

    act = input("\nSelect action (a/b/c): ").strip().lower()

    if act == "b":
        new_text = input("\nEnter your new override text for Post #1: ").strip()
        if new_text:
            posts[0]["content_text"] = new_text
            print(f"✅ Post #1 text updated to: \"{new_text}\"")
        act = "a"  # Proceed to publish updated text

    if act == "a":
        print("\n🚀 Executing Post #1 to your real LinkedIn feed...")
        await publish_text_to_linkedin(posts[0]["content_text"])


async def test_image_processing():
    print("\n--- 2. IMAGE PROCESSING & AI IMAGE GENERATION TEST ---")
    print("  a) User provides a picture -> Gemini Vision analyzes it & tailors post write-up to match photo")
    print("  b) User has NO picture -> Dexter generates a custom AI graphic for the post automatically")
    
    sub = input("\nSelect (a or b): ").strip().lower()

    from app.core.llm import LLMGateway
    from app.schemas.chat import ChatMessage
    gateway = LLMGateway()

    if sub == "a":
        img_url = input("\nEnter image URL (or press Enter for sample photo): ").strip()
        if not img_url:
            img_url = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800"

        print(f"\n📸 Image URL: {img_url}")
        print("🤖 DEXTER (Gemini 2.0 Flash Vision) is analyzing your picture and tailoring the write-up to it...\n")

        msg = ChatMessage(
            role="user",
            content="Inspect this uploaded photo carefully. Write a compelling LinkedIn post tailored specifically to what you see in the photo.",
            image_url=img_url
        )
        reply = await gateway.generate_chat_reply([msg], "You are Dexter's Multimodal Visual Strategist.")

        print("=" * 75)
        print(" 🎨 TAILORED WRITE-UP FROM YOUR PICTURE:")
        print("=" * 75)
        print(f"\n{reply}\n")
        print("=" * 75)

    else:
        topic = input("\nEnter post topic (e.g., 'Autonomous AI Agents in Software Engineering'): ").strip()
        if not topic:
            topic = "Autonomous AI Agents in Software Engineering"

        print(f"\n🤖 User has no picture. Dexter is writing the post and generating a custom AI graphic for topic: \"{topic}\"...\n")
        
        post_text = await gateway.generate_linkedin_copy(topic)
        ai_image_url = await gateway.generate_image_for_post(topic)

        print("=" * 75)
        print(" ✍️ DEXTER WRITE-UP:")
        print("=" * 75)
        print(f"\n{post_text}\n")
        print("=" * 75)
        print(f"🖼️ AUTO-GENERATED AI GRAPHIC URL: {ai_image_url}")
        print("=" * 75)


async def test_voice_input():
    print("\n--- 3. VOICE INPUT SIMULATION ---")
    print("In the web app, the browser Web Speech API converts your spoken voice to text in real time.")
    voice_transcript = input("\nSpeak (or type) your voice prompt: ").strip()
    if not voice_transcript:
        voice_transcript = "Hey Dexter, write a short post about how AI saves 10 hours a week for founders."

    print(f"\n🎙️ Voice Transcribed: \"{voice_transcript}\"")
    print("🤖 DEXTER is processing your voice request...\n")

    from app.core.llm import LLMGateway
    from app.schemas.chat import ChatMessage
    gateway = LLMGateway()

    reply = await gateway.generate_chat_reply(
        [ChatMessage(role="user", content=voice_transcript)],
        "You are Dexter's voice-activated social media assistant."
    )

    print("=" * 75)
    print(f"🤖 DEXTER:\n{reply}\n")
    print("=" * 75)


async def publish_text_to_linkedin(text_content: str):
    from app.integrations.linkedin.oauth import LinkedInOAuth
    from app.integrations.linkedin.client import LinkedInClient
    from app.integrations.linkedin.publisher import LinkedInPublisher

    oauth = LinkedInOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
    )
    state = f"sched_{datetime.now().strftime('%Y%m%d%H%M%S')}"
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
        print("❌ Authorization timed out.")
        return

    tokens = await oauth.exchange_code_for_tokens(auth_code)
    client = LinkedInClient(access_token=tokens.access_token)
    publisher = LinkedInPublisher(client=client)

    prof = await publisher.get_profile()
    author_urn = f"urn:li:person:{prof.sub}"

    post_urn = await publisher.publish_text(author_urn=author_urn, text=text_content)
    print("\n" + "=" * 75)
    print(f"  ✅ LIVE POST PUBLISHED TO LINKEDIN! URN: {post_urn}")
    print(f"  🔗 View Post: https://www.linkedin.com/feed/update/{post_urn}")
    print("=" * 75 + "\n")

    await client.close()
    await oauth.close()


if __name__ == "__main__":
    asyncio.run(main())
