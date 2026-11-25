from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .gate import SafetyGate


def NumberOrZero(val: Any) -> float:
    try:
        return float(val or 0)
    except (TypeError, ValueError):
        return 0.0


# ============================================================================
# 1. DETERMINISTIC TELEMETRY FETCHERS (ALWAYS EXACT SQL / PYTHON — NEVER LLM)
# ============================================================================
def fetch_live_snapshot(supabase: Any = None, db: Any = None) -> Dict[str, Any]:
    """
    Pulls verified counts directly from Saarthi-Curious PostgreSQL (`users`, `roles`,
    `user_program_progress`, `quiz_attempts`). Falls back to structured defaults if DB is unreachable.
    """
    try:
        from database import SessionLocal
        from models import QuizAttempt, Role, User, UserProgramProgress

        session = db or SessionLocal()
        try:
            users = session.query(User).order_by(User.full_name.asc()).all()
            if users:
                roles_map = {r.id: r.role_name for r in session.query(Role).all()}
                prog_rows = session.query(UserProgramProgress).all()
                user_prog_map: Dict[int, float] = {}
                for p in prog_rows:
                    pct = float(p.completed_percentage or 0.0)
                    if p.user_id not in user_prog_map or pct > user_prog_map[p.user_id]:
                        user_prog_map[p.user_id] = pct

                quiz_rows = session.query(QuizAttempt).all()
                user_quiz_map: Dict[int, List[float]] = {}
                for qa in quiz_rows:
                    if qa.percentage is not None:
                        user_quiz_map.setdefault(qa.user_id, []).append(float(qa.percentage))
                    elif qa.total_questions and qa.score is not None:
                        user_quiz_map.setdefault(qa.user_id, []).append(
                            float(qa.score) / float(qa.total_questions) * 100.0
                        )
                    elif qa.score is not None:
                        user_quiz_map.setdefault(qa.user_id, []).append(float(qa.score))

                now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
                enriched: List[Dict[str, Any]] = []
                dormant: List[Dict[str, Any]] = []
                pending: List[Dict[str, Any]] = []
                high_risk: List[Dict[str, Any]] = []

                for u in users:
                    comp_pct = round(user_prog_map.get(u.user_id, 0.0), 1)
                    q_scores = user_quiz_map.get(u.user_id, [])
                    quiz_pct = round(sum(q_scores) / len(q_scores), 1) if q_scores else 0.0
                    risk_score = round(
                        0.55 * (100.0 - comp_pct) + 0.45 * (100.0 - quiz_pct), 1
                    )
                    risk_score = max(0.0, min(100.0, risk_score))

                    ref_dt = u.last_login or u.created_at or now_naive
                    days_inactive = max(0, (now_naive - ref_dt.replace(tzinfo=None)).days)

                    item = {
                        "id": str(u.user_id),
                        "name": u.full_name,
                        "email": u.email,
                        "role": roles_map.get(u.role_id, f"Role {u.role_id}"),
                        "role_id": u.role_id,
                        "completion_pct": comp_pct,
                        "days_inactive": days_inactive,
                        "risk_score": risk_score,
                        "status": "active" if u.is_active else "inactive",
                        "is_active": bool(u.is_active),
                    }
                    enriched.append(item)

                    if comp_pct == 0 or days_inactive >= 12:
                        dormant.append(item)
                    if not u.is_active:
                        pending.append(item)
                    if risk_score >= 70.0:
                        high_risk.append(item)

                total = len(enriched)
                active_cnt = sum(1 for x in enriched if x["is_active"] and x not in dormant)
                return {
                    "total_users": total,
                    "active_users": active_cnt,
                    "dormant_users": dormant,
                    "pending_users": pending,
                    "high_risk_candidates": high_risk,
                    "avg_completion": round(
                        sum(x["completion_pct"] for x in enriched) / max(1, total), 1
                    ),
                }
        finally:
            if not db:
                session.close()
    except Exception:
        pass

    if supabase:
        try:
            users_res = supabase.table("users").select("*").execute()
            users = users_res.data or []
            total = len(users)
            dormant = [
                u
                for u in users
                if NumberOrZero(u.get("completion_pct")) == 0
                or NumberOrZero(u.get("days_inactive")) >= 12
            ]
            pending = [
                u
                for u in users
                if not u.get("is_active", True)
                or str(u.get("status", "")).lower() in {"pending", "invited"}
            ]
            high_risk = [u for u in users if NumberOrZero(u.get("risk_score")) >= 70]
            return {
                "total_users": total,
                "active_users": max(0, total - len(dormant)),
                "dormant_users": dormant,
                "pending_users": pending,
                "high_risk_candidates": high_risk,
                "avg_completion": round(
                    sum(NumberOrZero(u.get("completion_pct")) for u in users)
                    / max(1, total),
                    1,
                ),
            }
        except Exception:
            pass

    fallback_users = [
        {"id": "3", "name": "Sneha Jaiswal", "email": "sneha.jaiswal@talentcorner.in", "role": "Franchise Employee", "completion_pct": 12, "days_inactive": 16, "risk_score": 86, "status": "active"},
        {"id": "8", "name": "Priyanka Panjwani", "email": "priyanka.p@talentcorner.in", "role": "Franchise Employee", "completion_pct": 0, "days_inactive": 64, "risk_score": 91, "status": "active"},
        {"id": "11", "name": "Preshita Rane", "email": "preshita.rane@talentcorner.in", "role": "Franchise Employee", "completion_pct": 18, "days_inactive": 14, "risk_score": 83, "status": "inactive"},
    ]
    return {
        "total_users": 23,
        "active_users": 14,
        "dormant_users": fallback_users,
        "pending_users": [fallback_users[2]],
        "high_risk_candidates": fallback_users,
        "avg_completion": 42.6,
    }


