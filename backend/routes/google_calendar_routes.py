"""
Google Calendar OAuth routes for Saarthi Curious.

- GET  /google/connect (alias: /auth/google/login)     -> redirect user to Google consent screen
- GET  /google/callback (alias: /auth/google/callback) -> receive code, save tokens, redirect back
- POST /google/disconnect                             -> remove stored tokens
- GET  /google/status                                 -> check connection status
"""

import json
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from sqlalchemy.orm import Session

from database import get_db
from models import UserGoogleToken
from services import google_oauth


router = APIRouter(prefix="/google", tags=["Google Calendar"])
auth_alias_router = APIRouter(prefix="/auth/google", tags=["Google Calendar (Auth Alias)"])

FRONTEND_REDIRECT = os.getenv(
    "GOOGLE_FRONTEND_REDIRECT",
    "https://saarthi-curious.vercel.app/settings",
)
SECRET_KEY = os.getenv("SECRET_KEY", "secret_jwt_key_saarthi_curious_2026_super_secure_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

security_optional = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
) -> Optional[int]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("user_id") or payload.get("sub")
        return int(uid) if uid else None
    except Exception:
        return None


def handle_connect_flow(
    user_id: Optional[int] = None,
    is_personal: bool = False,
    device_id: Optional[str] = None,
    email: Optional[str] = None,
    redirect_to: Optional[str] = None,
    state: Optional[str] = None,
):
    """Initiates Google OAuth with state carrying user_id, is_personal, device_id, email, redirect_to."""
    target_user_id = user_id
    target_is_personal = is_personal
    target_device_id = device_id
    target_email = email
    target_redirect_to = redirect_to

    if state:
        try:
            state_data = json.loads(state)
            if isinstance(state_data, dict):
                if state_data.get("user_id"):
                    target_user_id = int(state_data["user_id"])
                if "is_personal" in state_data:
                    target_is_personal = bool(state_data["is_personal"])
                if "device_id" in state_data:
                    target_device_id = state_data["device_id"]
                if "email" in state_data:
                    target_email = state_data["email"]
                if "redirect_to" in state_data:
                    target_redirect_to = state_data["redirect_to"]
            else:
                target_user_id = int(state_data)
        except Exception:
            try:
                target_user_id = int(state)
            except Exception:
                pass

    if not target_user_id and target_email:
        try:
            from database import SessionLocal
            from models import User
            with SessionLocal() as db_session:
                u = db_session.query(User).filter(User.email.ilike(target_email.strip())).first()
                if u:
                    target_user_id = u.user_id
        except Exception:
            pass

    if not target_user_id:
        target_redirect = target_redirect_to or FRONTEND_REDIRECT
        sep = "&" if "?" in target_redirect else "?"
        return RedirectResponse(f"{target_redirect}{sep}google=error&reason=user_id_required")

    try:
        url = google_oauth.build_auth_url(
            user_id=target_user_id,
            is_personal=target_is_personal,
            device_id=target_device_id,
            email=target_email,
            redirect_to=target_redirect_to,
        )
        return RedirectResponse(url)
    except Exception as e:
        print(f"[handle_connect_flow fallback] {e}")
        from urllib.parse import urlencode
        client_id = os.getenv("GOOGLE_CLIENT_ID") or "95621534418-tj95nvfs7ver7rqobc5pr331n2nhtei7.apps.googleusercontent.com"
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI") or "http://localhost:8000/google/callback"
        state_payload = {
            "user_id": target_user_id,
            "is_personal": bool(target_is_personal),
            "device_id": target_device_id,
            "email": target_email.strip() if target_email else None,
            "redirect_to": target_redirect_to.strip() if target_redirect_to else None,
        }
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email openid",
            "access_type": "offline",
            "prompt": "consent",
            "state": json.dumps(state_payload),
            "include_granted_scopes": "true",
        }
        if target_email and target_email.strip():
            params["login_hint"] = target_email.strip()
        fallback_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        return RedirectResponse(fallback_url)


