from __future__ import annotations

import os
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db, supabase as supabase_client
from models import Role, User
from agents.core import _AGENT_INSTANCE, execute_hybrid_command
from agents.fallback_workflows import (
    run_daily_automated_workflows,
    run_tab_entry_sync,
)
from agents.gate import SafetyGate

router = APIRouter(prefix="/api/agent", tags=["Agentic Workflows"])


def _resolve_verified_admin(db: Session, user_id: int) -> tuple[str, str]:
    """
    Enforces RBAC on the backend using DB user/role records (never trusts client-supplied roles).
    Only role_id 1 (Master Admin) and 2 (Admin) are authorized for administrative agent commands/approvals.
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user or user.role_id not in (1, 2):
        raise HTTPException(
            status_code=403,
            detail="Admin or Master Admin privileges required for agent workflows.",
        )
    role_obj = db.query(Role).filter(Role.id == user.role_id).first()
    role_name = role_obj.role_name if role_obj else ("Master Admin" if user.role_id == 1 else "Admin")
    return str(user.user_id), role_name


class CommandRequest(BaseModel):
    prompt: str
    force_backup: bool = False


class DecisionRequest(BaseModel):
    decision: str  # "approve" | "reject"
    edited_payload: Optional[Dict[str, Any]] = None


@router.post("/command")
async def run_agent_command(
    req: CommandRequest,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    actor_id, actor_role = _resolve_verified_admin(db, current_user_id)
    return await execute_hybrid_command(
        prompt=req.prompt,
        supabase=supabase_client,
        db=db,
        actor_id=actor_id,
        actor_role=actor_role,
        force_backup=req.force_backup,
    )


@router.get("/tab-sync/{tab_name}")
def sync_on_tab_entry(
    tab_name: str,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _resolve_verified_admin(db, current_user_id)
    return run_tab_entry_sync(tab_name=tab_name, supabase=supabase_client, db=db)


@router.get("/actions")
def get_approval_queue(
    status: str = "pending",
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _resolve_verified_admin(db, current_user_id)
    gate = SafetyGate(supabase=supabase_client, db=db)
    return {"actions": gate.list_actions(status=status)}


@router.post("/actions/{action_id}/decision")
def review_queued_action(
    action_id: str,
    req: DecisionRequest,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reviewer_id, reviewer_role = _resolve_verified_admin(db, current_user_id)
    gate = SafetyGate(supabase=supabase_client, db=db)
    try:
        updated = gate.decide_action(
            action_id=action_id,
            decision=req.decision,
            reviewer_id=reviewer_id,
            reviewer_role=reviewer_role,
            edited_payload=req.edited_payload,
        )
        return {"action": updated}
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/notifications")
def get_notifications(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    gate = SafetyGate(supabase=supabase_client, db=db)
    notifs = gate.list_notifications()
    user = db.query(User).filter(User.user_id == current_user_id).first()
    if user and user.role_id not in (1, 2):
        # Learners only see notifications explicitly addressed to their user_id
        notifs = [n for n in notifs if str(n.get("user_id") or "") == str(current_user_id)]
    return {"notifications": notifs}


@router.post("/notifications/{notif_id}/read")
def read_notification(
    notif_id: str,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    gate = SafetyGate(supabase=supabase_client, db=db)
    return {"ok": gate.mark_notification_read(notif_id)}


@router.post("/workflows/run-daily")
def trigger_daily_backup_workflow(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Can be triggered by cron every morning OR manually from the Approval Drawer."""
    actor_id, _ = _resolve_verified_admin(db, current_user_id)
    gate = SafetyGate(supabase=supabase_client, db=db)
    return run_daily_automated_workflows(
        gate=gate, supabase=supabase_client, db=db, actor_id=actor_id
    )


@router.get("/audit-log")
def get_audit_log(
    limit: int = 50,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _resolve_verified_admin(db, current_user_id)
    safe_limit = max(1, min(200, int(limit or 50)))
    gate = SafetyGate(supabase=supabase_client, db=db)
    return {"logs": gate.list_audit_log(limit=safe_limit)}


@router.get("/health")
def get_agent_health():
    return {
        "primary_ai_ready": _AGENT_INSTANCE is not None,
        "deterministic_backup_ready": True,
        "supabase_connected": supabase_client is not None,
        "email_mode": (
            "resend"
            if os.getenv("RESEND_API_KEY")
            else "smtp"
            if os.getenv("SMTP_HOST")
            else "sandbox_fallback"
        ),
        "google_calendar_configured": bool(
            os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET")
        ),
    }

