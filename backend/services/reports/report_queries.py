from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from models import (
    User, UserProgramProgress, QuizAttempt, UserBadge, LearningStreak,
    ModuleCompletion, UserVideoProgress, Program, Module, Quiz
)

LEARNER_ROLES = [3, 4, 5, 6, 7]
FRANCHISE_ROLES = [4, 5]


def get_user_learning_report(db: Session, user_id: int,
                             period_start: Optional[date],
                             period_end: Optional[date]) -> Dict[str, Any]:
    date_filter = []
    if period_start:
        date_filter.append(UserProgramProgress.created_at >= period_start)
    if period_end:
        date_filter.append(UserProgramProgress.created_at <= period_end)

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return {}

    program_progress_query = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id == user_id
    )
    if date_filter:
        program_progress_query = program_progress_query.filter(*date_filter)

    program_progress = program_progress_query.all()
    completed_programs = [p for p in program_progress if p.completed]
    in_progress_programs = [p for p in program_progress if not p.completed]

    quiz_attempts_query = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id)
    if period_start:
        quiz_attempts_query = quiz_attempts_query.filter(QuizAttempt.attempted_at >= period_start)
    if period_end:
        quiz_attempts_query = quiz_attempts_query.filter(QuizAttempt.attempted_at <= period_end)
    quiz_attempts = quiz_attempts_query.all()

    quiz_scores = [qa.percentage for qa in quiz_attempts if qa.percentage is not None]
    avg_quiz_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0
    highest_quiz_score = max(quiz_scores) if quiz_scores else 0
    lowest_quiz_score = min(quiz_scores) if quiz_scores else 0

    badges_query = db.query(UserBadge).filter(UserBadge.user_id == user_id)
    if period_start:
        badges_query = badges_query.filter(UserBadge.earned_at >= period_start)
    if period_end:
        badges_query = badges_query.filter(UserBadge.earned_at <= period_end)
    badges = badges_query.all()

    streak = db.query(LearningStreak).filter(LearningStreak.user_id == user_id).first()

    completed_programs_details = []
    for prog in completed_programs:
        program = db.query(Program).filter(Program.id == prog.program_id).first()
        if program:
            completed_programs_details.append({
                "name": program.name,
                "completed_date": prog.completed_at.strftime("%Y-%m-%d") if prog.completed_at else "N/A",
                "score": prog.completed_percentage
            })

    return {
        "summary": {
            "completed_programs": len(completed_programs),
            "in_progress_programs": len(in_progress_programs),
            "total_curos": user.curos or 0,
            "current_streak": streak.current_streak if streak else 0
        },
        "completed_programs": completed_programs_details,
        "quiz_performance": {
            "average": round(avg_quiz_score, 2),
            "highest": round(highest_quiz_score, 2),
            "lowest": round(lowest_quiz_score, 2),
            "total_attempts": len(quiz_attempts)
        },
        "badges": [
            {
                "name": f"Badge {i+1}",
                "earned_date": b.earned_at.strftime("%Y-%m-%d") if b.earned_at else "N/A"
            }
            for i, b in enumerate(badges[:10])
        ],
        "leaderboard_position": 0
    }


