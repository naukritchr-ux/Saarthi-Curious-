"""
Google Calendar OAuth routes for Saarthi Curious.

- GET  /google/connect          -> redirect user to Google consent screen
- GET  /google/callback         -> receive code, save tokens, redirect back
- POST /google/disconnect       -> remove the user's stored tokens
- GET  /google/status           -> is the current user connected?
"""

import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from services import google_oauth


router = APIRouter(prefix="/google", tags=["Google Calendar"])

FRONTEND_REDIRECT = os.getenv(
    "GOOGLE_FRONTEND_REDIRECT",
    "https://saarthi-curious.vercel.app/settings",
)


@router.get("/connect")
def connect(
    user_id: int = Query(..., description="User ID to connect for"),
):
    """
    Kick off the Google OAuth flow.
    Frontend opens this URL; user is redirected to Google's consent screen.
    """
    try:
        url = google_oauth.build_auth_url(user_id)
        return RedirectResponse(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth config error: {e}")


@router.get("/callback")
def callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Google redirects here after user approves.
    Exchange the code for tokens, save them, send the user back to the frontend.
    """
    try:
        user_id = int(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    try:
        tokens = google_oauth.exchange_code_for_tokens(code)
    except Exception as e:
        print(f"[Google OAuth] Code exchange failed: {e}")
        return RedirectResponse(f"{FRONTEND_REDIRECT}?google=error&reason=exchange_failed")

    refresh_token = tokens.get("refresh_token")
    access_token = tokens.get("access_token")
    expires_in = tokens.get("expires_in")

    if not refresh_token:
        print("[Google OAuth] No refresh_token returned — user may have already authorized this app")
        return RedirectResponse(f"{FRONTEND_REDIRECT}?google=error&reason=no_refresh_token")

    google_email = google_oauth.fetch_google_email(access_token) if access_token else None

    google_oauth.save_tokens(
        db=db,
        user_id=user_id,
        refresh_token=refresh_token,
        access_token=access_token,
        expires_in=expires_in,
        google_email=google_email,
    )

    print(f"[Google OAuth] User {user_id} connected as {google_email}")
    return RedirectResponse(f"{FRONTEND_REDIRECT}?google=connected&email={google_email or ''}")


@router.post("/disconnect")
def disconnect(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove stored Google tokens for the current user."""
    removed = google_oauth.disconnect_user(db, current_user_id)
    if not removed:
        raise HTTPException(status_code=404, detail="No Google account connected")
    return {"message": "Disconnected", "user_id": current_user_id}


@router.get("/status")
def status(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Is the current user's Google account connected?"""
    row = google_oauth.get_token_row(db, current_user_id)
    if not row:
        return {"connected": False}
    return {
        "connected": True,
        "email": row.google_email,
        "connected_at": row.created_at.isoformat() if row.created_at else None,
    }