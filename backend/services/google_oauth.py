"""
Google OAuth flow for Saarthi Curious.

Handles:
- Generating the Google consent URL for a given user
- Exchanging the authorization code for a refresh token
- Storing and retrieving tokens from the DB
- Checking connection status
- Disconnecting
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

import requests
from sqlalchemy.orm import Session

from models import UserGoogleToken


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
]


def _require_config():
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not GOOGLE_REDIRECT_URI:
        raise RuntimeError(
            "Google OAuth is not configured. Missing GOOGLE_CLIENT_ID, "
            "GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI."
        )


def build_auth_url(user_id: int) -> str:
    """
    Build the Google consent URL for a specific user.
    The `state` parameter carries the user_id so we know who authorized us
    when Google redirects back.
    """
    _require_config()

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",       # critical — gives us a refresh token
        "prompt": "consent",             # force consent so we always get refresh_token
        "state": str(user_id),           # so we know which user is connecting
        "include_granted_scopes": "true",
    }

    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_tokens(code: str) -> dict:
    """Exchange the auth code for access + refresh tokens."""
    _require_config()

    payload = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    response = requests.post(GOOGLE_TOKEN_URL, data=payload, timeout=15)
    response.raise_for_status()
    return response.json()


def fetch_google_email(access_token: str) -> Optional[str]:
    """Get the email address of the Google account that just authorized."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(GOOGLE_USERINFO_URL, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json().get("email")
    except Exception as e:
        print(f"[Google OAuth] Failed to fetch email: {e}")
    return None


def save_tokens(
    db: Session,
    user_id: int,
    refresh_token: str,
    access_token: Optional[str],
    expires_in: Optional[int],
    google_email: Optional[str],
) -> UserGoogleToken:
    """Upsert the token row for a user."""
    expiry = None
    if expires_in:
        expiry = datetime.utcnow() + timedelta(seconds=int(expires_in))

    existing = (
        db.query(UserGoogleToken)
        .filter(UserGoogleToken.user_id == user_id)
        .first()
    )

    if existing:
        existing.refresh_token = refresh_token
        existing.access_token = access_token
        existing.token_expiry = expiry
        existing.google_email = google_email
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    row = UserGoogleToken(
        user_id=user_id,
        refresh_token=refresh_token,
        access_token=access_token,
        token_expiry=expiry,
        google_email=google_email,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_token_row(db: Session, user_id: int) -> Optional[UserGoogleToken]:
    return (
        db.query(UserGoogleToken)
        .filter(UserGoogleToken.user_id == user_id)
        .first()
    )


def is_connected(db: Session, user_id: int) -> bool:
    row = get_token_row(db, user_id)
    return row is not None and bool(row.refresh_token)


def disconnect_user(db: Session, user_id: int) -> bool:
    row = get_token_row(db, user_id)
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True