def get_team_progress_report(db: Session, team_leader_id: Optional[int],
                             period_start: Optional[date],
                             period_end: Optional[date],
                             allowed_user_ids: Optional[List[int]] = None) -> Dict[str, Any]:
    """
    Team progress report.
    - team_leader_id given: that TL's direct reports + their reports.
    - team_leader_id None + allowed_user_ids given: restrict to that set.
    - Neither: all learners in the org.
    """
    if team_leader_id:
        direct = db.query(User.user_id).filter(User.Team_Leader_id == team_leader_id).all()
        direct_ids = [d[0] for d in direct]
        user_ids = list(direct_ids)
        if direct_ids:
            emps = db.query(User.user_id).filter(User.Team_Leader_id.in_(direct_ids)).all()
            user_ids.extend([e[0] for e in emps])
    elif allowed_user_ids is not None:
        user_ids = list(allowed_user_ids)
    else:
        user_ids = [u.user_id for u in db.query(User).filter(User.role_id.in_(LEARNER_ROLES)).all()]

    if not user_ids:
        return {
            "summary": {"total_employees": 0, "active_employees": 0,
                        "completion_rate": 0, "pending_employees": 0},
            "top_performers": [],
            "pending_employees": []
        }

    team_members = db.query(User).filter(User.user_id.in_(user_ids)).all()

    program_progress_query = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id.in_(user_ids)
    )
    if period_start:
        program_progress_query = program_progress_query.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        program_progress_query = program_progress_query.filter(UserProgramProgress.created_at <= period_end)
    all_progress = program_progress_query.all()

    total_employees = len(team_members)
    completed_count = len([p for p in all_progress if p.completed])
    active_employees = len(set([p.user_id for p in all_progress]))
    completion_rate = (completed_count / len(all_progress) * 100) if all_progress else 0
    pending_employees = total_employees - active_employees

    user_scores = {}
    for progress in all_progress:
        user_scores.setdefault(progress.user_id, {"programs": 0, "total_score": 0})
        user_scores[progress.user_id]["programs"] += 1
        user_scores[progress.user_id]["total_score"] += progress.completed_percentage or 0

    top_performers = []
    for uid, scores in sorted(user_scores.items(), key=lambda x: x[1]["total_score"], reverse=True)[:5]:
        user = db.query(User).filter(User.user_id == uid).first()
        if user:
            avg_score = scores["total_score"] / scores["programs"] if scores["programs"] > 0 else 0
            top_performers.append({
                "name": user.full_name,
                "programs_completed": scores["programs"],
                "avg_score": round(avg_score, 2)
            })

    pending_employees_list = []
    for member in team_members:
        member_progress = [p for p in all_progress if p.user_id == member.user_id]
        if not member_progress or not any(p.completed for p in member_progress):
            pending_employees_list.append({
                "name": member.full_name,
                "pending_programs": len([p for p in member_progress if not p.completed]),
                "last_activity": "N/A"
            })

    return {
        "summary": {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "completion_rate": round(completion_rate, 2),
            "pending_employees": pending_employees
        },
        "top_performers": top_performers,
        "pending_employees": pending_employees_list[:5]
    }


def _empty_franchise_result() -> Dict[str, Any]:
    return {
        "summary": {"total_franchises": 0, "avg_completion_rate": 0,
                    "total_employees": 0, "active_employees": 0},
        "franchise_comparison": []
    }


def _franchise_group_ids(db: Session, franchise_id: int) -> List[int]:
    ids = [franchise_id]
    emps = db.query(User.user_id).filter(
        User.Team_Leader_id == franchise_id, User.role_id == 5
    ).all()
    ids.extend([e[0] for e in emps])
    return ids


def get_franchise_performance_report(db: Session, franchise_id: Optional[int],
                                     period_start: Optional[date],
                                     period_end: Optional[date],
                                     allowed_user_ids: Optional[List[int]] = None) -> Dict[str, Any]:
    """
    Franchise performance report.
    - Admin (allowed=None): all franchises, or one if franchise_id given.
    - Non-admin (allowed=set): restrict to that set; franchise_id narrows further.
    """
    if franchise_id:
        if allowed_user_ids is not None and franchise_id not in allowed_user_ids:
            return _empty_franchise_result()
        group_ids = _franchise_group_ids(db, franchise_id)
        if allowed_user_ids is not None:
            group_ids = [i for i in group_ids if i in allowed_user_ids]
        franchise_users = db.query(User).filter(
            User.user_id.in_(group_ids),
            User.role_id.in_(FRANCHISE_ROLES)
        ).all()
    else:
        q = db.query(User).filter(User.role_id.in_(FRANCHISE_ROLES))
        if allowed_user_ids is not None:
            q = q.filter(User.user_id.in_(allowed_user_ids))
        franchise_users = q.all()

    if not franchise_users:
        return _empty_franchise_result()

    user_ids = [u.user_id for u in franchise_users]

    program_progress_query = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id.in_(user_ids)
    )
    if period_start:
        program_progress_query = program_progress_query.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        program_progress_query = program_progress_query.filter(UserProgramProgress.created_at <= period_end)
    all_progress = program_progress_query.all()

    total_franchises = len(set([u.user_id for u in franchise_users if u.role_id == 4]))
    if total_franchises == 0:
        total_franchises = len(set([u.Team_Leader_id for u in franchise_users if u.Team_Leader_id]))

    completed_count = len([p for p in all_progress if p.completed])
    avg_completion_rate = (
        sum([p.completed_percentage for p in all_progress if p.completed]) / completed_count
    ) if completed_count > 0 else 0
    total_employees = len(franchise_users)
    active_employees = len(set([p.user_id for p in all_progress]))

    franchise_comparison = []
    franchise_groups: Dict[Any, List[User]] = {}
    for user in franchise_users:
        owner = user.user_id if user.role_id == 4 else user.Team_Leader_id
        if owner is None:
            continue
        franchise_groups.setdefault(owner, []).append(user)

    for owner_id, members in franchise_groups.items():
        member_ids = [m.user_id for m in members]
        member_progress = [p for p in all_progress if p.user_id in member_ids]
        completed = len([p for p in member_progress if p.completed])
        completion = (
            sum([p.completed_percentage for p in member_progress if p.completed]) / completed
        ) if completed > 0 else 0
        owner = db.query(User).filter(User.user_id == owner_id).first()
        franchise_comparison.append({
            "name": owner.full_name if owner else f"Franchise {owner_id}",
            "completion": round(completion, 2),
            "employees": len([m for m in members if m.user_id != owner_id])
        })

    return {
        "summary": {
            "total_franchises": total_franchises,
            "avg_completion_rate": round(avg_completion_rate, 2),
            "total_employees": total_employees,
            "active_employees": active_employees
        },
        "franchise_comparison": franchise_comparison
    }


