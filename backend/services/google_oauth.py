"""
Google OAuth flow for Saarthi Curious.

Handles:
- Generating the Google consent URL for a given user
- Exchanging the authorization code for a refresh token
- Storing and retrieving tokens from the DB
- Checking connection status
- Disconnecting
"""

import json
import os
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

import requests
from sqlalchemy.orm import Session
from models import UserGoogleToken

from pathlib import Path
from dotenv import load_dotenv

# Ensure .env is loaded regardless of working directory
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or "95621534418-tj95nvfs7ver7rqobc5pr331n2nhtei7.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET") or "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"
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI") or "http://localhost:8000/google/callback"

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
]


def _get_client_id():
    return os.getenv("GOOGLE_CLIENT_ID") or GOOGLE_CLIENT_ID


def _get_client_secret():
    return os.getenv("GOOGLE_CLIENT_SECRET") or GOOGLE_CLIENT_SECRET


def _get_redirect_uri():
    return os.getenv("GOOGLE_REDIRECT_URI") or GOOGLE_REDIRECT_URI


def _require_config():
    if not _get_client_id() or not _get_client_secret() or not _get_redirect_uri():
        raise RuntimeError(
            "Google OAuth is not configured. Missing GOOGLE_CLIENT_ID, "
            "GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI."
        )


def build_auth_url(
    user_id: Optional[int] = None,
    is_personal: bool = False,
    device_id: Optional[str] = None,
    raw_state: Optional[str] = None,
    email: Optional[str] = None,
    redirect_to: Optional[str] = None,
) -> str:
    """
    Build the Google consent URL for a specific user.
    The `state` parameter carries the JSON payload (user_id, is_personal, device_id, email, redirect_to)
    so we know who authorized us and for what device when Google redirects back.
    If `email` is provided, `login_hint` tells Google to preselect that exact account.
    """
    _require_config()

    if raw_state:
        state_str = raw_state
    else:
        state_payload = {
            "user_id": user_id,
            "is_personal": bool(is_personal),
            "device_id": device_id,
            "email": email.strip() if email else None,
            "redirect_to": redirect_to.strip() if redirect_to else None,
        }
        state_str = json.dumps(state_payload)

    params = {
        "client_id": _get_client_id(),
        "redirect_uri": _get_redirect_uri(),
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",       # critical — gives us a refresh token
        "prompt": "consent",             # force consent so we always get refresh_token
        "state": state_str,              # carries user_id, is_personal, device_id
        "include_granted_scopes": "true",
    }

    if email and email.strip():
        params["login_hint"] = email.strip()

    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_tokens(code: str) -> dict:
    """Exchange the auth code for access + refresh tokens."""
    _require_config()

    payload = {
        "code": code,
        "client_id": _get_client_id(),
        "client_secret": _get_client_secret(),
        "redirect_uri": _get_redirect_uri(),
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
    is_personal: bool = False,
    device_id: Optional[str] = None,
) -> UserGoogleToken:
    """Upsert the token row for a user (scoped by is_personal and device_id)."""
    expiry = None
    if expires_in:
        expiry = datetime.utcnow() + timedelta(seconds=int(expires_in))

    # Look for existing token row
    existing = None
    if google_email:
        existing = db.query(UserGoogleToken).filter(
            UserGoogleToken.user_id == user_id,
            UserGoogleToken.google_email == google_email
        ).first()

    if not existing and is_personal and device_id:
        existing = db.query(UserGoogleToken).filter(
            UserGoogleToken.user_id == user_id,
            UserGoogleToken.is_personal == is_personal,
            UserGoogleToken.device_id == device_id
        ).first()

    if not existing:
        existing = db.query(UserGoogleToken).filter(
            UserGoogleToken.user_id == user_id,
            UserGoogleToken.is_personal == is_personal
        ).first()

    if existing:
        if refresh_token and refresh_token != "pending_auth":
            existing.refresh_token = refresh_token
        if access_token:
            existing.access_token = access_token
        if expiry:
            existing.token_expiry = expiry
        if google_email:
            existing.google_email = google_email
        if device_id:
            existing.device_id = device_id
        existing.is_personal = is_personal
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
        is_personal=is_personal,
        device_id=device_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_token_row(
    db: Session,
    user_id: int,
    is_personal: bool = False,
    device_id: Optional[str] = None,
) -> Optional[UserGoogleToken]:
    query = db.query(UserGoogleToken).filter(
        UserGoogleToken.user_id == user_id,
        UserGoogleToken.refresh_token.isnot(None),
        UserGoogleToken.refresh_token != "pending_auth",
        UserGoogleToken.refresh_token != "",
    )
    if is_personal and device_id:
        row = (
            query.filter(UserGoogleToken.device_id == device_id)
            .order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc())
            .first()
        )
        if row:
            return row
    return (
        query.filter(UserGoogleToken.is_personal == is_personal)
        .order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc())
        .first()
    )


def is_connected(
    db: Session,
    user_id: int,
    is_personal: bool = False,
    device_id: Optional[str] = None,
) -> bool:
    row = get_token_row(db, user_id, is_personal=is_personal, device_id=device_id)
    return row is not None and bool(row.refresh_token) and row.refresh_token != "pending_auth"


def disconnect_user(
    db: Session,
    user_id: int,
    is_personal: Optional[bool] = None,
    device_id: Optional[str] = None,
) -> bool:
    query = db.query(UserGoogleToken).filter(UserGoogleToken.user_id == user_id)
    if is_personal is not None:
        query = query.filter(UserGoogleToken.is_personal == is_personal)
        if is_personal and device_id:
            query = query.filter(UserGoogleToken.device_id == device_id)
    rows = query.all()
    if not rows:
        return False
    for r in rows:
        db.delete(r)
    db.commit()
    return True
