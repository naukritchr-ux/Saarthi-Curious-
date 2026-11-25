from __future__ import annotations

import os
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import ALGORITHM, SECRET_KEY, get_current_user
from database import get_db, supabase as supabase_client
from models import User
from agents.fallback_workflows import run_daily_automated_workflows
from agents.gate import SafetyGate
from services.calendar_service import CalendarService

router = APIRouter(prefix="/api/integrations", tags=["Integrations & Cron"])
_optional_bearer = HTTPBearer(auto_error=False)


def _resolve_verified_admin_id(db: Session, user_id: int) -> str:
    """Backend source of truth: enforce Admin / Master Admin RBAC (roles 1 or 2)."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user or user.role_id not in (1, 2):
        raise HTTPException(
            status_code=403,
            detail="Admin or Master Admin privileges required for integrations.",
        )
    return str(user.user_id)


class QueueMeetingRequest(BaseModel):
    attendee_name: str
    attendee_email: str
    start_iso: str
    end_iso: Optional[str] = None
    slot_label: str
    agenda: str = "15-min learning progress check-in"


@router.get("/google/status")
def google_calendar_status(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_id = _resolve_verified_admin_id(db, current_user_id)
    cal = CalendarService(supabase_client)
    return {
        "connected": cal.is_connected(admin_id),
        "email_provider": (
            "resend"
            if os.getenv("RESEND_API_KEY")
            else "smtp"
            if os.getenv("SMTP_HOST")
            else "sandbox_fallback"
        ),
    }


@router.get("/google/auth-url")
def google_calendar_auth_url(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_id = _resolve_verified_admin_id(db, current_user_id)
    cal = CalendarService(supabase_client)
    return cal.get_auth_url(admin_id)


@router.get("/google/callback")
def google_calendar_callback(code: str, state: str = "admin-1"):
    cal = CalendarService(supabase_client)
    cal.exchange_code(code=code, admin_id=state)
    frontend = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(url=f"{frontend}/reports?calendar=connected")


@router.get("/google/free-slots")
def get_admin_free_slots(
    days: int = 3,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_id = _resolve_verified_admin_id(db, current_user_id)
    cal = CalendarService(supabase_client)
    return cal.get_free_slots(admin_id=admin_id, days_ahead=days)


@router.post("/meetings/queue")
def queue_coaching_meeting_card(
    req: QueueMeetingRequest,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Queues a Tier-3 Approval Card for 1-click booking from any User/Candidate modal."""
    admin_id = _resolve_verified_admin_id(db, current_user_id)
    gate = SafetyGate(supabase=supabase_client, db=db)
    payload = {**req.model_dump(), "admin_id": admin_id}
    card = gate.queue_tier3_action(
        action_type="book_meeting",
        summary=f"Book 15-min coaching session with {req.attendee_name} ({req.slot_label}).",
        payload=payload,
        diff_preview={
            "before": "No coaching meeting booked",
            "after": f"{req.slot_label} • {req.attendee_email}",
        },
        requested_by=admin_id,
        engine_source="manual_ui",
    )
    return {"action": card}


@router.post("/cron/daily")
def run_secured_daily_cron(
    x_cron_secret: Optional[str] = Header(default=None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    db: Session = Depends(get_db),
):
    """
    Call daily at 09:00 IST via Render Cron Job with X-Cron-Secret, or manually by verified Admin.
    """
    expected = os.getenv("CRON_SECRET", "").strip()
    actor_id = "cron-scheduler"
    if expected and x_cron_secret == expected:
        pass
    elif expected and x_cron_secret is not None:
        raise HTTPException(status_code=401, detail="Invalid X-Cron-Secret header")
    elif credentials and credentials.credentials:
        try:
            payload = jwt.decode(
                credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
            )
            uid = payload.get("user_id")
            if uid is None:
                raise HTTPException(status_code=401, detail="Invalid token")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        actor_id = _resolve_verified_admin_id(db, int(uid))
    else:
        raise HTTPException(
            status_code=401,
            detail="Valid X-Cron-Secret or Admin Bearer token required.",
        )

    gate = SafetyGate(supabase=supabase_client, db=db)
    return run_daily_automated_workflows(
        gate=gate, supabase=supabase_client, db=db, actor_id=actor_id
    )

