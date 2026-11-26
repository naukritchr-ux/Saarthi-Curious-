from __future__ import annotations

import json
import re
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from auth import get_current_user
from database import engine, get_db, supabase as supabase_client
from models import User
from agents.gate import SafetyGate
from agents.module_generator import generate_module_kit

router = APIRouter(prefix="/api/vault", tags=["Personal Program Vault"])


class SubmitVaultQuizRequest(BaseModel):
    answers: Dict[str, int]


class UpdateVaultQuizRequest(BaseModel):
    title: Optional[str] = None
    difficulty: Optional[str] = None
    passing_score: Optional[int] = None
    time_limit_mins: Optional[int] = None
    questions: Optional[List[Dict[str, Any]]] = None


class HybridQuizCreateRequest(BaseModel):
    program_id: Optional[int] = None
    module_id: Optional[int] = None
    title: str
    topic: Optional[str] = None
    difficulty: str = "medium"
    passing_score: int = 70
    time_limit_mins: int = 10
    target_user_ids: List[int]
    questions: List[Dict[str, Any]] = []


class HybridQuizUpdateRequest(BaseModel):
    module_id: Optional[int] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    passing_score: Optional[int] = None
    time_limit_mins: Optional[int] = None
    target_user_ids: Optional[List[int]] = None
    questions: Optional[List[Dict[str, Any]]] = None


def _ensure_vault_hybrid_columns(conn) -> None:
    """Idempotently ensure module_id and batch_key exist on personal_vault_quizzes."""
    conn.execute(
        text(
            "ALTER TABLE personal_vault_quizzes "
            "ADD COLUMN IF NOT EXISTS module_id INTEGER, "
            "ADD COLUMN IF NOT EXISTS batch_key TEXT"
        )
    )


