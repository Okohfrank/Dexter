"""Security utilities for password hashing and JWT token management."""

from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.exceptions import DexterAuthError

settings = get_settings()

import bcrypt

ALGORITHM = "HS256"


class TokenPayload(BaseModel):
    """Payload definition for JSON Web Tokens."""
    sub: uuid.UUID
    exp: datetime
    type: str


def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt directly."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a hashed password."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict[str, Any]) -> str:
    """Create a new JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_verification_token(user_id: uuid.UUID) -> str:
    """Create a short-lived JWT used to verify a user's email address."""
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.EMAIL_VERIFICATION_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire, "type": "verify"},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def create_password_reset_token(user_id: uuid.UUID) -> str:
    """Create a short-lived JWT used to reset a user's password."""
    expire = datetime.now(timezone.utc) + timedelta(hours=2)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire, "type": "reset_password"},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def verify_token(token: str) -> TokenPayload:
    """Verify and parse a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return TokenPayload(**payload)
    except JWTError as e:
        raise DexterAuthError(detail="Could not validate credentials") from e
    except ValueError as e:
        raise DexterAuthError(detail="Invalid token payload") from e

__all__ = [
    "TokenPayload",
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "create_verification_token",
    "create_password_reset_token",
    "verify_token"
]

