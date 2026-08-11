"""
Dexter — LinkedIn Integration Test Script
==========================================

Tests the full LinkedIn publishing pipeline:
  1. Opens browser for OAuth consent
  2. Captures the authorization code via a temporary local server
  3. Exchanges code for access token
  4. Fetches your LinkedIn profile
  5. Posts a test message to your feed

Usage:
    cd backend
    .venv\Scripts\python.exe scripts/test_linkedin.py

WARNING: This will post to your REAL LinkedIn account.
"""

import asyncio
import sys
import os
import webbrowser
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread
from datetime import datetime

# Add backend to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


# ─── Configuration ───────────────────────────────────────────────────────────

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:8000/api/v1/oauth/linkedin/callback")

# Parse port from redirect URI
_parsed = urllib.parse.urlparse(REDIRECT_URI)
CALLBACK_PORT = _parsed.port or 8000
CALLBACK_PATH = _parsed.path


# ─── Step 1: Capture OAuth Callback ─────────────────────────────────────────

authorization_code = None
authorization_state = None


class OAuthCallbackHandler(BaseHTTPRequestHandler):
    """Temporary HTTP handler to capture the OAuth redirect."""

    def do_GET(self):
        global authorization_code, authorization_state

        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if "code" in params:
            authorization_code = params["code"][0]
            authorization_state = params.get("state", [None])[0]

            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(b"""
                <html>
                <body style="font-family: Inter, sans-serif; display: flex; 
                             justify-content: center; align-items: center; 
                             height: 100vh; background: #0a0a0a; color: #fff;">
                    <div style="text-align: center;">
                        <h1 style="font-size: 3rem;">&#10003; Dexter Connected</h1>
                        <p style="color: #888; font-size: 1.2rem;">
                            Authorization successful. You can close this tab.
                        </p>
                    </div>
                </body>
                </html>
            """)
        elif "error" in params:
            error = params["error"][0]
            desc = params.get("error_description", ["Unknown error"])[0]
            self.send_response(400)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(f"""
                <html>
                <body style="font-family: Inter, sans-serif; display: flex; 
                             justify-content: center; align-items: center; 
                             height: 100vh; background: #0a0a0a; color: #ff4444;">
                    <div style="text-align: center;">
                        <h1>&#10007; Authorization Failed</h1>
                        <p>{error}: {desc}</p>
                    </div>
                </body>
                </html>
            """.encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress default logging


def start_callback_server() -> HTTPServer:
    """Start a temporary HTTP server to capture the OAuth callback."""
    server = HTTPServer(("127.0.0.1", CALLBACK_PORT), OAuthCallbackHandler)
    thread = Thread(target=server.handle_request, daemon=True)
    thread.start()
    return server


# ─── Step 2: Run the Full Test ───────────────────────────────────────────────

async def main():
    print()
    print("=" * 60)
    print("  DEXTER — LinkedIn Integration Test")
    print("=" * 60)
    print()

    # ── Validate credentials ──
    if not CLIENT_ID or CLIENT_ID == "your-linkedin-client-id":
        print("ERROR: LINKEDIN_CLIENT_ID not set in .env")
        print()
        print("Steps:")
        print("  1. Go to https://www.linkedin.com/developers/apps")
        print("  2. Create an app or select existing")
        print("  3. Copy Client ID and Client Secret")
        print("  4. Paste them in backend/.env")
        return

    if not CLIENT_SECRET or CLIENT_SECRET == "your-linkedin-client-secret":
        print("ERROR: LINKEDIN_CLIENT_SECRET not set in .env")
        return

    print(f"  Client ID:    {CLIENT_ID[:8]}...{CLIENT_ID[-4:]}")
    print(f"  Redirect URI: {REDIRECT_URI}")
    print()

    # ── Import our LinkedIn integration ──
    from app.integrations.linkedin.oauth import LinkedInOAuth
    from app.integrations.linkedin.client import LinkedInClient
    from app.integrations.linkedin.publisher import LinkedInPublisher

    oauth = LinkedInOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
    )

    # ── Step 1: Generate auth URL and open browser ──
    print("[1/5] Opening LinkedIn authorization page...")
    state = f"test_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    auth_url = oauth.get_authorization_url(state=state)

    # Start temporary server to capture callback
    print(f"      Starting callback server on port {CALLBACK_PORT}...")
    server = start_callback_server()

    # Open browser
    webbrowser.open(auth_url)
    print("      Waiting for you to authorize in the browser...")
    print()

    # Wait for the callback (with timeout)
    import time
    timeout = 120  # 2 minutes
    start = time.time()
    while authorization_code is None and (time.time() - start) < timeout:
        await asyncio.sleep(0.5)

    server.server_close()

    if not authorization_code:
        print("ERROR: Timed out waiting for authorization (2 minutes)")
        return

    print(f"[2/5] Authorization code received: {authorization_code[:15]}...")
    print()

    # ── Step 2: Exchange code for tokens ──
    print("[3/5] Exchanging code for access token...")
    try:
        token_response = await oauth.exchange_code_for_tokens(authorization_code)
        access_token = token_response.access_token
        print(f"      Access token: {access_token[:20]}...  (expires in {token_response.expires_in}s)")
        print()
    except Exception as e:
        print(f"ERROR: Token exchange failed: {e}")
        await oauth.close()
        return

    # ── Step 3: Fetch profile ──
    print("[4/5] Fetching your LinkedIn profile...")
    client = LinkedInClient(access_token=access_token)
    publisher = LinkedInPublisher(client=client)

    try:
        profile = await publisher.get_profile()
        author_urn = f"urn:li:person:{profile.sub}"
        print(f"      Name: {profile.name}")
        print(f"      Email: {profile.email or 'N/A'}")
        print(f"      URN: {author_urn}")
        print()
    except Exception as e:
        print(f"ERROR: Profile fetch failed: {e}")
        await client.close()
        await oauth.close()
        return

    # ── Step 4: Publish a test post ──
    test_message = (
        "Testing Dexter — our autonomous AI social media engine. "
        "This post was published programmatically via the LinkedIn API. "
        f"🤖 #{datetime.now().strftime('%Y%m%d')}"
    )

    print("[5/5] Publishing test post to LinkedIn...")
    print(f"      Text: \"{test_message[:60]}...\"")
    print()

    try:
        post_urn = await publisher.publish_text(
            author_urn=author_urn,
            text=test_message,
        )
        print("=" * 60)
        print("  ✅ SUCCESS — Post published to LinkedIn!")
        print(f"  Post URN: {post_urn}")
        print()
        print("  Check your LinkedIn feed to see it.")
        print("  You can delete it from LinkedIn if this was just a test.")
        print("=" * 60)
    except Exception as e:
        print(f"  ❌ FAILED — {e}")
        print()
        print("  Common fixes:")
        print("    - Ensure 'Share on LinkedIn' product is approved")
        print("    - Check that w_member_social scope was granted")
        print("    - LinkedIn may take up to 48h to approve new apps")

    # Cleanup
    await client.close()
    await oauth.close()
    print()


if __name__ == "__main__":
    asyncio.run(main())
