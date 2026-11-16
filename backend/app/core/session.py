

from fastapi import Request, Response
from fastapi import HTTPException, status
from app.core.security import verify_csrf_token

from app.core.security import (
    create_session_token,
    verify_session_token,
    generate_csrf_token,
    SESSION_MAX_AGE_SECONDS,
)


# ============================================================
# SESSION COOKIE
# ============================================================

SESSION_COOKIE_NAME = "agentic_session"


def set_session_cookie(response: Response, user_id: str) -> None:
    """Create a signed session and store it in an HTTP-only cookie."""

    token = create_session_token(user_id)

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        secure=False,  # Set to True when deployed over HTTPS
        samesite="lax",
        path="/",
    )


def get_session_user_id(request: Request) -> str | None:
    """Retrieve and verify the current user's session."""

    token = request.cookies.get(SESSION_COOKIE_NAME)

    if not token:
        return None

    return verify_session_token(token)


def clear_session_cookie(response: Response) -> None:
    """Remove the session cookie during logout."""

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )


# ============================================================
# CSRF COOKIE
# ============================================================

CSRF_COOKIE_NAME = "agentic_csrf"


def set_csrf_cookie(response: Response) -> str:
    """Generate and store a CSRF token in a readable cookie."""

    token = generate_csrf_token()

    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=False,
        secure=False,  # Set to True when deployed over HTTPS
        samesite="lax",
        path="/",
    )

    return token


def clear_csrf_cookie(response: Response) -> None:
    """Remove the CSRF cookie."""

    response.delete_cookie(
        key=CSRF_COOKIE_NAME,
        httponly=False,
        secure=False,
        samesite="lax",
        path="/",
    )

def verify_csrf_protection(request: Request) -> None:
    """Validate the CSRF cookie against the request header."""

    cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
    header_token = request.headers.get("X-CSRF-Token")

    if not verify_csrf_token(cookie_token, header_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF validation failed.",
        )