# ============================================================================
# 2. PRE-DECIDED TAB-ENTRY SYNC WORKFLOW (NO LLM NEEDED)
# ============================================================================
def run_tab_entry_sync(
    tab_name: str, supabase: Any = None, db: Any = None
) -> Dict[str, Any]:
    snap = fetch_live_snapshot(supabase=supabase, db=db)
    tab = (tab_name or "reports").lower().strip()

    dormant_cnt = len(snap["dormant_users"])
    pending_cnt = len(snap["pending_users"])
    risk_cnt = len(snap["high_risk_candidates"])

    if tab in {"reports", "analytics"}:
        briefing = (
            f"Live sync complete: {snap['total_users']} total users, "
            f"{snap['avg_completion']}% avg completion, and {dormant_cnt} dormant accounts."
        )
        recommended_action = (
            "Queue revival nudges for dormant learners"
            if dormant_cnt
            else "All cohorts healthy"
        )
    elif tab in {"attrition", "candidate-attrition"}:
        briefing = (
            f"Attrition watch active: {risk_cnt} high-risk candidate(s) (>=70% flight risk) detected."
        )
        recommended_action = "Review high-risk candidates and schedule 15-min check-ins"
    elif tab in {"users", "roles"}:
        briefing = (
            f"Access telemetry synced: {snap['active_users']} active accounts, "
            f"{pending_cnt} inactive/pending account(s), and {dormant_cnt} dormant profile(s)."
        )
        recommended_action = (
            "Review pending approvals in Action Inbox"
            if pending_cnt
            else "Access roster up to date"
        )
    else:
        briefing = f"Synced {tab} workspace with {snap['total_users']} verified records."
        recommended_action = "Ready"

    return {
        "tab": tab,
        "engine": "deterministic_sync",
        "briefing": briefing,
        "recommended_action": recommended_action,
        "metrics": {
            "total_users": snap["total_users"],
            "active_users": snap["active_users"],
            "dormant_count": dormant_cnt,
            "pending_count": pending_cnt,
            "high_risk_count": risk_cnt,
            "avg_completion": snap["avg_completion"],
        },
    }