def get_franchise_learning_report(db: Session, franchise_id: Optional[int],
                                  period_start: Optional[date],
                                  period_end: Optional[date],
                                  requester_role_id: int,
                                  requester_user_id: int) -> Dict[str, Any]:
    """
    Franchise learning report — franchise-scoped learner visibility.

    - Admin (1,2): all franchises, or one if franchise_id given.
    - Franchise Developer (6): own partners + their employees (+self).
    - Franchise Partner (4): self + own employees.
    """
    def _ids_for_franchise(fp_id: int) -> List[int]:
        return _franchise_group_ids(db, fp_id)

    if requester_role_id in (1, 2):
        if franchise_id:
            user_ids = _ids_for_franchise(franchise_id)
        else:
            user_ids = [u.user_id for u in db.query(User).filter(
                User.role_id.in_([4, 5, 6])
            ).all()]
    elif requester_role_id == 4:
        user_ids = _ids_for_franchise(requester_user_id)
    elif requester_role_id == 6:
        user_ids = [requester_user_id]
        partners = db.query(User.user_id).filter(
            User.Team_Leader_id == requester_user_id, User.role_id == 4
        ).all()
        partner_ids = [p[0] for p in partners]
        user_ids.extend(partner_ids)
        if partner_ids:
            emps = db.query(User.user_id).filter(
                User.Team_Leader_id.in_(partner_ids), User.role_id == 5
            ).all()
            user_ids.extend([e[0] for e in emps])
    else:
        user_ids = [requester_user_id]

    if not user_ids:
        return _empty_franchise_result()

    progress_q = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id.in_(user_ids)
    )
    if period_start:
        progress_q = progress_q.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        progress_q = progress_q.filter(UserProgramProgress.created_at <= period_end)
    all_progress = progress_q.all()

    total_learners = len(user_ids)
    active_learners = len({p.user_id for p in all_progress})
    completed = [p for p in all_progress if p.completed]
    completion_rate = (len(completed) / len(all_progress) * 100) if all_progress else 0

    # Per-franchise breakdown (group by owner)
    all_users = db.query(User).filter(User.user_id.in_(user_ids)).all()
    groups: Dict[int, List[int]] = {}
    for u in all_users:
        owner = u.user_id if u.role_id == 4 else u.Team_Leader_id
        if owner is None:
            continue
        groups.setdefault(owner, []).append(u.user_id)

    comparison = []
    for owner_id, member_ids in groups.items():
        member_progress = [p for p in all_progress if p.user_id in member_ids]
        done = [p for p in member_progress if p.completed]
        rate = (sum(p.completed_percentage for p in done) / len(done)) if done else 0
        owner = db.query(User).filter(User.user_id == owner_id).first()
        comparison.append({
            "name": owner.full_name if owner else f"Franchise {owner_id}",
            "completion": round(rate, 2),
            "employees": len([i for i in member_ids if i != owner_id])
        })

    # Top performers
    scores: Dict[int, Dict[str, Any]] = {}
    for p in all_progress:
        scores.setdefault(p.user_id, {"programs": 0, "total": 0.0})
        scores[p.user_id]["programs"] += 1
        scores[p.user_id]["total"] += p.completed_percentage or 0

    top_performers = []
    for uid, s in sorted(scores.items(), key=lambda kv: kv[1]["total"], reverse=True)[:5]:
        u = db.query(User).filter(User.user_id == uid).first()
        if u:
            top_performers.append({
                "name": u.full_name,
                "programs_completed": s["programs"],
                "avg_score": round(s["total"] / s["programs"], 2) if s["programs"] else 0
            })

    # Pending
    pending = []
    for uid in user_ids:
        member_progress = [p for p in all_progress if p.user_id == uid]
        if not any(p.completed for p in member_progress):
            u = db.query(User).filter(User.user_id == uid).first()
            if u:
                pending.append({
                    "name": u.full_name,
                    "pending_programs": len([p for p in member_progress if not p.completed]),
                    "last_activity": "N/A"
                })

    return {
        "summary": {
            # franchise.html compatible keys
            "total_franchises": len(groups),
            "avg_completion_rate": round(completion_rate, 2),
            "total_employees": total_learners,
            "active_employees": active_learners,
            # richer keys
            "total_learners": total_learners,
            "active_learners": active_learners,
            "total_programs": db.query(Program).filter(Program.status == "Published").count(),
            "completion_rate": round(completion_rate, 2),
        },
        "franchise_comparison": comparison,
        "top_performers": top_performers,
        "pending_employees": pending[:5]
    }


