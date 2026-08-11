"""Constants for LinkedIn API integration."""

# API
API_BASE_URL = "https://api.linkedin.com/v2"
API_REST_BASE_URL = "https://api.linkedin.com/rest"
API_VERSION = "202601"

# OAuth
AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"

# Scopes
DEFAULT_SCOPES = [
    "openid",
    "profile",
    "email",
    "w_member_social",
]

# Rate Limits
DAILY_POST_LIMIT = 100
API_RATE_LIMIT_PER_DAY = 100_000

# Content Constraints
MAX_TEXT_LENGTH = 3000
MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024  # 8MB
SUPPORTED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/gif"]
MAX_IMAGES_PER_POST = 9

# Timeouts
DEFAULT_TIMEOUT_SECONDS = 30
UPLOAD_TIMEOUT_SECONDS = 120

# Retry
MAX_RETRIES = 3
RETRY_BACKOFF_FACTOR = 2