def _normalize_vault_questions(raw_questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for idx, q in enumerate(raw_questions or []):
        opts = q.get("options") or []
        clean_opts = [
            o.get("text", "") if isinstance(o, dict) else str(o)
            for o in opts
        ]
        while len(clean_opts) < 2:
            clean_opts.append(f"Option {len(clean_opts) + 1}")
        c_idx = int(q.get("correctIndex", 0) or 0)
        if c_idx < 0 or c_idx >= len(clean_opts):
            c_idx = 0
        normalized.append({
            "id": str(q.get("id") or f"vq-{idx + 1}"),
            "question": str(q.get("question") or f"Question {idx + 1}").strip(),
            "options": clean_opts,
            "correctIndex": c_idx,
            "explanation": str(q.get("explanation") or "").strip(),
        })
    return normalized


class ProgramsAssistantRequest(BaseModel):
    message: str
    confirm_action_id: Optional[str] = None
    reject_action_id: Optional[str] = None
    difficulty: Optional[str] = None
    question_count: int = 5


def _resolve_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Authenticated user not found.")
    return user


def _find_target_student(db: Session, message: str) -> Optional[User]:
    low = (message or "").lower()
    # 1. Explicit email match
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", message or "")
    if email_match:
        u = db.query(User).filter(User.email.ilike(email_match.group(0).strip())).first()
        if u:
            return u

    all_users = db.query(User).filter(User.is_active == True).all()  # noqa: E712
    # Prefer exact full_name match, prioritizing non-admin students first
    sorted_users = sorted(all_users, key=lambda x: (0 if (x.role_id or 5) >= 3 else 1, x.user_id))
    for u in sorted_users:
        fn = (u.full_name or "").strip().lower()
        if fn and fn in low:
            return u

    # Token match (e.g. "for anuj" -> Anuj Jadhav 2 student)
    after_for = re.search(r"(?:for|to)\s+([a-zA-Z0-9\s]{2,40})$", message or "", re.IGNORECASE)
    needle = after_for.group(1).strip().lower() if after_for else ""
    words = [w for w in re.split(r"\s+", needle or low) if len(w) >= 3 and w not in {"the", "quiz", "hard", "easy", "medium", "manual", "give", "send", "make", "create", "student", "user", "for", "with"}]
    for w in words:
        for u in sorted_users:
            fn = (u.full_name or "").lower()
            em = (u.email or "").lower()
            if w in fn or em.startswith(w):
                return u
    return None


def _detect_out_of_domain(msg: str) -> Optional[Dict[str, str]]:
    low = (msg or "").lower()
    is_quiz_or_program = any(
        k in low
        for k in (
            "quiz",
            "vault",
            "program",
            "module",
            "syllabus",
            "assessment",
            "study kit",
            "mcq",
            "test",
        )
    )
    if is_quiz_or_program:
        return None

    if any(k in low for k in ("meeting", "schedule", "calendar", "slot", "focus window", "reschedule", "book a call", "book call", "google meet")):
        return {
            "redirect_to": "/admin/schedule",
            "redirect_label": "Open Calendar Scheduler AI →",
            "domain": "Calendar & Scheduling",
        }
    if any(k in low for k in ("nudge", "notification", "reminder", "dormant", "inactive", "attrition")):
        return {
            "redirect_to": "/reports",
            "redirect_label": "Open Reports & Nudges Co-Pilot →",
            "domain": "Retention & Notifications",
        }
    if any(k in low for k in ("approve user", "role", "rbac", "permission", "certificate", "curo", "reward")):
        return {
            "redirect_to": "/admin/users",
            "redirect_label": "Open User & Access Control →",
            "domain": "IAM & Administration",
        }
    return None


@router.get("/quizzes")
def list_personal_vault_quizzes(
    scope: str = "mine",
    target_user_id: Optional[int] = None,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Personal Program Vault ledger.
    RBAC (AGENTS.md): Learners ONLY see rows where target_user_id == current_user_id.
    Only Admin (2) / Master Admin (1) can inspect assigned vault quizzes across learners.
    """
    user = _resolve_user(db, current_user_id)
    is_admin = user.role_id in (1, 2)

    with engine.connect() as conn:
        if is_admin and target_user_id is not None:
            rows = conn.execute(
                text(
                    "SELECT v.*, u.full_name AS target_name, u.email AS target_email "
                    "FROM personal_vault_quizzes v "
                    "LEFT JOIN users u ON u.user_id = v.target_user_id "
                    "WHERE v.target_user_id = :tuid "
                    "ORDER BY v.created_at DESC"
                ),
                {"tuid": int(target_user_id)},
            ).mappings().all()
        elif is_admin and scope == "assigned":
            rows = conn.execute(
                text(
                    "SELECT v.*, u.full_name AS target_name, u.email AS target_email "
                    "FROM personal_vault_quizzes v "
                    "LEFT JOIN users u ON u.user_id = v.target_user_id "
                    "ORDER BY v.created_at DESC LIMIT 50"
                )
            ).mappings().all()
        else:
            # Strict user isolation: always scope strictly to the logged-in user_id
            rows = conn.execute(
                text(
                    "SELECT v.*, u.full_name AS target_name, u.email AS target_email "
                    "FROM personal_vault_quizzes v "
                    "LEFT JOIN users u ON u.user_id = v.target_user_id "
                    "WHERE v.target_user_id = :uid "
                    "ORDER BY v.created_at DESC"
                ),
                {"uid": int(current_user_id)},
            ).mappings().all()

    items: List[Dict[str, Any]] = []
    for r in rows:
        d = dict(r)
        raw_q = d.get("questions") or []
        if isinstance(raw_q, str):
            raw_q = json.loads(raw_q)

        # Hide answer key for learners until submitted; expose to Admin/Master Admin editors
        safe_questions = []
        for idx, q in enumerate(raw_q):
            q_entry = {
                "id": q.get("id") or f"vq-{idx + 1}",
                "question": q.get("question", ""),
                "options": q.get("options", []),
            }
            if is_admin:
                q_entry["correctIndex"] = q.get("correctIndex", 0)
                q_entry["explanation"] = q.get("explanation", "")
            safe_questions.append(q_entry)

        items.append({
            "id": str(d["id"]),
            "target_user_id": d["target_user_id"],
            "target_name": d.get("target_name"),
            "target_email": d.get("target_email"),
            "created_by": d.get("created_by"),
            "program_id": d.get("program_id"),
            "title": d["title"],
            "topic": d.get("topic"),
            "difficulty": d.get("difficulty", "hard"),
            "passing_score": d.get("passing_score", 75),
            "time_limit_mins": d.get("time_limit_mins", 15),
            "status": d.get("status", "assigned"),
            "best_score": d.get("best_score"),
            "attempts_count": d.get("attempts_count", 0),
            "question_count": len(safe_questions),
            "questions": safe_questions,
            "created_at": d["created_at"].isoformat() if hasattr(d.get("created_at"), "isoformat") else str(d.get("created_at")),
        })

    return {
        "viewer_user_id": current_user_id,
        "viewer_name": user.full_name,
        "is_admin": is_admin,
        "quizzes": items,
    }


@router.post("/quizzes/{quiz_id}/submit")
def submit_personal_vault_quiz(
    quiz_id: str,
    req: SubmitVaultQuizRequest,
    current_user_id: int = Depends(get_current_user),
):
    """Grades a personal vault quiz strictly for its assigned target_user_id."""
    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT * FROM personal_vault_quizzes WHERE id = CAST(:qid AS uuid) LIMIT 1"),
            {"qid": quiz_id},
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="Personal vault quiz not found.")

        if int(row["target_user_id"]) != int(current_user_id):
            raise HTTPException(
                status_code=403,
                detail="Access denied: This personal quiz belongs exclusively to another learner's vault.",
            )

        questions = row["questions"] or []
        if isinstance(questions, str):
            questions = json.loads(questions)

        total = max(1, len(questions))
        correct = 0
        breakdown = []
        for idx, q in enumerate(questions):
            qid = str(q.get("id") or f"vq-{idx + 1}")
            selected = req.answers.get(qid, req.answers.get(str(idx)))
            right_idx = int(q.get("correctIndex", 0))
            is_right = selected is not None and int(selected) == right_idx
            if is_right:
                correct += 1
            breakdown.append({
                "id": qid,
                "question": q.get("question", ""),
                "selectedIndex": selected,
                "correctIndex": right_idx,
                "is_correct": is_right,
                "explanation": q.get("explanation", ""),
            })

        score_pct = round((correct / total) * 100)
        passing = int(row.get("passing_score") or 75)
        passed = score_pct >= passing
        prev_best = row.get("best_score")
        new_best = max(prev_best, score_pct) if prev_best is not None else score_pct
        new_status = "completed" if (passed or row.get("status") == "completed") else "assigned"

        conn.execute(
            text(
                "UPDATE personal_vault_quizzes "
                "SET attempts_count = attempts_count + 1, "
                "    best_score = :best, "
                "    status = :st, "
                "    completed_at = CASE WHEN :passed THEN COALESCE(completed_at, now()) ELSE completed_at END "
                "WHERE id = CAST(:qid AS uuid)"
            ),
            {"best": new_best, "st": new_status, "passed": passed, "qid": quiz_id},
        )

    return {
        "quiz_id": quiz_id,
        "score": score_pct,
        "correct": correct,
        "total": total,
        "passing_score": passing,
        "passed": passed,
        "best_score": new_best,
        "breakdown": breakdown,
    }


@router.put("/quizzes/{quiz_id}")
def update_personal_vault_quiz(
    quiz_id: str,
    req: UpdateVaultQuizRequest,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allows Master Admin / Admin to edit an assigned Personal Vault quiz."""
    user = _resolve_user(db, current_user_id)
    if user.role_id not in (1, 2):
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin or Admin can edit Personal Vault quizzes.",
        )

    with engine.begin() as conn:
        existing = conn.execute(
            text(
                "SELECT id, title, difficulty, passing_score, time_limit_mins, questions "
                "FROM personal_vault_quizzes WHERE id = CAST(:qid AS uuid)"
            ),
            {"qid": quiz_id},
        ).mappings().first()

        if not existing:
            raise HTTPException(status_code=404, detail="Personal quiz not found.")

        new_title = (req.title or existing["title"] or "Personal Assessment").strip()
        new_difficulty = (req.difficulty or existing.get("difficulty") or "hard").strip().lower()
        new_passing = (
            max(1, min(100, int(req.passing_score)))
            if req.passing_score is not None
            else int(existing.get("passing_score") or 75)
        )
        new_time = (
            max(1, int(req.time_limit_mins))
            if req.time_limit_mins is not None
            else int(existing.get("time_limit_mins") or 15)
        )

        raw_questions = req.questions
        if raw_questions is None:
            raw_questions = existing.get("questions") or []
            if isinstance(raw_questions, str):
                raw_questions = json.loads(raw_questions)
        else:
            raw_questions = _normalize_vault_questions(raw_questions)

        conn.execute(
            text(
                "UPDATE personal_vault_quizzes "
                "SET title = :title, "
                "    difficulty = :difficulty, "
                "    passing_score = :passing, "
                "    time_limit_mins = :time_mins, "
                "    questions = CAST(:questions AS jsonb) "
                "WHERE id = CAST(:qid AS uuid)"
            ),
            {
                "title": new_title,
                "difficulty": new_difficulty,
                "passing": new_passing,
                "time_mins": new_time,
                "questions": json.dumps(raw_questions),
                "qid": quiz_id,
            },
        )

    return {
        "status": "updated",
        "quiz_id": quiz_id,
        "title": new_title,
        "difficulty": new_difficulty,
        "passing_score": new_passing,
        "time_limit_mins": new_time,
        "question_count": len(raw_questions),
    }


@router.get("/candidates")
def list_hybrid_quiz_candidates(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists active learners/candidates for Admin Hybrid Quiz assignment."""
    user = _resolve_user(db, current_user_id)
    if user.role_id not in (1, 2):
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin or Admin can view candidate assignment rosters.",
        )

    role_labels = {
        1: "Master Admin",
        2: "Admin",
        3: "Team Leader",
        4: "Franchise Partner",
        5: "Franchise Employee",
        6: "Franchise Developer",
        7: "Head Office Staff",
    }
    rows = (
        db.query(User)
        .filter(User.is_active == True)  # noqa: E712
        .order_by(User.role_id.desc(), User.full_name.asc())
        .all()
    )
    candidates = [
        {
            "user_id": u.user_id,
            "full_name": u.full_name or u.email,
            "email": u.email,
            "role_id": u.role_id,
            "role_name": role_labels.get(u.role_id, "Learner"),
        }
        for u in rows
        if u.role_id not in (1, 2)
    ]
    return {"candidates": candidates, "count": len(candidates)}


@router.post("/hybrid-quizzes")
def create_hybrid_candidate_quiz(
    req: HybridQuizCreateRequest,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a targeted Hybrid Quiz assigned exclusively to specific candidates
    (stored per candidate in personal_vault_quizzes linked by batch_key & module_id).
    """
    user = _resolve_user(db, current_user_id)
    if user.role_id not in (1, 2):
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin or Admin can create targeted hybrid quizzes.",
        )

    target_ids = sorted({int(uid) for uid in (req.target_user_ids or [])})
    if not target_ids:
        raise HTTPException(status_code=400, detail="Select at least one target candidate.")

    clean_title = (req.title or "").strip()
    if not clean_title:
        raise HTTPException(status_code=400, detail="Quiz title is required.")

    clean_questions = _normalize_vault_questions(req.questions)
    diff = (req.difficulty or "medium").strip().lower()
    if diff not in ("easy", "medium", "hard"):
        diff = "medium"
    passing = max(10, min(100, int(req.passing_score or 70)))
    time_mins = max(1, int(req.time_limit_mins or 10))
    batch_key = str(uuid.uuid4())

    valid_users = (
        db.query(User)
        .filter(User.user_id.in_(target_ids), User.is_active == True)  # noqa: E712
        .all()
    )
    if not valid_users:
        raise HTTPException(status_code=404, detail="No valid active target candidates found.")

    created_ids: List[str] = []
    with engine.begin() as conn:
        _ensure_vault_hybrid_columns(conn)
        for u in valid_users:
            qid = str(uuid.uuid4())
            conn.execute(
                text(
                    "INSERT INTO personal_vault_quizzes "
                    "(id, target_user_id, created_by, program_id, module_id, batch_key, title, topic, difficulty, questions, passing_score, time_limit_mins, status) "
                    "VALUES (CAST(:id AS uuid), :uid, :aid, :pid, :mid, :bkey, :title, :topic, :diff, CAST(:qs AS jsonb), :passing, :time_mins, 'assigned')"
                ),
                {
                    "id": qid,
                    "uid": u.user_id,
                    "aid": current_user_id,
                    "pid": req.program_id,
                    "mid": req.module_id,
                    "bkey": batch_key,
                    "title": clean_title,
                    "topic": req.topic or clean_title,
                    "diff": diff,
                    "qs": json.dumps(clean_questions),
                    "passing": passing,
                    "time_mins": time_mins,
                },
            )
            created_ids.append(qid)

    return {
        "status": "created",
        "batch_key": batch_key,
        "quiz_ids": created_ids,
        "assigned_count": len(valid_users),
        "target_users": [
            {"user_id": u.user_id, "full_name": u.full_name, "email": u.email}
            for u in valid_users
        ],
    }


@router.put("/hybrid-quizzes/{batch_or_quiz_id}")
def update_hybrid_candidate_quiz(
    batch_or_quiz_id: str,
    req: HybridQuizUpdateRequest,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates an existing Hybrid Candidate Quiz batch and syncs assigned candidates."""
    user = _resolve_user(db, current_user_id)
    if user.role_id not in (1, 2):
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin or Admin can edit targeted hybrid quizzes.",
        )

    with engine.begin() as conn:
        _ensure_vault_hybrid_columns(conn)
        existing_rows = conn.execute(
            text(
                "SELECT id, target_user_id, program_id, module_id, batch_key, title, topic, difficulty, questions, passing_score, time_limit_mins "
                "FROM personal_vault_quizzes "
                "WHERE batch_key = :bid OR id::text = :bid"
            ),
            {"bid": batch_or_quiz_id},
        ).mappings().all()

        if not existing_rows:
            raise HTTPException(status_code=404, detail="Hybrid quiz not found.")

        sample = dict(existing_rows[0])
        batch_key = sample.get("batch_key") or batch_or_quiz_id
        new_title = (req.title or sample["title"] or "Hybrid Assessment").strip()
        new_topic = (req.topic or sample.get("topic") or new_title).strip()
        new_diff = (req.difficulty or sample.get("difficulty") or "medium").strip().lower()
        new_passing = (
            max(10, min(100, int(req.passing_score)))
            if req.passing_score is not None
            else int(sample.get("passing_score") or 70)
        )
        new_time = (
            max(1, int(req.time_limit_mins))
            if req.time_limit_mins is not None
            else int(sample.get("time_limit_mins") or 10)
        )
        new_module_id = req.module_id if req.module_id is not None else sample.get("module_id")

        if req.questions is not None:
            new_questions = _normalize_vault_questions(req.questions)
        else:
            raw_qs = sample.get("questions") or []
            new_questions = json.loads(raw_qs) if isinstance(raw_qs, str) else raw_qs

        conn.execute(
            text(
                "UPDATE personal_vault_quizzes "
                "SET batch_key = :bkey, "
                "    module_id = :mid, "
                "    title = :title, "
                "    topic = :topic, "
                "    difficulty = :diff, "
                "    passing_score = :passing, "
                "    time_limit_mins = :time_mins, "
                "    questions = CAST(:qs AS jsonb) "
                "WHERE batch_key = :bid OR id::text = :bid"
            ),
            {
                "bkey": batch_key,
                "mid": new_module_id,
                "title": new_title,
                "topic": new_topic,
                "diff": new_diff,
                "passing": new_passing,
                "time_mins": new_time,
                "qs": json.dumps(new_questions),
                "bid": batch_or_quiz_id,
            },
        )

        # Sync candidate additions / removals when target_user_ids is provided
        if req.target_user_ids is not None:
            desired_ids = {int(uid) for uid in req.target_user_ids}
            current_ids = {int(r["target_user_id"]) for r in existing_rows}

            to_remove = list(current_ids - desired_ids)
            if to_remove:
                conn.execute(
                    text(
                        "DELETE FROM personal_vault_quizzes "
                        "WHERE (batch_key = :bkey OR id::text = :bid) AND target_user_id = ANY(:uids)"
                    ),
                    {"bkey": batch_key, "bid": batch_or_quiz_id, "uids": to_remove},
                )

            to_add = list(desired_ids - current_ids)
            for uid in to_add:
                conn.execute(
                    text(
                        "INSERT INTO personal_vault_quizzes "
                        "(id, target_user_id, created_by, program_id, module_id, batch_key, title, topic, difficulty, questions, passing_score, time_limit_mins, status) "
                        "VALUES (CAST(:id AS uuid), :uid, :aid, :pid, :mid, :bkey, :title, :topic, :diff, CAST(:qs AS jsonb), :passing, :time_mins, 'assigned')"
                    ),
                    {
                        "id": str(uuid.uuid4()),
                        "uid": uid,
                        "aid": current_user_id,
                        "pid": sample.get("program_id"),
                        "mid": new_module_id,
                        "bkey": batch_key,
                        "title": new_title,
                        "topic": new_topic,
                        "diff": new_diff,
                        "qs": json.dumps(new_questions),
                        "passing": new_passing,
                        "time_mins": new_time,
                    },
                )

    return {
        "status": "updated",
        "batch_key": batch_key,
        "title": new_title,
        "question_count": len(new_questions),
    }


@router.delete("/hybrid-quizzes/{batch_or_quiz_id}")
def delete_hybrid_candidate_quiz(
    batch_or_quiz_id: str,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Removes a targeted Hybrid Quiz batch (Admin/Master Admin only)."""
    user = _resolve_user(db, current_user_id)
    if user.role_id not in (1, 2):
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin or Admin can delete hybrid quizzes.",
        )

    with engine.begin() as conn:
        _ensure_vault_hybrid_columns(conn)
        res = conn.execute(
            text(
                "DELETE FROM personal_vault_quizzes "
                "WHERE batch_key = :bid OR id::text = :bid"
            ),
            {"bid": batch_or_quiz_id},
        )
        if res.rowcount == 0:
            raise HTTPException(status_code=404, detail="Hybrid quiz not found.")

    return {"status": "deleted", "batch_key": batch_or_quiz_id}


@router.post("/assistant")
async def programs_vault_assistant(
    req: ProgramsAssistantRequest,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Tab-scoped Programs & Personal Vault AI Assistant.
    - Detects off-domain requests (Calendar, Nudges, IAM) and redirects cleanly.
    - Generates personalized quizzes (easy/medium/hard) and queues Tier-3 Final Permission cards.
    - Executes delivery strictly to target_user_id's Personal Vault upon Admin approval.
    """
    user = _resolve_user(db, current_user_id)
    role_names = {1: "Master Admin", 2: "Admin"}

    # Handle final confirmation or cancellation directly from UI consent card
    if req.confirm_action_id or req.reject_action_id:
        if user.role_id not in (1, 2):
            raise HTTPException(status_code=403, detail="Admin privileges required to confirm vault delivery.")
        gate = SafetyGate(supabase=supabase_client, db=db)
        aid = req.confirm_action_id or req.reject_action_id
        dec = "approve" if req.confirm_action_id else "reject"
        updated = gate.decide_action(
            action_id=aid,
            decision=dec,
            reviewer_id=str(current_user_id),
            reviewer_role=role_names[user.role_id],
        )
        return {
            "reply": (
                f"Approved & delivered to the student's Personal Program Vault."
                if dec == "approve"
                else "Cancelled personal quiz delivery."
            ),
            "action": updated,
            "delivered": dec == "approve" and updated.get("status") == "executed",
        }

    msg = (req.message or "").strip()
    out_of_domain = _detect_out_of_domain(msg)
    if out_of_domain:
        return {
            "out_of_scope": True,
            "redirect_to": out_of_domain["redirect_to"],
            "redirect_label": out_of_domain["redirect_label"],
            "reply": (
                f"I am scoped specifically to **Programs & Personal Quiz Vault**. "
                f"For **{out_of_domain['domain']}**, please use that dedicated workspace below."
            ),
        }

    # Check if learner is asking about their own vault quizzes
    if user.role_id not in (1, 2):
        with engine.connect() as conn:
            cnt = conn.execute(
                text("SELECT COUNT(*) FROM personal_vault_quizzes WHERE target_user_id = :uid"),
                {"uid": int(current_user_id)},
            ).scalar()
        if any(k in msg.lower() for k in ("give", "assign", "send", "create", "generate")):
            return {
                "out_of_scope": False,
                "reply": (
                    "Only Admins or Master Admins can generate and assign new quizzes to a student's Personal Vault. "
                    f"You currently have **{cnt or 0}** quiz(zes) in your Personal Program Vault below."
                ),
            }
        return {
            "out_of_scope": False,
            "reply": f"You have **{cnt or 0}** personalized quiz(zes) assigned in your Personal Program Vault below.",
        }

    # Admin generating & queuing a personal quiz
    target_student = _find_target_student(db, msg)
    if not target_student:
        return {
            "needs_consent": False,
            "reply": (
                "Which student should receive this personal quiz? Mention their name or email "
                "(e.g. *'Give a manual hard quiz on Client Trust for Anuj Jadhav 2'*)."
            ),
        }

    low = msg.lower()
    diff = (req.difficulty or "").lower().strip()
    if diff not in ("easy", "medium", "hard"):
        diff = "hard" if any(w in low for w in ("hard", "tough", "difficult", "advanced", "challenge")) else (
            "easy" if "easy" in low else "medium"
        )

    topic_match = re.search(
        r"(?:on|about|for\s+topic)\s+([a-zA-Z0-9\s\-&]{3,45}?)(?:\s+(?:for|to)\s+|$)",
        msg,
        re.IGNORECASE,
    )
    topic = topic_match.group(1).strip().title() if topic_match else "Client Relationships & Execution Mastery"
    q_count = max(3, min(8, int(req.question_count or (5 if diff == "hard" else 4))))

    kit_res = await generate_module_kit(
        module_title=topic,
        raw_notes=(
            f"Design a {diff.upper()}-level assessment on {topic} tailored personally for "
            f"{target_student.full_name} covering analytical edge cases, stakeholder accountability, and measurable KPIs."
        ),
        question_count=q_count,
        difficulty=diff,
    )
    kit = kit_res["kit"]
    quiz_title = f"{topic} ({diff.title()} Personal Challenge)"

    gate = SafetyGate(supabase=supabase_client, db=db)
    card = gate.queue_tier3_action(
        action_type="assign_personal_quiz",
        summary=(
            f"Send {diff.upper()} personal quiz '{quiz_title}' ({len(kit['questions'])} Qs) "
            f"exclusively to {target_student.full_name}'s Program Vault."
        ),
        payload={
            "target_user_id": target_student.user_id,
            "target_name": target_student.full_name,
            "target_email": target_student.email,
            "created_by": current_user_id,
            "title": quiz_title,
            "topic": topic,
            "difficulty": diff,
            "passing_score": kit.get("passing_score", 80 if diff == "hard" else 70),
            "time_limit_mins": 15 if diff == "hard" else 10,
            "questions": kit["questions"],
        },
        diff_preview={
            "before": f"{target_student.full_name} Personal Vault: No matching {diff} quiz",
            "after": f"Exclusive {diff.upper()} quiz ({len(kit['questions'])} Qs, {kit.get('passing_score', 80)}% pass) -> {target_student.full_name} (ID #{target_student.user_id})",
        },
        requested_by=str(current_user_id),
        engine_source=kit.get("engine", "deterministic_backup"),
    )

    return {
        "reply": (
            f"Generated a **{diff.upper()}** {len(kit['questions'])}-question quiz on **{topic}** "
            f"exclusively for **{target_student.full_name}** (`user_id={target_student.user_id}`).\n\n"
            "Review and grant final permission below to send it directly to their Personal Program Vault."
        ),
        "needs_consent": True,
        "action_id": card["id"],
        "queued_action": card,
        "proposal": {
            "action_id": card["id"],
            "title": quiz_title,
            "topic": topic,
            "difficulty": diff,
            "target_user_id": target_student.user_id,
            "target_name": target_student.full_name,
            "target_email": target_student.email,
            "question_count": len(kit["questions"]),
            "passing_score": kit.get("passing_score", 80 if diff == "hard" else 70),
            "sample_questions": [q["question"] for q in kit["questions"][:3]],
        },
    }