def get_organization_learning_report(db: Session,
                                     period_start: Optional[date],
                                     period_end: Optional[date]) -> Dict[str, Any]:
    total_learners = db.query(User).count()

    active_query = db.query(func.count(func.distinct(UserProgramProgress.user_id)))
    if period_start:
        active_query = active_query.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        active_query = active_query.filter(UserProgramProgress.created_at <= period_end)
    active_learners = active_query.scalar() or 0

    total_programs = db.query(Program).filter(Program.status == "Published").count()

    completed_query = db.query(UserProgramProgress).filter(UserProgramProgress.completed == True)
    if period_start:
        completed_query = completed_query.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        completed_query = completed_query.filter(UserProgramProgress.created_at <= period_end)
    completed_count = completed_query.count()

    total_progress_query = db.query(UserProgramProgress)
    if period_start:
        total_progress_query = total_progress_query.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        total_progress_query = total_progress_query.filter(UserProgramProgress.created_at <= period_end)
    total_progress = total_progress_query.count()

    completion_rate = (completed_count / total_progress * 100) if total_progress > 0 else 0

    program_completion = db.query(
        Program.name,
        func.count(UserProgramProgress.id).label("enrollments"),
        func.avg(UserProgramProgress.completed_percentage).label("avg_completion")
    ).join(
        UserProgramProgress, Program.id == UserProgramProgress.program_id
    ).group_by(Program.id, Program.name).order_by(desc("avg_completion")).limit(5).all()

    top_programs = [
        {"name": prog.name, "completion": round(prog.avg_completion or 0, 2)}
        for prog in program_completion
    ]

    return {
        "summary": {
            "total_learners": total_learners,
            "active_learners": active_learners,
            "total_programs": total_programs,
            "completion_rate": round(completion_rate, 2)
        },
        "top_programs": top_programs
    }