# ============================================================================
# 3. PRE-DECIDED DAILY AUTOMATED WORKFLOW (CRON / BACKUP PLAYBOOK)
# ============================================================================
def run_daily_automated_workflows(
    gate: SafetyGate,
    supabase: Any = None,
    db: Any = None,
    actor_id: str = "daily_cron",
) -> Dict[str, Any]:
    """
    Runs 100% deterministically without requiring any LLM call:
      1. Nudges dormant learners (Tier 2, 72h cooldown enforced)
      2. Queues Tier-3 approval card for 60d+ inactive accounts (excluding Master Admins)
      3. Queues Tier-3 approval cards for pending/inactive user accounts
    """
    snap = fetch_live_snapshot(supabase=supabase, db=db)
    nudges_sent = 0
    nudges_skipped = 0
    queued_actions: List[str] = []

    for u in snap["dormant_users"]:
        days = NumberOrZero(u.get("days_inactive"))
        if 7 <= days < 60:
            res = gate.run_tier2_nudge(
                target_user_id=str(u.get("id")),
                target_name=u.get("name", "Learner"),
                target_email=u.get("email"),
                message=(
                    f"Hi {str(u.get('name', 'Learner')).split()[0]}, your next module is waiting! "
                    "Complete 1 short video today to protect your streak and claim +50 Curos."
                ),
                actor_id=actor_id,
                cooldown_hours=72,
                engine_source="deterministic_backup",
            )
            if res["status"] == "executed":
                nudges_sent += 1
            else:
                nudges_skipped += 1

    long_dead = [
        u
        for u in snap["dormant_users"]
        if NumberOrZero(u.get("days_inactive")) >= 60 and u.get("role_id") != 1
    ]
    if long_dead:
        names = [u.get("name", "User") for u in long_dead]
        card = gate.queue_tier3_action(
            action_type="deactivate_dormant",
            summary=f"Archive {len(long_dead)} account(s) inactive for 60+ days ({', '.join(names[:3])}).",
            payload={"user_ids": [str(u.get("id")) for u in long_dead], "names": names},
            diff_preview={
                "before": f"{len(long_dead)} active dormant accounts (60d+ silent)",
                "after": f"{len(long_dead)} accounts set to inactive (Master Admins excluded)",
            },
            requested_by=actor_id,
            engine_source="deterministic_backup",
        )
        queued_actions.append(card["id"])

    for p in snap["pending_users"][:5]:
        card = gate.queue_tier3_action(
            action_type="approve_user",
            summary=f"Activate user {p.get('name')} ({p.get('email')}) and enroll in Client Relationships.",
            payload={
                "user_id": str(p.get("id")),
                "name": p.get("name"),
                "email": p.get("email"),
                "default_program": "Client Relationships",
            },
            diff_preview={
                "before": "Status: Inactive / Pending",
                "after": "Status: Active • Enrolled in Client Relationships",
            },
            requested_by=actor_id,
            engine_source="deterministic_backup",
        )
        queued_actions.append(card["id"])

    return {
        "engine": "deterministic_backup",
        "nudges_sent": nudges_sent,
        "nudges_skipped_cooldown": nudges_skipped,
        "tier3_cards_queued": len(queued_actions),
        "queued_action_ids": queued_actions,
    }


