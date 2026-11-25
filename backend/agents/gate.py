from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from services.calendar_service import CalendarService
from services.email_service import send_meeting_invite_email, send_nudge_email

ADMIN_ROLES = {"master admin", "admin"}
PROTECTED_ROLES = {"master admin"}

# In-memory fallback stores (used seamlessly if Supabase tables are offline/unmigrated)
_MEM_QUEUE: List[Dict[str, Any]] = []
_MEM_AUDIT: List[Dict[str, Any]] = []
_MEM_NOTIFS: List[Dict[str, Any]] = []


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso_now() -> str:
    return _utc_now().isoformat()


def is_admin_role(role: Optional[str]) -> bool:
    return str(role or "").strip().lower() in ADMIN_ROLES


class SafetyGate:
    """
    Unified 3-tier execution gate used by BOTH PydanticAI and the
    Complementary Deterministic Backup Engine.
    """

    def __init__(self, supabase: Any = None, db: Any = None):
        self.sb = supabase
        self.db = db

    def _pg_engine(self):
        try:
            from database import engine
            return engine
        except Exception:
            return None

    # ------------------------------------------------------------------
    # AUDIT & NOTIFICATION HELPERS
    # ------------------------------------------------------------------
    def log_audit(
        self,
        *,
        tier: int,
        tool_name: str,
        result_summary: str,
        target_user_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        action_id: Optional[str] = None,
        engine_source: str = "ai",
    ) -> Dict[str, Any]:
        record = {
            "id": str(uuid.uuid4()),
            "action_id": action_id,
            "tier": tier,
            "tool_name": tool_name,
            "target_user_id": str(target_user_id) if target_user_id else None,
            "actor_id": str(actor_id) if actor_id else None,
            "engine_source": engine_source,
            "result_summary": result_summary,
            "created_at": _iso_now(),
        }
        if self.sb:
            try:
                self.sb.table("agent_audit_log").insert(record).execute()
                return record
            except Exception:
                pass
        eng = self._pg_engine()
        if eng is not None:
            try:
                from sqlalchemy import text
                with eng.begin() as conn:
                    conn.execute(
                        text(
                            """
                            INSERT INTO agent_audit_log
                              (id, action_id, tier, tool_name, target_user_id, actor_id, engine_source, result_summary, created_at)
                            VALUES
                              (CAST(:id AS uuid), CAST(:action_id AS uuid), :tier, :tool_name, :target_user_id, :actor_id, :engine_source, :result_summary, :created_at)
                            """
                        ),
                        record,
                    )
                return record
            except Exception:
                pass
        _MEM_AUDIT.insert(0, record)
        return record

    def push_notification(
        self,
        *,
        title: str,
        body: str,
        severity: str = "info",
        route_target: str = "/reports",
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        notif = {
            "id": str(uuid.uuid4()),
            "user_id": str(user_id) if user_id else None,
            "severity": severity,
            "title": title,
            "body": body,
            "route_target": route_target,
            "is_read": False,
            "created_at": _iso_now(),
        }
        if self.sb:
            try:
                self.sb.table("agent_notifications").insert(notif).execute()
                return notif
            except Exception:
                pass
        eng = self._pg_engine()
        if eng is not None:
            try:
                from sqlalchemy import text
                with eng.begin() as conn:
                    conn.execute(
                        text(
                            """
                            INSERT INTO agent_notifications
                              (id, user_id, severity, title, body, route_target, is_read, created_at)
                            VALUES
                              (CAST(:id AS uuid), :user_id, :severity, :title, :body, :route_target, :is_read, :created_at)
                            """
                        ),
                        notif,
                    )
                return notif
            except Exception:
                pass
        _MEM_NOTIFS.insert(0, notif)
        return notif

    # ------------------------------------------------------------------
    # TIER 2: COOLDOWN-CAPPED AUTONOMOUS ACTIONS (NUDGES / REMINDERS)
    # ------------------------------------------------------------------
    def is_in_cooldown(
        self, tool_name: str, target_user_id: str, cooldown_hours: int = 72
    ) -> bool:
        cutoff = _utc_now() - timedelta(hours=cooldown_hours)
        if self.sb:
            try:
                res = (
                    self.sb.table("agent_audit_log")
                    .select("created_at")
                    .eq("tool_name", tool_name)
                    .eq("target_user_id", str(target_user_id))
                    .gte("created_at", cutoff.isoformat())
                    .limit(1)
                    .execute()
                )
                return bool(res.data)
            except Exception:
                pass
        eng = self._pg_engine()
        if eng is not None:
            try:
                from sqlalchemy import text
                with eng.connect() as conn:
                    row = conn.execute(
                        text(
                            "SELECT 1 FROM agent_audit_log "
                            "WHERE tool_name = :t AND target_user_id = :uid AND created_at >= :cutoff "
                            "LIMIT 1"
                        ),
                        {"t": tool_name, "uid": str(target_user_id), "cutoff": cutoff.isoformat()},
                    ).first()
                    return row is not None
            except Exception:
                pass

        for entry in _MEM_AUDIT:
            if (
                entry["tool_name"] == tool_name
                and entry["target_user_id"] == str(target_user_id)
            ):
                try:
                    ts = datetime.fromisoformat(entry["created_at"])
                    if ts >= cutoff:
                        return True
                except ValueError:
                    pass
        return False

    def run_tier2_nudge(
        self,
        *,
        target_user_id: str,
        target_name: str,
        message: str,
        target_email: Optional[str] = None,
        actor_id: Optional[str] = None,
        cooldown_hours: int = 72,
        engine_source: str = "ai",
    ) -> Dict[str, Any]:
        if self.is_in_cooldown("send_learner_nudge", target_user_id, cooldown_hours):
            return {
                "status": "skipped_cooldown",
                "message": f"{target_name} was already nudged within the last {cooldown_hours}h.",
            }

        email_res = {"provider": "in_app_only", "delivered": False}
        if target_email:
            email_res = send_nudge_email(
                to_email=target_email,
                learner_name=target_name,
                message=message,
            )

        self.push_notification(
            user_id=target_user_id,
            severity="info",
            title="Learning Check-In",
            body=message,
            route_target="/programs",
        )
        self.log_audit(
            tier=2,
            tool_name="send_learner_nudge",
            target_user_id=target_user_id,
            actor_id=actor_id,
            engine_source=engine_source,
            result_summary=f"Nudge sent to {target_name} (email={email_res.get('provider')})",
        )
        return {
            "status": "executed",
            "email_provider": email_res.get("provider"),
            "message": f"Nudge sent to {target_name} via {email_res.get('provider')} ({cooldown_hours}h cooldown started).",
        }

    # ------------------------------------------------------------------
    # TIER 3: HUMAN-IN-THE-LOOP APPROVAL QUEUE (USERS, ROLES, CALENDAR)
    # ------------------------------------------------------------------
    def queue_tier3_action(
        self,
        *,
        action_type: str,
        summary: str,
        payload: Dict[str, Any],
        diff_preview: Dict[str, Any],
        requested_by: Optional[str] = None,
        engine_source: str = "ai",
    ) -> Dict[str, Any]:
        action = {
            "id": str(uuid.uuid4()),
            "action_type": action_type,
            "summary": summary,
            "payload": payload,
            "diff_preview": diff_preview,
            "engine_source": engine_source,
            "status": "pending",
            "requested_by": str(requested_by) if requested_by else "system",
            "reviewed_by": None,
            "error_message": None,
            "created_at": _iso_now(),
            "executed_at": None,
        }
        saved = False
        if self.sb:
            try:
                self.sb.table("agent_action_queue").insert(action).execute()
                saved = True
            except Exception:
                pass
        if not saved:
            eng = self._pg_engine()
            if eng is not None:
                try:
                    import json as _json
                    from sqlalchemy import text
                    with eng.begin() as conn:
                        conn.execute(
                            text(
                                """
                                INSERT INTO agent_action_queue
                                  (id, action_type, summary, payload, diff_preview, engine_source, status, requested_by, reviewed_by, error_message, created_at, executed_at)
                                VALUES
                                  (CAST(:id AS uuid), :action_type, :summary, CAST(:payload AS jsonb), CAST(:diff_preview AS jsonb), :engine_source, :status, :requested_by, :reviewed_by, :error_message, :created_at, :executed_at)
                                """
                            ),
                            {
                                **action,
                                "payload": _json.dumps(action["payload"]),
                                "diff_preview": _json.dumps(action["diff_preview"]),
                            },
                        )
                    saved = True
                except Exception:
                    pass
        if not saved:
            _MEM_QUEUE.insert(0, action)

        self.push_notification(
            severity="action_required",
            title=f"Approval Needed: {action_type.replace('_', ' ').title()}",
            body=summary,
            route_target="/admin/users",
        )
        return action

    def _serialize_pg_row(self, row_map: Any) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        for k, v in dict(row_map).items():
            if hasattr(v, "isoformat"):
                out[k] = v.isoformat()
            elif isinstance(v, uuid.UUID):
                out[k] = str(v)
            else:
                out[k] = v
        return out

    def list_actions(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.sb:
            try:
                q = self.sb.table("agent_action_queue").select("*").order(
                    "created_at", desc=True
                )
                if status and status != "all":
                    q = q.eq("status", status)
                res = q.limit(50).execute()
                return res.data or []
            except Exception:
                pass
        eng = self._pg_engine()
        if eng is not None:
            try:
                from sqlalchemy import text
                with eng.connect() as conn:
                    if status and status != "all":
                        rows = conn.execute(
                            text(
                                "SELECT * FROM agent_action_queue WHERE status = :st "
                                "ORDER BY created_at DESC LIMIT 50"
                            ),
                            {"st": status},
                        ).mappings().all()
                    else:
                        rows = conn.execute(
                            text("SELECT * FROM agent_action_queue ORDER BY created_at DESC LIMIT 50")
                        ).mappings().all()
                    return [self._serialize_pg_row(r) for r in rows]
            except Exception:
                pass
        if status and status != "all":
            return [a for a in _MEM_QUEUE if a["status"] == status]
        return list(_MEM_QUEUE)

    def list_notifications(self, limit: int = 30) -> List[Dict[str, Any]]:
        if self.sb:
            try:
                res = (
                    self.sb.table("agent_notifications")
                    .select("*")
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                return res.data or []
            except Exception:
                pass
        eng = self._pg_engine()
        if eng is not None:
            try:
                from sqlalchemy import text
                with eng.connect() as conn:
                    rows = conn.execute(
                        text("SELECT * FROM agent_notifications ORDER BY created_at DESC LIMIT :lim"),
                        {"lim": limit},
                    ).mappings().all()
                    return [self._serialize_pg_row(r) for r in rows]
            except Exception:
                pass
        return _MEM_NOTIFS[:limit]

    def list_audit_log(self, limit: int = 50) -> List[Dict[str, Any]]:
        if self.sb:
            try:
                res = (
                    self.sb.table("agent_audit_log")
                    .select("*")
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                return res.data or []
            except Exception:
                pass
        eng = self._pg_engine()
        if eng is not None:
            try:
                from sqlalchemy import text
                with eng.connect() as conn:
                    rows = conn.execute(
                        text("SELECT * FROM agent_audit_log ORDER BY created_at DESC LIMIT :lim"),
                        {"lim": limit},
                    ).mappings().all()
                    return [self._serialize_pg_row(r) for r in rows]
            except Exception:
                pass
        return _MEM_AUDIT[:limit]

    def mark_notification_read(self, notif_id: str) -> bool:
        if self.sb:
            try:
                self.sb.table("agent_notifications").update({"is_read": True}).eq(
                    "id", notif_id
                ).execute()
                return True
            except Exception:
                pass
        eng = self._pg_engine()
        if eng is not None:
            try:
                from sqlalchemy import text
                with eng.begin() as conn:
                    conn.execute(
                        text("UPDATE agent_notifications SET is_read = true WHERE id = CAST(:id AS uuid)"),
                        {"id": notif_id},
                    )
                return True
            except Exception:
                pass
        for n in _MEM_NOTIFS:
            if n["id"] == notif_id:
                n["is_read"] = True
                return True
        return False

    def decide_action(
        self,
        *,
        action_id: str,
        decision: str,  # "approve" | "reject"
        reviewer_id: str,
        reviewer_role: str,
        edited_payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not is_admin_role(reviewer_role):
            raise PermissionError("Admin privileges are required to review actions.")

        action = self._get_action(action_id)
        if not action:
            raise KeyError(f"Action {action_id} not found.")
        if action["status"] != "pending":
            return action

        if decision == "reject":
            return self._update_action(
                action_id,
                {"status": "rejected", "reviewed_by": reviewer_id},
            )

        payload = edited_payload if edited_payload is not None else action["payload"]

        try:
            result_msg = self._execute_write_handler(
                action["action_type"], payload, action_id=action_id
            )
            updated = self._update_action(
                action_id,
                {
                    "status": "executed",
                    "payload": payload,
                    "reviewed_by": reviewer_id,
                    "executed_at": _iso_now(),
                },
            )
            self.log_audit(
                action_id=action_id,
                tier=3,
                tool_name=action["action_type"],
                target_user_id=payload.get("user_id") or payload.get("target_email"),
                actor_id=reviewer_id,
                engine_source=action.get("engine_source", "ai"),
                result_summary=result_msg,
            )
            self.push_notification(
                severity="success",
                title=f"Executed: {action['action_type'].replace('_', ' ').title()}",
                body=result_msg,
                route_target="/admin/users",
            )
            return updated
        except Exception as exc:
            return self._update_action(
                action_id,
                {
                    "status": "failed",
                    "reviewed_by": reviewer_id,
                    "error_message": str(exc),
                },
            )

    def _get_action(self, action_id: str) -> Optional[Dict[str, Any]]:
        if self.sb:
            try:
                res = (
                    self.sb.table("agent_action_queue")
                    .select("*")
                    .eq("id", action_id)
                    .limit(1)
                    .execute()
                )
                if res.data:
                    return res.data[0]
            except Exception:
                pass
        eng = self._pg_engine()
        if eng is not None:
            try:
                from sqlalchemy import text
                with eng.connect() as conn:
                    r = conn.execute(
                        text("SELECT * FROM agent_action_queue WHERE id = CAST(:id AS uuid) LIMIT 1"),
                        {"id": action_id},
                    ).mappings().first()
                    if r:
                        return self._serialize_pg_row(r)
            except Exception:
                pass
        return next((a for a in _MEM_QUEUE if a["id"] == action_id), None)

    def _update_action(self, action_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        if self.sb:
            try:
                res = (
                    self.sb.table("agent_action_queue")
                    .update(patch)
                    .eq("id", action_id)
                    .execute()
                )
                if res.data:
                    return res.data[0]
            except Exception:
                pass
        eng = self._pg_engine()
        if eng is not None:
            try:
                import json as _json
                from sqlalchemy import text
                set_clauses = []
                params: Dict[str, Any] = {"aid": action_id}
                for k, v in patch.items():
                    if k in ("payload", "diff_preview"):
                        set_clauses.append(f"{k} = CAST(:{k} AS jsonb)")
                        params[k] = _json.dumps(v)
                    else:
                        set_clauses.append(f"{k} = :{k}")
                        params[k] = v
                sql = f"UPDATE agent_action_queue SET {', '.join(set_clauses)} WHERE id = CAST(:aid AS uuid) RETURNING *"
                with eng.begin() as conn:
                    r = conn.execute(text(sql), params).mappings().first()
                    if r:
                        return self._serialize_pg_row(r)
            except Exception:
                pass
        for idx, item in enumerate(_MEM_QUEUE):
            if item["id"] == action_id:
                _MEM_QUEUE[idx] = {**item, **patch}
                return _MEM_QUEUE[idx]
        return patch

    # ------------------------------------------------------------------
    # DETERMINISTIC WRITE HANDLERS (RUN ONLY AFTER ADMIN APPROVAL)
    # Adapts cleanly to Saarthi-Curious PostgreSQL schema (`users.user_id`, `role_id`, `is_active`).
    # ------------------------------------------------------------------
    def _execute_write_handler(
        self,
        action_type: str,
        payload: Dict[str, Any],
        action_id: Optional[str] = None,
    ) -> str:
        from database import SessionLocal
        from models import Role, User

        def _parse_int_id(val: Any) -> Optional[int]:
            try:
                return int(val)
            except (TypeError, ValueError):
                return None

        if action_type == "approve_user":
            uid = _parse_int_id(payload.get("user_id"))
            prog = payload.get("default_program", "Client Relationships")
            if uid is not None:
                session = self.db or SessionLocal()
                try:
                    u = session.query(User).filter(User.user_id == uid).first()
                    if u:
                        u.is_active = True
                        session.commit()
                finally:
                    if not self.db:
                        session.close()
            return f"Approved user {payload.get('name', uid)} and enrolled in {prog}."

        if action_type == "update_user_role":
            current_role = str(payload.get("current_role", "")).lower()
            new_role = str(payload.get("new_role", "")).strip()
            if current_role in PROTECTED_ROLES and new_role.lower() not in PROTECTED_ROLES:
                raise ValueError("Guardrail blocked: Cannot demote a Master Admin via agent.")
            uid = _parse_int_id(payload.get("user_id"))
            if uid is not None:
                session = self.db or SessionLocal()
                try:
                    u = session.query(User).filter(User.user_id == uid).first()
                    if u:
                        if u.role_id == 1 and new_role.lower() not in PROTECTED_ROLES:
                            raise ValueError("Guardrail blocked: Cannot demote a Master Admin via agent.")
                        role_obj = (
                            session.query(Role)
                            .filter(Role.role_name.ilike(new_role))
                            .first()
                        )
                        if not role_obj:
                            raise ValueError(f"Role '{new_role}' does not exist in RBAC roles table.")
                        u.role_id = role_obj.id
                        session.commit()
                        new_role = role_obj.role_name
                finally:
                    if not self.db:
                        session.close()
            return f"Updated {payload.get('name', uid)} role to '{new_role}'."

        if action_type == "deactivate_dormant":
            raw_ids = payload.get("user_ids", [])
            int_ids = [i for i in (_parse_int_id(x) for x in raw_ids) if i is not None]
            updated_count = len(raw_ids)
            if int_ids:
                session = self.db or SessionLocal()
                try:
                    targets = (
                        session.query(User)
                        .filter(User.user_id.in_(int_ids), User.role_id != 1)
                        .all()
                    )
                    for u in targets:
                        u.is_active = False
                    session.commit()
                    updated_count = len(targets)
                finally:
                    if not self.db:
                        session.close()
            return f"Archived {updated_count} dormant account(s) (60d+ inactive, Master Admins protected)."

        if action_type == "book_meeting":
            cal = CalendarService(self.sb)
            attendee_name = payload.get("attendee_name", "Learner")
            attendee_email = payload.get("attendee_email", "")
            agenda = payload.get("agenda", "15-min learning progress check-in")

            booking = cal.create_meeting_event(
                admin_id=str(payload.get("admin_id") or "admin-1"),
                attendee_name=attendee_name,
                attendee_email=attendee_email,
                start_iso=payload.get("start_iso", ""),
                end_iso=payload.get("end_iso"),
                agenda=agenda,
                action_id=action_id or payload.get("action_id"),
            )

            if attendee_email:
                send_meeting_invite_email(
                    to_email=attendee_email,
                    attendee_name=attendee_name,
                    slot_label=booking["slot_label"],
                    agenda=agenda,
                    meet_link=booking.get("meet_link"),
                )

            link_note = (
                f" • Meet: {booking['meet_link']}"
                if booking.get("meet_link")
                else " • ICS fallback ready"
            )
            return f"Booked {booking['slot_label']} with {attendee_name} ({booking['delivery_mode']}{link_note})."

        raise ValueError(f"Unsupported Tier-3 action_type: {action_type}")

