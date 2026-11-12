import hmac
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import (
    VerifyMismatchError,
    VerificationError,
    InvalidHashError,
)
from itsdangerous import URLSafeTimedSerializer, BadSignature

from app.core.config import settings


# Password hashing
password_hasher = PasswordHasher()

# Signed session configuration
SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

session_serializer = URLSafeTimedSerializer(
    settings.session_secret_key,
    salt="agentic-recruiter-session-v1",
)


def hash_password(password: str) -> str:
    """Hash a password using Argon2."""
    if not password:
        raise ValueError("Password cannot be empty.")

    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its Argon2 hash."""
    try:
        return password_hasher.verify(hashed_password, password)
    except (
        VerifyMismatchError,
        VerificationError,
        InvalidHashError,
    ):
        return False


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token."""
    return secrets.token_urlsafe(32)


def verify_csrf_token(
    cookie_token: str | None,
    header_token: str | None,
) -> bool:
    """Compare the CSRF cookie token with the request header token."""
    if not cookie_token or not header_token:
        return False

    return hmac.compare_digest(cookie_token, header_token)


def create_session_token(user_id: str) -> str:
    """Create a signed session token for a user."""
    return session_serializer.dumps({"user_id": str(user_id)})


def verify_session_token(token: str) -> str | None:
    """Verify a session token and return its user ID if valid."""
    try:
        payload = session_serializer.loads(
            token,
            max_age=SESSION_MAX_AGE_SECONDS,
        )
    except (BadSignature, TypeError):
        return None

    if not isinstance(payload, dict):
        return None

    user_id = payload.get("user_id")

    if not isinstance(user_id, str) or not user_id:
        return None

    return user_id