def handle_callback_flow(
    code: Optional[str],
    state: Optional[str],
    db: Session,
    error: Optional[str] = None,
):
    """Exchange code for tokens, save them, redirect back to frontend."""
    target_redirect = None
    if state:
        try:
            s_data = json.loads(state)
            if isinstance(s_data, dict):
                target_redirect = s_data.get("redirect_to")
        except Exception:
            pass

    final_base = target_redirect or FRONTEND_REDIRECT
    sep = "&" if "?" in final_base else "?"

    if error or not code:
        print(f"[Google OAuth] Error or cancelled: {error}")
        return RedirectResponse(f"{final_base}{sep}google=error&reason={error or 'cancelled'}")

    # Parse the 'state' parameter sent from frontend
    is_personal = False
    device_id = None
    user_id = None

    if state:
        try:
            state_data = json.loads(state)
            if isinstance(state_data, dict):
                is_personal = bool(state_data.get("is_personal", False))
                device_id = state_data.get("device_id")
                user_id = state_data.get("user_id")
            else:
                user_id = int(state_data)
        except Exception:
            try:
                user_id = int(state)
            except Exception:
                pass

    try:
        tokens = google_oauth.exchange_code_for_tokens(code)
    except Exception as e:
        print(f"[Google OAuth] Code exchange failed: {e}")
        return RedirectResponse(f"{final_base}{sep}google=error&reason=exchange_failed")

    refresh_token = tokens.get("refresh_token")
    access_token = tokens.get("access_token")
    expires_in = tokens.get("expires_in")
    google_email = google_oauth.fetch_google_email(access_token) if access_token else None

    if not user_id and google_email:
        try:
            from models import User
            u = db.query(User).filter(User.email.ilike(google_email.strip())).first()
            if u:
                user_id = u.user_id
        except Exception:
            pass

    if not user_id:
        print("[Google OAuth] Cannot resolve user_id for OAuth callback; aborting token save")
        return RedirectResponse(f"{final_base}{sep}google=error&reason=user_not_identified")

    # If Google did not return a refresh token, reuse existing valid token for this user
    if not refresh_token:
        existing = db.query(UserGoogleToken).filter(
            UserGoogleToken.user_id == user_id,
            UserGoogleToken.refresh_token.isnot(None),
            UserGoogleToken.refresh_token != "pending_auth",
            UserGoogleToken.refresh_token != "",
        )
        if google_email:
            matched = existing.filter(UserGoogleToken.google_email == google_email).first()
            if matched and matched.refresh_token:
                refresh_token = matched.refresh_token
        if not refresh_token:
            fallback_tok = existing.order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc()).first()
            if fallback_tok and fallback_tok.refresh_token:
                refresh_token = fallback_tok.refresh_token

    if not refresh_token:
        refresh_token = "google_authenticated"

    try:
        google_oauth.save_tokens(
            db=db,
            user_id=user_id,
            refresh_token=refresh_token,
            access_token=access_token,
            expires_in=expires_in,
            google_email=google_email,
            is_personal=is_personal,
            device_id=device_id,
        )
    except Exception as e:
        db.rollback()
        print(f"[Google OAuth] save_tokens failed: {e}")

    token_type = "personal" if is_personal else "company"
    print(f"[Google OAuth] User {user_id} ({token_type}, device={device_id}) connected as {google_email}")

    return RedirectResponse(
        f"{final_base}{sep}google=connected&type={token_type}&email={google_email or ''}"
    )


# /google/connect
@router.get("/connect")
def connect(
    user_id: Optional[int] = Query(None, description="User ID to connect for"),
    is_personal: bool = Query(False, description="Is this a personal device calendar"),
    device_id: Optional[str] = Query(None, description="Unique client device ID"),
    email: Optional[str] = Query(None, description="Specific email to prefill/login_hint"),
    redirect_to: Optional[str] = Query(None, description="Frontend URL to redirect back to"),
    state: Optional[str] = Query(None, description="Encoded state parameter"),
):
    return handle_connect_flow(
        user_id=user_id,
        is_personal=is_personal,
        device_id=device_id,
        email=email,
        redirect_to=redirect_to,
        state=state,
    )


# /auth/google/login (alias for step 6)
@auth_alias_router.get("/login")
def auth_google_login(
    user_id: Optional[int] = Query(None),
    is_personal: bool = Query(False),
    device_id: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    redirect_to: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
):
    return handle_connect_flow(
        user_id=user_id,
        is_personal=is_personal,
        device_id=device_id,
        email=email,
        redirect_to=redirect_to,
        state=state,
    )


# /google/callback
@router.get("/callback")
def callback(
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return handle_callback_flow(code=code, state=state, db=db, error=error)


# /auth/google/callback (alias)
@auth_alias_router.get("/callback")
def auth_google_callback(
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return handle_callback_flow(code=code, state=state, db=db, error=error)


@router.post("/disconnect")
def disconnect(
    is_personal: Optional[bool] = Query(None),
    device_id: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    current_user_id: Optional[int] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Remove stored Google tokens for the current user/device."""
    effective_user_id = current_user_id or user_id
    if not effective_user_id:
        raise HTTPException(status_code=400, detail="User identification required")

    removed = google_oauth.disconnect_user(
        db,
        user_id=effective_user_id,
        is_personal=is_personal,
        device_id=device_id,
    )
    if not removed:
        raise HTTPException(status_code=404, detail="No matching Google account connected")
    return {"message": "Disconnected", "user_id": effective_user_id}


@router.get("/status")
def status(
    user_id: Optional[int] = Query(None),
    device_id: Optional[str] = Query(None),
    current_user_id: Optional[int] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Check whether Google account is connected."""
    effective_user_id = current_user_id or user_id

    if not effective_user_id:
        return {
            "connected": False,
            "company_connected": False,
            "personal_connected": False,
            "email": None,
            "user_id": None,
        }

    # Query tokens strictly for THIS specific user
    tokens = (
        db.query(UserGoogleToken)
        .filter(
            UserGoogleToken.user_id == effective_user_id,
            UserGoogleToken.refresh_token.isnot(None),
            UserGoogleToken.refresh_token != "pending_auth",
            UserGoogleToken.refresh_token != "",
        )
        .order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc())
        .all()
    )

    if not tokens:
        return {
            "connected": False,
            "company_connected": False,
            "personal_connected": False,
            "email": None,
            "user_id": effective_user_id,
        }

    matched_token = tokens[0]

    return {
        "connected": True,
        "email": matched_token.google_email,
        "company_connected": any(not t.is_personal for t in tokens),
        "personal_connected": any(t.is_personal for t in tokens),
        "company_email": next((t.google_email for t in tokens if not t.is_personal), matched_token.google_email),
        "personal_email": next((t.google_email for t in tokens if t.is_personal), matched_token.google_email),
        "user_id": effective_user_id,
    }
