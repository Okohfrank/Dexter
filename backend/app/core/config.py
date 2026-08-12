"""Configuration management using Pydantic BaseSettings."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings, populated from environment variables and .env file."""
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_NAME: str = Field(default="Dexter")
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=False)
    API_V1_PREFIX: str = Field(default="/api/v1")

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    TOKEN_ENCRYPTION_KEY: str

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # LinkedIn OAuth
    LINKEDIN_CLIENT_ID: str = Field(default="")
    LINKEDIN_CLIENT_SECRET: str = Field(default="")
    LINKEDIN_REDIRECT_URI: str = Field(default="")

    # Instagram
    INSTAGRAM_APP_ID: str = Field(default="")
    INSTAGRAM_APP_SECRET: str = Field(default="")

    # TikTok
    TIKTOK_CLIENT_KEY: str = Field(default="")
    TIKTOK_CLIENT_SECRET: str = Field(default="")

    # OpenAI
    OPENAI_API_KEY: str = Field(default="")

    # Anthropic (Claude 3.5 Sonnet)
    ANTHROPIC_API_KEY: str = Field(default="")

    # Groq (Llama 3.3 70B - Free)
    GROQ_API_KEY: str = Field(default="")

    # Google Gemini (Gemini 2.0 Flash - Free)
    GEMINI_API_KEY: str = Field(default="")

    # Miso AI (Conversational Model - misolabs.ai)
    MISO_API_KEY: str = Field(default="")
    MISO_BASE_URL: str = Field(default="https://api.misolabs.ai/v1")

    @property
    def is_production(self) -> bool:
        """Return True if the current environment is production."""
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Return True if the current environment is development."""
        return self.ENVIRONMENT.lower() == "development"


@lru_cache()
def get_settings() -> Settings:
    """Return the cached application settings."""
    return Settings()

__all__ = ["Settings", "get_settings"]
