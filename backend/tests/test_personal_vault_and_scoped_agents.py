"""
Verification Suite for Tab-Scoped Agentic AI, Redirect Guardrails, Final Permission Flows,
and Per-Student Isolated Personal Program Vault Quizzes.

Run:
    backend\\venv\\Scripts\\python.exe backend/tests/test_personal_vault_and_scoped_agents.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from sqlalchemy import text

import main
from auth import create_access_token
from database import SessionLocal, engine
from models import User


def run_suite() -> None:
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email.ilike("anujjadhv3558@gmail.com")).first()
        if not admin_user:
            admin_user = db.query(User).filter(User.role_id.in_([1, 2])).first()
        anuj_student = db.query(User).filter(User.user_id == 62).first()  # Anuj Jadhav 2
        other_student = (
            db.query(User)
            .filter(~User.role_id.in_([1, 2]), User.user_id != 62)
            .first()
        )
        assert admin_user is not None, "Need Admin user in DB"
        assert anuj_student is not None, "Need Anuj Jadhav 2 (user_id=62) in DB"
        assert other_student is not None, "Need a second non-admin learner in DB to verify isolation"

        admin_id = admin_user.user_id
        anuj_id = anuj_student.user_id
        other_id = other_student.user_id
        test_start_ts = db.execute(text("SELECT now()")).scalar()
    finally:
        db.close()

    admin_headers = {"Authorization": f"Bearer {create_access_token({'user_id': admin_id})}"}
    anuj_headers = {"Authorization": f"Bearer {create_access_token({'user_id': anuj_id})}"}
    other_headers = {"Authorization": f"Bearer {create_access_token({'user_id': other_id})}"}

    created_quiz_id = None
    try:
        with TestClient(main.app) as client:
            print("\n=== TAB-SCOPED AGENTIC AI & PERSONAL VAULT VERIFICATION ===\n")

            # 1. Calendar AI Assistant: Saturday 2-hr parsing + Final Consent + Out-of-Scope Redirect
            r_cal_ok = client.post(
                "/ai/scheduler-chat",
                headers=admin_headers,
                json={
                    "message": "book a meeting on saturday 10 am for 2 hours for anuj jadhav 2 student anujjadhv3551@gmail.com",
                    "admin_id": admin_id,
                    "confirm_proposal": False,
                },
            )
            assert r_cal_ok.status_code == 200, r_cal_ok.text
            d_cal = r_cal_ok.json()
            assert d_cal.get("needs_consent") is True, d_cal
            prop = d_cal["proposal"]
            assert prop["start"] == "10:00" and prop["end"] == "12:00", prop
            assert prop["attendee_email"] == "anujjadhv3551@gmail.com", prop
            assert "anuj" in prop["attendee_name"].lower(), prop

            # Off-domain question to Calendar AI -> MUST refuse & redirect
            r_cal_ood = client.post(
                "/ai/scheduler-chat",
                headers=admin_headers,
                json={
                    "message": "give a manual hard quiz for anuj",
                    "admin_id": admin_id,
                },
            )
            assert r_cal_ood.status_code == 200
            d_ood = r_cal_ood.json()
            assert d_ood.get("out_of_scope") is True and d_ood.get("redirect_to") == "/programs", d_ood
            print(
                f"[PASS 1/5] Calendar AI Scoped -> Parsed Sat {prop['date']} 10:00-12:00 (final consent), "
                "refused & redirected quiz prompt to /programs"
            )

            # 2. Dashboard AI Co-Pilot (/ai/chat): Out-of-Scope Redirects & Auth Guard
            r_dash_cal = client.post(
                "/ai/chat",
                headers=admin_headers,
                json={"messages": [{"role": "user", "content": "book a meeting tomorrow at 3 PM"}]},
            )
            assert r_dash_cal.status_code == 200 and r_dash_cal.json().get("redirect_to") == "/admin/schedule"

            r_dash_quiz = client.post(
                "/ai/chat",
                headers=admin_headers,
                json={"messages": [{"role": "user", "content": "give a manual hard quiz for anuj"}]},
            )
            assert r_dash_quiz.status_code == 200 and r_dash_quiz.json().get("redirect_to") == "/programs"

            r_dash_learner_nudge = client.post(
                "/ai/chat",
                headers=other_headers,
                json={"messages": [{"role": "user", "content": "send notification nudge to dormant learners"}]},
            )
            assert r_dash_learner_nudge.status_code == 200
            assert "Only verified Admins" in r_dash_learner_nudge.json()["reply"]
            print("[PASS 2/5] Dashboard AI Co-Pilot -> Scoped redirects (/admin/schedule, /programs) & RBAC guard verified")

            # 3. Programs Vault AI Assistant: Out-of-Scope Redirect + Final Permission Proposal
            r_vault_ood = client.post(
                "/api/vault/assistant",
                headers=admin_headers,
                json={"message": "book a meeting tomorrow at 2 pm"},
            )
            assert r_vault_ood.status_code == 200 and r_vault_ood.json().get("out_of_scope") is True
            assert r_vault_ood.json().get("redirect_to") == "/admin/schedule"

            r_vault_gen = client.post(
                "/api/vault/assistant",
                headers=admin_headers,
                json={
                    "message": "give a manual hard quiz on Client Trust for Anuj Jadhav 2",
                    "question_count": 4,
                },
            )
            assert r_vault_gen.status_code == 200, r_vault_gen.text
            gen_data = r_vault_gen.json()
            assert gen_data.get("needs_consent") is True, gen_data
            action_id = gen_data["action_id"]
            assert gen_data["proposal"]["target_user_id"] == anuj_id
            assert gen_data["proposal"]["difficulty"] == "hard"

            # Before final permission, Anuj's vault does NOT yet have this quiz
            r_pre = client.get("/api/vault/quizzes", headers=anuj_headers)
            assert not any(q["topic"] == "Client Trust" for q in r_pre.json()["quizzes"])

            # Learner cannot approve delivery
            r_learner_confirm = client.post(
                "/api/vault/assistant",
                headers=other_headers,
                json={"message": "confirm", "confirm_action_id": action_id},
            )
            assert r_learner_confirm.status_code == 403

            # Admin grants final permission -> delivers to Anuj's Personal Vault
            r_confirm = client.post(
                "/api/vault/assistant",
                headers=admin_headers,
                json={"message": "confirm", "confirm_action_id": action_id},
            )
            assert r_confirm.status_code == 200, r_confirm.text
            assert r_confirm.json().get("delivered") is True, r_confirm.json()
            print(f"[PASS 3/5] Programs Vault AI -> Refused calendar prompt, generated HARD quiz, delivered only after Admin approval ({action_id[:8]})")

            # 4. Strict Per-User Vault Isolation + Main Program Data Integration Verification
            r_anuj_vault = client.get("/api/vault/quizzes", headers=anuj_headers)
            assert r_anuj_vault.status_code == 200
            anuj_quizzes = r_anuj_vault.json()["quizzes"]
            matching = [q for q in anuj_quizzes if q.get("difficulty") == "hard" and "Client Trust" in (q.get("title") or "")]
            assert len(matching) == 1, anuj_quizzes
            created_quiz = matching[0]
            created_quiz_id = created_quiz["id"]
            # Answer key must NOT be leaked before submission
            assert all("correctIndex" not in q for q in created_quiz["questions"])

            # Verify it is injected directly inside the MAIN /programs/{id} modules payload ONLY for Anuj!
            r_prog_anuj = client.get("/programs/66", headers=anuj_headers)
            assert r_prog_anuj.status_code == 200, r_prog_anuj.text
            anuj_mods = r_prog_anuj.json()["modules"]
            assert any(m.get("vault_quiz_id") == created_quiz_id and m.get("is_personal") is True for m in anuj_mods), anuj_mods

            r_prog_other = client.get("/programs/66", headers=other_headers)
            assert r_prog_other.status_code == 200, r_prog_other.text
            other_mods = r_prog_other.json()["modules"]
            assert not any(m.get("vault_quiz_id") == created_quiz_id for m in other_mods), "SECURITY BREACH: Student #other saw Anuj's quiz in /programs/66!"

            # Different student (even if passing ?target_user_id=62) CANNOT see Anuj's quiz!
            r_other_vault = client.get(f"/api/vault/quizzes?target_user_id={anuj_id}", headers=other_headers)
            assert r_other_vault.status_code == 200
            other_ids = {q["id"] for q in r_other_vault.json()["quizzes"]}
            assert created_quiz_id not in other_ids, "SECURITY BREACH: Another student saw Anuj's personal quiz!"

            # Different student attempting direct submit gets 403 Forbidden
            r_other_submit = client.post(
                f"/api/vault/quizzes/{created_quiz_id}/submit",
                headers=other_headers,
                json={"answers": {}},
            )
            assert r_other_submit.status_code == 403, r_other_submit.status_code
            print(f"[PASS 4/5] Strict Main-Data & Vault Isolation -> Merged into /programs/66 exclusively for Anuj (#{anuj_id}); hidden & 403-blocked for student #{other_id}")

            # 5. Anuj takes & submits his personal hard quiz -> Graded cleanly
            answers = {q["id"]: 0 for q in created_quiz["questions"]}
            r_submit = client.post(
                f"/api/vault/quizzes/{created_quiz_id}/submit",
                headers=anuj_headers,
                json={"answers": answers},
            )
            assert r_submit.status_code == 200, r_submit.text
            sub_res = r_submit.json()
            assert "score" in sub_res and len(sub_res["breakdown"]) == len(created_quiz["questions"])
            print(f"[PASS 5/5] Personal Quiz Submission -> Graded Anuj's attempt ({sub_res['score']}%, {sub_res['correct']}/{sub_res['total']})")

            print("\nALL 5 TAB-SCOPED AGENT & PERSONAL VAULT CHECKS PASSED.\n")
    finally:
        with engine.begin() as conn:
            if created_quiz_id:
                conn.execute(text("DELETE FROM personal_vault_quizzes WHERE id = CAST(:qid AS uuid)"), {"qid": created_quiz_id})
            conn.execute(text("DELETE FROM personal_vault_quizzes WHERE created_at >= :ts"), {"ts": test_start_ts})
            conn.execute(text("DELETE FROM agent_audit_log WHERE created_at >= :ts"), {"ts": test_start_ts})
            conn.execute(text("DELETE FROM agent_notifications WHERE created_at >= :ts"), {"ts": test_start_ts})
            conn.execute(text("DELETE FROM agent_action_queue WHERE created_at >= :ts"), {"ts": test_start_ts})


if __name__ == "__main__":
    run_suite()

