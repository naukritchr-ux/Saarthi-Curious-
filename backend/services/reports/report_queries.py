from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, date
from typing import Dict, Any, Optional
from models import (
    User, UserProgramProgress, QuizAttempt, UserBadge, LearningStreak,
    ModuleCompletion, UserVideoProgress, Program, Module
)


def get_user_learning_report(db: Session, user_id: int, period_start: Optional[date], period_end: Optional[date]) -> Dict[str, Any]:
    """
    Get comprehensive learning report for a single user.
    
    Args:
        db: Database session
        user_id: User ID
        period_start: Start date for filtering (optional)
        period_end: End date for filtering (optional)
        
    Returns:
        Dictionary with user learning metrics
    """
    # Build date filter
    date_filter = []
    if period_start:
        date_filter.append(UserProgramProgress.created_at >= period_start)
    if period_end:
        date_filter.append(UserProgramProgress.created_at <= period_end)
    
    # Get user info
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return {}
    
    # Get program progress
    program_progress_query = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id == user_id
    )
    if date_filter:
        program_progress_query = program_progress_query.filter(*date_filter)
    
    program_progress = program_progress_query.all()
    
    completed_programs = [p for p in program_progress if p.completed]
    in_progress_programs = [p for p in program_progress if not p.completed]
    
    # Get quiz attempts
    quiz_attempts_query = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id)
    if period_start:
        quiz_attempts_query = quiz_attempts_query.filter(QuizAttempt.attempted_at >= period_start)
    if period_end:
        quiz_attempts_query = quiz_attempts_query.filter(QuizAttempt.attempted_at <= period_end)
    
    quiz_attempts = quiz_attempts_query.all()
    
    # Calculate quiz performance
    quiz_scores = [qa.percentage for qa in quiz_attempts if qa.percentage is not None]
    avg_quiz_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0
    highest_quiz_score = max(quiz_scores) if quiz_scores else 0
    lowest_quiz_score = min(quiz_scores) if quiz_scores else 0
    
    # Get badges
    badges_query = db.query(UserBadge).filter(UserBadge.user_id == user_id)
    if period_start:
        badges_query = badges_query.filter(UserBadge.earned_at >= period_start)
    if period_end:
        badges_query = badges_query.filter(UserBadge.earned_at <= period_end)
    
    badges = badges_query.all()
    
    # Get learning streak
    streak = db.query(LearningStreak).filter(LearningStreak.user_id == user_id).first()
    
    # Get completed programs with details
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
        "leaderboard_position": 0  # Will be calculated separately
    }


def get_team_progress_report(db: Session, team_leader_id: Optional[int], period_start: Optional[date], period_end: Optional[date]) -> Dict[str, Any]:
    """
    Get team progress report for a team leader or comprehensive team view.

    Args:
        db: Database session
        team_leader_id: Team Leader's user ID (None for comprehensive view)
        period_start: Start date for filtering (optional)
        period_end: End date for filtering (optional)

    Returns:
        Dictionary with team learning metrics
    """
    # Get team members
    if team_leader_id:
        # Specific team leader's team
        team_members = db.query(User).filter(User.Team_Leader_id == team_leader_id).all()
    else:
        # Comprehensive view: all team members across all teams
        team_members = db.query(User).filter(User.role_id.in_([4, 5, 6])).all()

    if not team_members:
        return {
            "summary": {
                "total_employees": 0,
                "active_employees": 0,
                "completion_rate": 0,
                "pending_employees": 0
            },
            "top_performers": [],
            "pending_employees": []
        }

    user_ids = [member.user_id for member in team_members]

    # Get program progress for team
    program_progress_query = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id.in_(user_ids)
    )
    if period_start:
        program_progress_query = program_progress_query.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        program_progress_query = program_progress_query.filter(UserProgramProgress.created_at <= period_end)

    all_progress = program_progress_query.all()

    # Calculate metrics
    total_employees = len(team_members)
    completed_count = len([p for p in all_progress if p.completed])
    active_employees = len(set([p.user_id for p in all_progress]))
    completion_rate = (completed_count / len(all_progress) * 100) if all_progress else 0
    pending_employees = total_employees - active_employees

    # Get top performers
    user_scores = {}
    for progress in all_progress:
        if progress.user_id not in user_scores:
            user_scores[progress.user_id] = {"programs": 0, "total_score": 0}
        user_scores[progress.user_id]["programs"] += 1
        user_scores[progress.user_id]["total_score"] += progress.completed_percentage

    top_performers = []
    for user_id, scores in sorted(user_scores.items(), key=lambda x: x[1]["total_score"], reverse=True)[:5]:
        user = db.query(User).filter(User.user_id == user_id).first()
        if user:
            avg_score = scores["total_score"] / scores["programs"] if scores["programs"] > 0 else 0
            top_performers.append({
                "name": user.full_name,
                "programs_completed": scores["programs"],
                "avg_score": round(avg_score, 2)
            })

    # Get pending employees
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