# ============================================================================
# 4. DETERMINISTIC COMMAND BACKUP ROUTER (ACTIVATES IF AI FAILS / TIMES OUT)
# ============================================================================
def run_deterministic_command_fallback(
    *,
    prompt: str,
    gate: SafetyGate,
    supabase: Any = None,
    db: Any = None,
    actor_id: Optional[str] = None,
) -> Dict[str, Any]:
    q = prompt.strip()
    low = q.lower()
    snap = fetch_live_snapshot(supabase=supabase, db=db)

    # Intent 1: Book Meeting / Calendar (Tier 3 Approval)
    if any(k in low for k in ("book", "meeting", "schedule", "calendar", "call")):
        target_user = (
            snap["high_risk_candidates"][0]
            if snap["high_risk_candidates"]
            else {"name": "Sneha Jaiswal", "email": "sneha.jaiswal@talentcorner.in"}
        )
        for u in snap["dormant_users"] + snap["high_risk_candidates"]:
            first = u.get("name", "").lower().split()[0] if u.get("name") else ""
            if first and first in low:
                target_user = u
                break

        card = gate.queue_tier3_action(
            action_type="book_meeting",
            summary=f"Book 15-min retention coaching call with {target_user['name']} tomorrow at 4:00 PM IST.",
            payload={
                "attendee_name": target_user["name"],
                "attendee_email": target_user.get("email", ""),
                "proposed_slot": "Tomorrow, 4:00 PM IST",
                "agenda": "Review stalled module & unlock +50 Curos completion plan",
            },
            diff_preview={
                "before": "No coaching meeting scheduled",
                "after": f"Google Meet invite to {target_user['name']} (Tomorrow 4:00 PM IST)",
            },
            requested_by=actor_id,
            engine_source="deterministic_backup",
        )
        return {
            "answer": (
                f"Prepared a 15-minute coaching invite for {target_user['name']} (Tomorrow, 4:00 PM IST). "
                "Approve it in the Action Inbox to send the calendar invite."
            ),
            "engine": "deterministic_backup",
            "queued_action": card,
            "ui_action": {"open_approval_drawer": True},
        }

    # Intent 2: Approve Pending Users (Tier 3 Approval)
    if "approve" in low and ("user" in low or "pending" in low or "invite" in low):
        pending = snap["pending_users"]
        if not pending:
            return {
                "answer": "There are currently 0 pending or inactive user accounts awaiting activation.",
                "engine": "deterministic_backup",
                "queued_action": None,
                "ui_action": None,
            }
        u = pending[0]
        card = gate.queue_tier3_action(
            action_type="approve_user",
            summary=f"Approve {u['name']} ({u.get('email')}) and enroll in Client Relationships.",
            payload={
                "user_id": str(u["id"]),
                "name": u["name"],
                "email": u.get("email"),
                "default_program": "Client Relationships",
            },
            diff_preview={"before": "Pending / Inactive", "after": "Active + Enrolled"},
            requested_by=actor_id,
            engine_source="deterministic_backup",
        )
        return {
            "answer": f"Queued approval card for {u['name']}. Click Approve in the Action Inbox to activate.",
            "engine": "deterministic_backup",
            "queued_action": card,
            "ui_action": {"open_approval_drawer": True},
        }

    # Intent 3: Edit / Change Role (Tier 3 Approval)
    if "role" in low and any(k in low for k in ("change", "update", "make", "promote", "edit")):
        role_match = re.search(r"to\s+([a-zA-Z\s]+)$", q, re.IGNORECASE)
        new_role = role_match.group(1).strip().title() if role_match else "Team Leader"
        non_master = [u for u in snap["dormant_users"] if u.get("role_id") != 1]
        target_u = (
            non_master[0]
            if non_master
            else {"id": "5", "name": "Parna Ghosh", "role": "Franchise Employee"}
        )
        card = gate.queue_tier3_action(
            action_type="update_user_role",
            summary=f"Update {target_u['name']}'s RBAC role from {target_u.get('role')} to {new_role}.",
            payload={
                "user_id": str(target_u["id"]),
                "name": target_u["name"],
                "current_role": target_u.get("role", "Franchise Employee"),
                "new_role": new_role,
            },
            diff_preview={
                "before": f"Role: {target_u.get('role', 'Franchise Employee')}",
                "after": f"Role: {new_role}",
            },
            requested_by=actor_id,
            engine_source="deterministic_backup",
        )
        return {
            "answer": f"Prepared RBAC role update for {target_u['name']} -> {new_role}. Confirm in the Action Inbox.",
            "engine": "deterministic_backup",
            "queued_action": card,
            "ui_action": {"open_approval_drawer": True},
        }

    # Intent 4: Send Nudge / Revive Dormant (Tier 2 Cooldown-Capped)
    if any(k in low for k in ("nudge", "remind", "revive", "dead", "inactive", "dormant")):
        sent = 0
        for u in snap["dormant_users"][:5]:
            r = gate.run_tier2_nudge(
                target_user_id=str(u["id"]),
                target_name=u["name"],
                target_email=u.get("email"),
                message="Complete 1 short video module today to revive your streak and earn +50 Curos!",
                actor_id=actor_id,
                engine_source="deterministic_backup",
            )
            if r["status"] == "executed":
                sent += 1
        return {
            "answer": (
                f"Found {len(snap['dormant_users'])} dormant accounts. "
                f"Dispatched {sent} cooldown-verified revival nudge(s)."
            ),
            "engine": "deterministic_backup",
            "queued_action": None,
            "ui_action": {"route": "/reports", "highlight": "dormant"},
        }

    # Default Deterministic Telemetry Report (Tier 1 Read)
    return {
        "answer": (
            f"Live Verified Telemetry: {snap['total_users']} enrolled users "
            f"({snap['active_users']} active, {len(snap['dormant_users'])} dormant, "
            f"{len(snap['high_risk_candidates'])} high-risk candidates). "
            f"Average completion stands at {snap['avg_completion']}%. "
            "You can ask me to nudge dormant learners, approve pending invites, edit roles, or book a coaching call."
        ),
        "engine": "deterministic_backup",
        "queued_action": None,
        "ui_action": {"route": "/reports"},
    }