def get_program_performance_report(db: Session, program_id: Optional[int],
                                   period_start: Optional[date],
                                   period_end: Optional[date]) -> Dict[str, Any]:
    if program_id:
        programs = db.query(Program).filter(
            Program.id == program_id, Program.status == "Published"
        ).all()
    else:
        programs = db.query(Program).filter(Program.status == "Published").all()

    program_metrics = []
    for program in programs:
        enrollments_query = db.query(UserProgramProgress).filter(
            UserProgramProgress.program_id == program.id
        )
        if period_start:
            enrollments_query = enrollments_query.filter(UserProgramProgress.created_at >= period_start)
        if period_end:
            enrollments_query = enrollments_query.filter(UserProgramProgress.created_at <= period_end)
        enrollments = enrollments_query.count()

        completions_query = db.query(UserProgramProgress).filter(
            and_(UserProgramProgress.program_id == program.id,
                 UserProgramProgress.completed == True)
        )
        if period_start:
            completions_query = completions_query.filter(UserProgramProgress.created_at >= period_start)
        if period_end:
            completions_query = completions_query.filter(UserProgramProgress.created_at <= period_end)
        completions = completions_query.count()

        quiz_scores_query = db.query(QuizAttempt).join(
            Quiz, Quiz.id == QuizAttempt.quiz_id
        ).join(
            Module, Quiz.module_id == Module.id
        ).filter(Module.program_id == program.id)
        if period_start:
            quiz_scores_query = quiz_scores_query.filter(QuizAttempt.attempted_at >= period_start)
        if period_end:
            quiz_scores_query = quiz_scores_query.filter(QuizAttempt.attempted_at <= period_end)

        quiz_attempts = quiz_scores_query.all()
        quiz_scores = [qa.percentage for qa in quiz_attempts if qa.percentage is not None]
        avg_quiz_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0
        completion_rate = (completions / enrollments * 100) if enrollments > 0 else 0

        program_metrics.append({
            "name": program.name,
            "completion": round(completion_rate, 2),
            "avg_score": round(avg_quiz_score, 2),
            "enrollments": enrollments
        })

    avg_completion_rate = sum(p["completion"] for p in program_metrics) / len(program_metrics) if program_metrics else 0
    avg_quiz_score = sum(p["avg_score"] for p in program_metrics) / len(program_metrics) if program_metrics else 0

    return {
        "summary": {
            "total_programs": len(programs),
            "avg_completion_rate": round(avg_completion_rate, 2),
            "avg_quiz_score": round(avg_quiz_score, 2)
        },
        "program_metrics": program_metrics
    }


def get_learner_engagement_report(db: Session, user_id: Optional[int],
                                  period_start: Optional[date],
                                  period_end: Optional[date],
                                  allowed_user_ids: Optional[List[int]] = None) -> Dict[str, Any]:
    # Active learners
    activity_query = db.query(func.count(func.distinct(UserProgramProgress.user_id))).join(
        User, User.user_id == UserProgramProgress.user_id
    ).filter(User.role_id.in_(LEARNER_ROLES))

    if user_id is not None:
        if allowed_user_ids is not None and user_id not in allowed_user_ids:
            activity_query = activity_query.filter(UserProgramProgress.user_id == -1)
        else:
            activity_query = activity_query.filter(UserProgramProgress.user_id == user_id)
    elif allowed_user_ids is not None:
        activity_query = activity_query.filter(UserProgramProgress.user_id.in_(allowed_user_ids))

    if period_start:
        activity_query = activity_query.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        activity_query = activity_query.filter(UserProgramProgress.created_at <= period_end)
    active_learners = activity_query.scalar() or 0

    # Average streak
    avg_streak_query = db.query(func.avg(LearningStreak.current_streak)).join(
        User, User.user_id == LearningStreak.user_id
    ).filter(User.role_id.in_(LEARNER_ROLES))

    if user_id is not None:
        avg_streak_query = avg_streak_query.filter(LearningStreak.user_id == user_id)
    elif allowed_user_ids is not None:
        avg_streak_query = avg_streak_query.filter(LearningStreak.user_id.in_(allowed_user_ids))
    avg_streak = avg_streak_query.scalar() or 0

    # Badges
    badges_query = db.query(UserBadge).join(
        User, User.user_id == UserBadge.user_id
    ).filter(User.role_id.in_(LEARNER_ROLES))

    if user_id is not None:
        badges_query = badges_query.filter(UserBadge.user_id == user_id)
    elif allowed_user_ids is not None:
        badges_query = badges_query.filter(UserBadge.user_id.in_(allowed_user_ids))
    if period_start:
        badges_query = badges_query.filter(UserBadge.earned_at >= period_start)
    if period_end:
        badges_query = badges_query.filter(UserBadge.earned_at <= period_end)
    total_badges = badges_query.count()

    return {
        "summary": {
            "avg_daily_active": active_learners,
            "avg_streak": round(avg_streak, 2),
            "total_badges_earned": total_badges
        },
        "engagement_metrics": [
            {"metric": "Daily Active Users", "value": active_learners, "change": "+0%"},
            {"metric": "Average Streak", "value": round(avg_streak, 2), "change": "+0%"},
            {"metric": "Badges Earned", "value": total_badges, "change": "+0%"}
        ]
    }