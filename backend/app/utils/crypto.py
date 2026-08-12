"""Cryptography utilities for tokens and sensitive data."""

import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class TokenEncryptor:
    """Encrypts and decrypts OAuth tokens for storage.
    
    Uses Fernet symmetric encryption derived from SECRET_KEY.
    """
    
    def __init__(self, secret_key: str):
        """Initialize encryptor with the app's secret key."""
        # Derive a 32-byte URL-safe base64-encoded key from the secret key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"dexter-token-salt",
            iterations=480000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(secret_key.encode("utf-8")))
        self._fernet = Fernet(key)
        
    def encrypt(self, plaintext: str) -> str:
        """Encrypt a plain token."""
        return self._fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")
        
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt an encrypted token."""
        return self._fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