def get_franchise_performance_report(db: Session, franchise_id: Optional[int], period_start: Optional[date], period_end: Optional[date]) -> Dict[str, Any]:
    """
    Get franchise performance report for individual franchise or comprehensive view.

    Args:
        db: Database session
        franchise_id: Franchise ID using team_leader_id as proxy (None for comprehensive view)
        period_start: Start date for filtering (optional)
        period_end: End date for filtering (optional)

    Returns:
        Dictionary with franchise metrics
    """
    # Get franchise users (roles 4 and 6)
    if franchise_id:
        # Specific franchise
        franchise_users = db.query(User).filter(
            User.Team_Leader_id == franchise_id,
            User.role_id.in_([4, 5])
        ).all()
    else:
        # Comprehensive view: all franchise users
        franchise_users = db.query(User).filter(User.role_id.in_([4, 5, 6])).all()

    if not franchise_users:
        return {
            "summary": {
                "total_franchises": 0,
                "avg_completion_rate": 0,
                "total_employees": 0,
                "active_employees": 0
            },
            "franchise_comparison": []
        }

    user_ids = [user.user_id for user in franchise_users]

    # Get program progress
    program_progress_query = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id.in_(user_ids)
    )
    if period_start:
        program_progress_query = program_progress_query.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        program_progress_query = program_progress_query.filter(UserProgramProgress.created_at <= period_end)

    all_progress = program_progress_query.all()

    # Calculate metrics
    total_franchises = len(set([u.Team_Leader_id for u in franchise_users if u.Team_Leader_id]))
    completed_count = len([p for p in all_progress if p.completed])
    avg_completion_rate = (sum([p.completed_percentage for p in all_progress if p.completed]) / completed_count) if completed_count > 0 else 0
    total_employees = len(franchise_users)
    active_employees = len(set([p.user_id for p in all_progress]))

    # Build franchise comparison
    franchise_comparison = []
    franchise_groups = {}
    for user in franchise_users:
        if user.Team_Leader_id not in franchise_groups:
            franchise_groups[user.Team_Leader_id] = []
        franchise_groups[user.Team_Leader_id].append(user)

    for team_leader_id, members in franchise_groups.items():
        member_ids = [m.user_id for m in members]
        member_progress = [p for p in all_progress if p.user_id in member_ids]
        completed = len([p for p in member_progress if p.completed])
        completion = (sum([p.completed_percentage for p in member_progress if p.completed]) / completed) if completed > 0 else 0

        team_leader = db.query(User).filter(User.user_id == team_leader_id).first()
        franchise_comparison.append({
            "name": team_leader.full_name if team_leader else f"Franchise {team_leader_id}",
            "completion": round(completion, 2),
            "employees": len(members)
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


def get_organization_learning_report(db: Session, period_start: Optional[date], period_end: Optional[date]) -> Dict[str, Any]:
    """
    Get organization-wide learning report.
    
    Args:
        db: Database session
        period_start: Start date for filtering (optional)
        period_end: End date for filtering (optional)
        
    Returns:
        Dictionary with organization metrics
    """
    # Get total learners
    total_learners = db.query(User).count()
    
    # Get active learners (those with program progress in period)
    active_query = db.query(func.count(func.distinct(UserProgramProgress.user_id)))
    if period_start:
        active_query = active_query.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        active_query = active_query.filter(UserProgramProgress.created_at <= period_end)
    active_learners = active_query.scalar() or 0
    
    # Get total programs
    total_programs = db.query(Program).filter(Program.status == "Published").count()
    
    # Get completion rate
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
    
    # Get top programs
    program_completion = db.query(
        Program.name,
        func.count(UserProgramProgress.id).label("enrollments"),
        func.avg(UserProgramProgress.completed_percentage).label("avg_completion")
    ).join(
        UserProgramProgress, Program.id == UserProgramProgress.program_id
    ).group_by(Program.id, Program.name).order_by(desc("avg_completion")).limit(5).all()
    
    top_programs = [
        {
            "name": prog.name,
            "completion": round(prog.avg_completion or 0, 2)
        }
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


def get_program_performance_report(db: Session, program_id: Optional[int], period_start: Optional[date], period_end: Optional[date]) -> Dict[str, Any]:
    """
    Get program performance report for individual program or comprehensive view.

    Args:
        db: Database session
        program_id: Program ID (None for comprehensive view of all programs)
        period_start: Start date for filtering (optional)
        period_end: End date for filtering (optional)

    Returns:
        Dictionary with program metrics
    """
    # Get programs
    if program_id:
        # Individual program
        programs = db.query(Program).filter(
            Program.id == program_id,
            Program.status == "Published"
        ).all()
    else:
        # Comprehensive view: all published programs
        programs = db.query(Program).filter(Program.status == "Published").all()

    program_metrics = []
    for program in programs:
        # Get enrollments
        enrollments_query = db.query(UserProgramProgress).filter(
            UserProgramProgress.program_id == program.id
        )
        if period_start:
            enrollments_query = enrollments_query.filter(UserProgramProgress.created_at >= period_start)
        if period_end:
            enrollments_query = enrollments_query.filter(UserProgramProgress.created_at <= period_end)
        enrollments = enrollments_query.count()

        # Get completions
        completions_query = db.query(UserProgramProgress).filter(
            and_(
                UserProgramProgress.program_id == program.id,
                UserProgramProgress.completed == True
            )
        )
        if period_start:
            completions_query = completions_query.filter(UserProgramProgress.created_at >= period_start)
        if period_end:
            completions_query = completions_query.filter(UserProgramProgress.created_at <= period_end)
        completions = completions_query.count()

        # Get average quiz scores for this program
        quiz_scores_query = db.query(QuizAttempt).join(
            Quiz, Quiz.id == QuizAttempt.quiz_id
        ).join(
            Module, Quiz.module_id == Module.id
        ).filter(
            Module.program_id == program.id
        )
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

    # Calculate overall averages
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


def get_learner_engagement_report(db: Session, user_id: Optional[int], period_start: Optional[date], period_end: Optional[date]) -> Dict[str, Any]:
    """
    Get learner engagement report for individual learner or comprehensive view.

    Args:
        db: Database session
        user_id: User ID (None for comprehensive view of all learners)
        period_start: Start date for filtering (optional)
        period_end: End date for filtering (optional)

    Returns:
        Dictionary with engagement metrics
    """
    # Get active learners (those with activity in period)
    if user_id:
        # Individual learner
        activity_query = db.query(func.count(func.distinct(UserProgramProgress.user_id))).filter(
            UserProgramProgress.user_id == user_id
        )
    else:
        # Comprehensive view: all learners (roles 3,4,5,6,7)
        activity_query = db.query(func.count(func.distinct(UserProgramProgress.user_id))).join(
            User, User.user_id == UserProgramProgress.user_id
        ).filter(User.role_id.in_([3, 4, 5, 6, 7]))

    if period_start:
        activity_query = activity_query.filter(UserProgramProgress.created_at >= period_start)
    if period_end:
        activity_query = activity_query.filter(UserProgramProgress.created_at <= period_end)
    active_learners = activity_query.scalar() or 0

    # Get average streak
    if user_id:
        avg_streak_query = db.query(func.avg(LearningStreak.current_streak)).filter(
            LearningStreak.user_id == user_id
        )
    else:
        avg_streak_query = db.query(func.avg(LearningStreak.current_streak)).join(
            User, User.user_id == LearningStreak.user_id
        ).filter(User.role_id.in_([3, 4, 5, 6, 7]))
    avg_streak = avg_streak_query.scalar() or 0

    # Get total badges earned
    if user_id:
        badges_query = db.query(UserBadge).filter(UserBadge.user_id == user_id)
    else:
        badges_query = db.query(UserBadge).join(User, User.user_id == UserBadge.user_id).filter(
            User.role_id.in_([3, 4, 5, 6, 7])
        )

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
            {
                "metric": "Daily Active Users",
                "value": active_learners,
                "change": "+0%"
            },
            {
                "metric": "Average Streak",
                "value": round(avg_streak, 2),
                "change": "+0%"
            },
            {
                "metric": "Badges Earned",
                "value": total_badges,
                "change": "+0%"
            }
        ]
    }
