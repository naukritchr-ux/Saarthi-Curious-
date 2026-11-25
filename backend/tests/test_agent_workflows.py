"""
End-to-End Verification Suite for Saarthi Curious Hybrid AI + Backup Workflows.
Run directly from your project root:
    backend\\venv\\Scripts\\python.exe backend/tests/test_agent_workflows.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure backend/ is importable regardless of working directory
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import text

from auth import create_access_token
from database import SessionLocal, engine
from models import User
from agents.gate import SafetyGate
from routes import agent as agent_route
from routes import integrations as integrations_route
from routes import module_ai as module_ai_route


def build_test_app() -> FastAPI:
    app = FastAPI()
    agent_route.supabase_client = None
    integrations_route.supabase_client = None
    app.include_router(agent_route.router)
    app.include_router(module_ai_route.router)
    app.include_router(integrations_route.router)
    return app


def run_all_tests() -> None:
    db = SessionLocal()
    try:
        master_admin = db.query(User).filter(User.role_id == 1).first()
        admin_user = master_admin or db.query(User).filter(User.role_id.in_([1, 2])).first()
        learner_user = db.query(User).filter(~User.role_id.in_([1, 2])).first()
        assert admin_user is not None, "Need at least one Admin/Master Admin user in DB"
        assert learner_user is not None, "Need at least one non-admin learner user in DB"
        test_start_ts = db.execute(text("SELECT now()")).scalar()
        admin_id = admin_user.user_id
        master_id = master_admin.user_id if master_admin else admin_user.user_id
        master_name = (master_admin.full_name if master_admin else admin_user.full_name) or "Master Admin"
        learner_id = learner_user.user_id
    finally:
        db.close()

    admin_token = create_access_token({"user_id": admin_id})
    learner_token = create_access_token({"user_id": learner_id})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    prev_cron_secret = os.environ.get("CRON_SECRET")
    app = build_test_app()

    try:
        client = TestClient(app)
        print("\n=== SAARTHI AGENT WORKFLOW VERIFICATION ===\n")

        # 1. Health & Engine Status Check
        r = client.get("/api/agent/health")
        assert r.status_code == 200, f"Health failed: {r.text}"
        health = r.json()
        assert health["deterministic_backup_ready"] is True
        print(
            f"[PASS 1/7] Health Check -> primary_ai={health['primary_ai_ready']}, "
            f"backup=True, email={health['email_mode']}"
        )

        # 2. Tier 1: Tab-Entry Deterministic Sync
        r = client.get("/api/agent/tab-sync/reports", headers=admin_headers)
        assert r.status_code == 200, f"Tab sync failed: {r.text}"
        sync = r.json()
        assert sync["engine"] == "deterministic_sync"
        assert sync["metrics"]["total_users"] > 0
        print(f"[PASS 2/7] Tab-Entry Sync -> {sync['briefing']}")

        # 3. Tier 2: Cooldown-Capped Nudge (1st runs, 2nd skips within 72h)
        gate = SafetyGate(supabase=None)
        first = gate.run_tier2_nudge(
            target_user_id="test-learner-99",
            target_name="Test Learner",
            message="Finish Module 1 today!",
            engine_source="deterministic_backup",
        )
        second = gate.run_tier2_nudge(
            target_user_id="test-learner-99",
            target_name="Test Learner",
            message="Duplicate nudge should be blocked",
            engine_source="deterministic_backup",
        )
        assert first["status"] == "executed", f"Expected executed, got {first}"
        assert second["status"] == "skipped_cooldown", f"Expected cooldown skip, got {second}"
        print("[PASS 3/7] Tier-2 Cooldown Gate -> 1st nudge executed, 2nd nudge blocked (72h cooldown)")

        # 4. Tier 3: Hybrid Command Failover + RBAC Block + Approval Execution
        r = client.post(
            "/api/agent/command",
            headers=admin_headers,
            json={
                "prompt": "Book a 15-min retention meeting with Sneha tomorrow",
                "force_backup": True,
            },
        )
        assert r.status_code == 200, f"Command failed: {r.text}"
        cmd_data = r.json()
        assert cmd_data["engine"] == "deterministic_backup"
        action_id = cmd_data["queued_action"]["id"]

        # Non-admin must receive 403 Forbidden (backend RBAC source of truth)
        r_forbidden = client.post(
            f"/api/agent/actions/{action_id}/decision",
            headers=learner_headers,
            json={"decision": "approve"},
        )
        assert r_forbidden.status_code == 403, (
            f"Expected 403 for learner, got {r_forbidden.status_code}"
        )

        # Admin approval executes the booking & writes to audit log
        r_approve = client.post(
            f"/api/agent/actions/{action_id}/decision",
            headers=admin_headers,
            json={"decision": "approve"},
        )
        assert r_approve.status_code == 200, f"Approve failed: {r_approve.text}"
        assert r_approve.json()["action"]["status"] == "executed"
        print(
            f"[PASS 4/7] Tier-3 Approval + RBAC -> Learner blocked (403), "
            f"Admin executed booking ({action_id[:8]})"
        )

        # 5. Master Admin Demotion Guardrail
        demote_card = gate.queue_tier3_action(
            action_type="update_user_role",
            summary="Attempt to demote Master Admin",
            payload={
                "user_id": str(master_id),
                "name": master_name,
                "current_role": "Master Admin",
                "new_role": "Franchise Employee",
            },
            diff_preview={"before": "Master Admin", "after": "Franchise Employee"},
            requested_by=str(admin_id),
            engine_source="deterministic_backup",
        )
        r_guard = client.post(
            f"/api/agent/actions/{demote_card['id']}/decision",
            headers=admin_headers,
            json={"decision": "approve"},
        )
        assert r_guard.status_code == 200, f"Guardrail call failed: {r_guard.text}"
        guard_action = r_guard.json()["action"]
        assert guard_action["status"] == "failed", guard_action
        assert "Master Admin" in (guard_action.get("error_message") or "")
        print("[PASS 5/7] Master Admin Protection Guardrail -> Demotion safely blocked")

        # 6. Sprint 2 Generative Module Studio (Deterministic Backup Mode + RBAC)
        r_mod_forbidden = client.post(
            "/api/ai/generate-module-kit",
            headers=learner_headers,
            data={"module_title": "Test", "raw_notes": "Notes", "force_backup": "true"},
        )
        assert r_mod_forbidden.status_code == 403

        r_mod = client.post(
            "/api/ai/generate-module-kit",
            headers=admin_headers,
            data={
                "module_title": "Executive Client Trust",
                "raw_notes": (
                    "Executive client trust requires transparent quarterly value reviews and proactive risk tracking. "
                    "Account leads document measurable ROI milestones before every renewal conversation. "
                    "Consistent follow-ups prevent mid-contract churn and build long-term advocacy."
                ),
                "question_count": "3",
                "force_backup": "true",
            },
        )
        assert r_mod.status_code == 200, f"Module kit failed: {r_mod.text}"
        kit = r_mod.json()["kit"]
        assert kit["engine"] == "deterministic_backup"
        assert len(kit["questions"]) == 3
        assert all(len(q["options"]) == 4 for q in kit["questions"])
        print(
            f"[PASS 6/7] Module Studio Backup Generator -> Built {len(kit['questions'])} valid MCQs + "
            f"{len(kit['recap_bullets'])} recap bullets (learner RBAC 403 enforced)"
        )

        # 7. Sprint 3 Calendar Free Slots + Secured Daily Cron + Audit Log Endpoint
        r_slots = client.get("/api/integrations/google/free-slots", headers=admin_headers)
        assert r_slots.status_code == 200
        assert len(r_slots.json()["slots"]) > 0

        os.environ["CRON_SECRET"] = "saarthi-test-secret"
        r_unauth = client.post(
            "/api/integrations/cron/daily",
            headers={**admin_headers, "X-Cron-Secret": "wrong"},
        )
        assert r_unauth.status_code == 401

        r_cron = client.post(
            "/api/integrations/cron/daily",
            headers={**admin_headers, "X-Cron-Secret": "saarthi-test-secret"},
        )
        assert r_cron.status_code == 200, f"Cron failed: {r_cron.text}"
        cron_res = r_cron.json()

        r_audit_forbidden = client.get("/api/agent/audit-log", headers=learner_headers)
        assert r_audit_forbidden.status_code == 403

        r_audit = client.get("/api/agent/audit-log", headers=admin_headers)
        assert r_audit.status_code == 200
        assert len(r_audit.json()["logs"]) >= 2
        print(
            f"[PASS 7/7] Calendar, Daily Cron & Audit Log -> {len(r_slots.json()['slots'])} IST slots ready, "
            f"cron auth enforced, {cron_res['tier3_cards_queued']} Tier-3 cards queued, "
            f"{len(r_audit.json()['logs'])} audit records logged"
        )

        print("\nALL 7 SPRINT 1-4 CHECKS PASSED.\n")
    finally:
        if prev_cron_secret is None:
            os.environ.pop("CRON_SECRET", None)
        else:
            os.environ["CRON_SECRET"] = prev_cron_secret

        # Clean up synthetic test rows created during test run
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM coaching_meetings WHERE created_at >= :ts"), {"ts": test_start_ts})
            conn.execute(text("DELETE FROM agent_audit_log WHERE created_at >= :ts"), {"ts": test_start_ts})
            conn.execute(text("DELETE FROM agent_notifications WHERE created_at >= :ts"), {"ts": test_start_ts})
            conn.execute(text("DELETE FROM agent_action_queue WHERE created_at >= :ts"), {"ts": test_start_ts})


if __name__ == "__main__":
    run_all_tests()

