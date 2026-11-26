import os
import sys
import uuid
import json

from fastapi.testclient import TestClient
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from auth import create_access_token
from database import SessionLocal, engine
from models import User, Module, Quiz, QuizQuestion

client = TestClient(app)


def run_quiz_editing_tests():
    db = SessionLocal()
    created_vault_id = None
    created_hybrid_batch = None
    created_studio_quiz_id = None
    original_module_title = None
    original_quiz_title = None
    original_quiz_passing = None
    original_questions = []
    target_module_id = None
    target_program_id = None
    target_quiz_id = None

    try:
        admin_user = db.query(User).filter(User.role_id.in_([1, 2]), User.is_active == True).first()  # noqa: E712
        learner_a = db.query(User).filter(User.role_id.notin_([1, 2]), User.is_active == True).order_by(User.user_id.asc()).first()  # noqa: E712
        learner_b = db.query(User).filter(User.role_id.notin_([1, 2]), User.is_active == True, User.user_id != learner_a.user_id).order_by(User.user_id.desc()).first()  # noqa: E712
        assert admin_user is not None, "Need active Admin/Master Admin user"
        assert learner_a is not None, "Need active Learner user A"
        assert learner_b is not None, "Need active Learner user B"

        admin_headers = {
            "Authorization": f"Bearer {create_access_token({'user_id': admin_user.user_id})}"
        }
        learner_headers = {
            "Authorization": f"Bearer {create_access_token({'user_id': learner_a.user_id})}"
        }
        learner_b_headers = {
            "Authorization": f"Bearer {create_access_token({'user_id': learner_b.user_id})}"
        }

        # ------------------------------------------------------------------
        # 1. Test PATCH /programs/{program_id}/modules/{module_id} (preserving quiz)
        # ------------------------------------------------------------------
        mod_row = db.query(Module).order_by(Module.id.asc()).first()
        assert mod_row is not None, "Need at least one Module in DB"
        target_module_id = mod_row.id
        target_program_id = mod_row.program_id
        original_module_title = mod_row.title

        quiz_row = (
            db.query(Quiz)
            .filter(Quiz.module_id == target_module_id)
            .order_by(Quiz.id.asc())
            .first()
        )
        assert quiz_row is not None, "Need at least one Quiz in target Module"
        target_quiz_id = quiz_row.id
        original_quiz_title = quiz_row.title
        original_quiz_passing = quiz_row.passing_percentage
        original_questions = [
            {
                "question": q.question,
                "options": q.options,
                "explanation": q.explanation,
                "marks": q.marks,
                "question_order": q.question_order,
            }
            for q in db.query(QuizQuestion)
            .filter(QuizQuestion.quiz_id == target_quiz_id)
            .order_by(QuizQuestion.question_order.asc())
            .all()
        ]

        # RBAC check: learner must be rejected with 403
        r_forbid = client.patch(
            f"/programs/{target_program_id}/modules/{target_module_id}",
            headers=learner_headers,
            json={"title": "Hacked Title"},
        )
        assert r_forbid.status_code == 403, f"Expected 403 for learner, got {r_forbid.status_code}"

        # Admin update must persist to PostgreSQL
        r_ok = client.patch(
            f"/programs/{target_program_id}/modules/{target_module_id}",
            headers=admin_headers,
            json={
                "id": str(target_module_id),
                "title": original_module_title,
                "quiz": {
                    "id": target_quiz_id,
                    "title": f"{original_quiz_title} [Edited]",
                    "passingScore": 85,
                    "questions": [
                        {
                            "question": "Edited verification question?",
                            "options": ["Alpha", "Beta", "Gamma", "Delta"],
                            "correctIndex": 2,
                            "explanation": "Gamma is verified.",
                        }
                    ],
                },
            },
        )
        assert r_ok.status_code == 200, f"PATCH failed: {r_ok.status_code} {r_ok.text}"
        body = r_ok.json()
        assert body["status"] == "updated"
        assert body["question_count"] == 1

        # ------------------------------------------------------------------
        # 2. Test Create New Quiz on Same Module WITHOUT Overwriting Previous Quiz
        # ------------------------------------------------------------------
        r_new_forbid = client.post(
            f"/programs/{target_program_id}/modules/{target_module_id}/quizzes/studio",
            headers=learner_headers,
            json={"title": "Unauthorized Quiz", "questions": []},
        )
        assert r_new_forbid.status_code == 403

        r_new_quiz = client.post(
            f"/programs/{target_program_id}/modules/{target_module_id}/quizzes/studio",
            headers=admin_headers,
            json={
                "title": "Second Genuine Assessment",
                "passingScore": 75,
                "questions": [
                    {
                        "question": "Second quiz verification?",
                        "options": ["One", "Two", "Three", "Four"],
                        "correctIndex": 1,
                        "explanation": "Two is correct",
                    }
                ],
            },
        )
        assert r_new_quiz.status_code == 200, f"Create new quiz failed: {r_new_quiz.text}"
        created_studio_quiz_id = r_new_quiz.json()["quiz_id"]
        assert created_studio_quiz_id != target_quiz_id

        r_prog = client.get(f"/programs/{target_program_id}", headers=admin_headers)
        assert r_prog.status_code == 200
        mod_payload = next(
            (m for m in r_prog.json()["modules"] if m["id"] == target_module_id), None
        )
        assert mod_payload is not None
        quiz_ids_in_mod = [q["id"] for q in mod_payload["quizzes"]]
        assert target_quiz_id in quiz_ids_in_mod, "Previous quiz disappeared!"
        assert created_studio_quiz_id in quiz_ids_in_mod, "New quiz not visible!"

        # ------------------------------------------------------------------
        # 3. Test Hybrid Quiz for Specific Candidates + Strict Visibility Isolation
        # ------------------------------------------------------------------
        r_cand_forbid = client.get("/api/vault/candidates", headers=learner_headers)
        assert r_cand_forbid.status_code == 403
        r_cand_ok = client.get("/api/vault/candidates", headers=admin_headers)
        assert r_cand_ok.status_code == 200
        assert len(r_cand_ok.json()["candidates"]) >= 2

        r_hyb = client.post(
            "/api/vault/hybrid-quizzes",
            headers=admin_headers,
            json={
                "program_id": target_program_id,
                "module_id": target_module_id,
                "title": "Hybrid Candidate Challenge [Temp]",
                "difficulty": "hard",
                "passing_score": 80,
                "time_limit_mins": 12,
                "target_user_ids": [learner_a.user_id],
                "questions": [
                    {
                        "question": "Hybrid scenario question?",
                        "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
                        "correctIndex": 3,
                        "explanation": "D fits the scenario.",
                    }
                ],
            },
        )
        assert r_hyb.status_code == 200, f"Hybrid create failed: {r_hyb.text}"
        created_hybrid_batch = r_hyb.json()["batch_key"]

        # Assigned learner A sees Hybrid Quiz inside module_id WITHOUT correctIndex
        r_a = client.get(f"/programs/{target_program_id}", headers=learner_headers)
        mod_a = next((m for m in r_a.json()["modules"] if m["id"] == target_module_id), None)
        hyb_for_a = [q for q in mod_a["quizzes"] if q.get("quiz_mode") == "hybrid" and q["title"] == "Hybrid Candidate Challenge [Temp]"]
        assert len(hyb_for_a) == 1, "Assigned candidate did not receive hybrid quiz inside module"
        assert "correctIndex" not in hyb_for_a[0]["questions"][0], "Answer leaked to learner!"

        # Unassigned learner B MUST NOT see it
        r_b = client.get(f"/programs/{target_program_id}", headers=learner_b_headers)
        mod_b = next((m for m in r_b.json()["modules"] if m["id"] == target_module_id), None)
        hyb_for_b = [q for q in mod_b["quizzes"] if q.get("batch_key") == created_hybrid_batch]
        assert len(hyb_for_b) == 0, "Unassigned candidate saw hybrid quiz!"

        # Update Hybrid batch
        r_hyb_put = client.put(
            f"/api/vault/hybrid-quizzes/{created_hybrid_batch}",
            headers=admin_headers,
            json={
                "title": "Hybrid Candidate Challenge [Updated]",
                "passing_score": 85,
                "target_user_ids": [learner_a.user_id],
            },
        )
        assert r_hyb_put.status_code == 200

        # ------------------------------------------------------------------
        # 4. Test Single Vault Quiz PUT (RBAC + Persist)
        # ------------------------------------------------------------------
        created_vault_id = str(uuid.uuid4())
        with engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO personal_vault_quizzes "
                    "(id, target_user_id, created_by, program_id, title, topic, difficulty, questions, passing_score, time_limit_mins, status) "
                    "VALUES (CAST(:id AS uuid), :uid, :aid, :pid, :title, :topic, 'hard', CAST(:qs AS jsonb), 75, 15, 'assigned')"
                ),
                {
                    "id": created_vault_id,
                    "uid": learner_a.user_id,
                    "aid": admin_user.user_id,
                    "pid": target_program_id,
                    "title": "Temp Personal Vault Quiz",
                    "topic": "Client Relationships",
                    "qs": json.dumps([
                        {
                            "id": "vq-1",
                            "question": "Initial vault Q?",
                            "options": ["A", "B", "C", "D"],
                            "correctIndex": 0,
                            "explanation": "Initial",
                        }
                    ]),
                },
            )

        rv_forbid = client.put(
            f"/api/vault/quizzes/{created_vault_id}",
            headers=learner_headers,
            json={"title": "Learner Hack"},
        )
        assert rv_forbid.status_code == 403

        rv_ok = client.put(
            f"/api/vault/quizzes/{created_vault_id}",
            headers=admin_headers,
            json={
                "title": "Edited Personal Vault Quiz",
                "difficulty": "medium",
                "passing_score": 90,
                "time_limit_mins": 20,
                "questions": [
                    {
                        "id": "vq-1",
                        "question": "Updated personal vault question?",
                        "options": ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
                        "correctIndex": 1,
                        "explanation": "Opt 2 is right",
                    }
                ],
            },
        )
        assert rv_ok.status_code == 200
        assert rv_ok.json()["passing_score"] == 90

        print("ALL MULTI-QUIZ, HYBRID CANDIDATE & VAULT EDITING TESTS PASSED")
    finally:
        # Clean up & restore original PostgreSQL data
        db.expire_all()
        if created_studio_quiz_id:
            db.query(QuizQuestion).filter(QuizQuestion.quiz_id == created_studio_quiz_id).delete(synchronize_session=False)
            db.query(Quiz).filter(Quiz.id == created_studio_quiz_id).delete(synchronize_session=False)
        if target_module_id and original_module_title:
            m = db.query(Module).filter(Module.id == target_module_id).first()
            if m:
                m.title = original_module_title
        if target_quiz_id and original_quiz_title is not None:
            q = db.query(Quiz).filter(Quiz.id == target_quiz_id).first()
            if q:
                q.title = original_quiz_title
                q.passing_percentage = original_quiz_passing
                db.query(QuizQuestion).filter(QuizQuestion.quiz_id == target_quiz_id).delete(synchronize_session=False)
                for orig in original_questions:
                    db.add(
                        QuizQuestion(
                            quiz_id=target_quiz_id,
                            question=orig["question"],
                            options=orig["options"],
                            explanation=orig["explanation"],
                            marks=orig["marks"],
                            question_order=orig["question_order"],
                        )
                    )
        db.commit()
        with engine.begin() as conn:
            if created_vault_id:
                conn.execute(
                    text("DELETE FROM personal_vault_quizzes WHERE id = CAST(:id AS uuid)"),
                    {"id": created_vault_id},
                )
            if created_hybrid_batch:
                conn.execute(
                    text("DELETE FROM personal_vault_quizzes WHERE batch_key = :bkey"),
                    {"bkey": created_hybrid_batch},
                )
        db.close()


if __name__ == "__main__":
    run_quiz_editing_tests()
