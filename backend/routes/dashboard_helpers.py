# dashboard_helpers.py - Reusable helper functions
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, case
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from decimal import Decimal
from collections import defaultdict

from models import (
    User, Role, Program, Module, Video, 
    LearningStreak, UserProgramProgress, 
    VideoCompletion, QuizAttempt, Quiz,
    Badge, UserBadge, PendingAction, AuditLog
)

# ============================================
# USER STATISTICS HELPERS
# ============================================

def get_total_users(db: Session) -> int:
    """Get total number of users"""
    return db.query(func.count(User.user_id)).scalar() or 0

def get_active_users(db: Session, days: int = 30) -> int:
    """Get users active within last X days"""
    cutoff_date = datetime.now().date() - timedelta(days=days)
    return db.query(func.count(User.user_id)).filter(
        User.is_active == True,
        User.role_id != 1,
        User.role_id != 2
    ).scalar() or 0

def get_new_users(db: Session, days: int = 30) -> int:
    """Get users who joined within last X days"""
    cutoff_date = datetime.now().date() - timedelta(days=days)
    return db.query(func.count(User.user_id)).filter(
        User.date_of_joining >= cutoff_date
    ).scalar() or 0

def get_users_by_role(db: Session, role_id: int) -> int:
    """Get count of users with specific role"""
    return db.query(func.count(User.user_id)).filter(User.role_id == role_id).scalar() or 0

def get_user_role_distribution(db: Session) -> List[Dict]:
    """Get distribution of users across all roles"""
    results = db.query(
        User.role_id,
        Role.role_name,
        func.count(User.user_id).label('count')
    ).join(Role, User.role_id == Role.id, isouter=True)\
     .group_by(User.role_id, Role.role_name).all()
    
    return [
        {
            "role_id": role_id,
            "role_name": role_name or f"Role {role_id}",
            "count": count
        }
        for role_id, role_name, count in results
    ]

# ============================================
# TODAY'S STATISTICS HELPERS (ADMIN)
# ============================================

def get_programs_completed_today(db: Session, user_ids: Optional[List[int]] = None) -> int:
    """
    Get number of programs completed today.
    If user_ids is provided, filter for specific users.
    """
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    query = db.query(func.count(UserProgramProgress.id)).filter(
        UserProgramProgress.completed == True,
        UserProgramProgress.completed_at >= today_start,
        UserProgramProgress.completed_at <= today_end
    )
    
    if user_ids:
        query = query.filter(UserProgramProgress.user_id.in_(user_ids))
    
    return query.scalar() or 0

def get_curos_earned_today(db: Session, user_ids: Optional[List[int]] = None) -> int:
    """
    Get total curos earned today from audit logs.
    If user_ids is provided, filter for specific users.
    """
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    query = db.query(AuditLog).filter(
        AuditLog.created_at >= today_start,
        AuditLog.action.ilike("%curo%")
    )
    
    if user_ids:
        query = query.filter(AuditLog.actor_id.in_(user_ids))
    
    logs = query.all()
    total_curos = 0
    
    for log in logs:
        metadata = log.log_metadata or {}
        if isinstance(metadata, dict):
            amount = 0
            raw_amount = metadata.get("amount") or metadata.get("curos") or metadata.get("value")
            if isinstance(raw_amount, (int, float, Decimal)):
                amount = int(raw_amount)
            elif isinstance(raw_amount, str):
                numeric = "".join(ch for ch in raw_amount if ch.isdigit())
                amount = int(numeric) if numeric else 0
            total_curos += amount
    
    return total_curos

def get_badges_earned_today(db: Session, user_ids: Optional[List[int]] = None) -> int:
    """
    Get number of badges earned today.
    If user_ids is provided, filter for specific users.
    """
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    query = db.query(func.count(UserBadge.user_badge_id)).filter(
        UserBadge.earned_at >= today_start,
        UserBadge.earned_at <= today_end
    )
    
    if user_ids:
        query = query.filter(UserBadge.user_id.in_(user_ids))
    
    return query.scalar() or 0

# ============================================
# CUROS STATISTICS HELPERS
# ============================================

def get_total_curos(db: Session) -> int:
    """Get total curos awarded across all users"""
    return db.query(func.sum(User.curos)).scalar() or 0

def get_curo_overview(db: Session) -> Dict[str, int]:
    """Get compact curo overview with key metrics"""
    total_curos = get_total_curos(db)
    average_curos = get_average_curos_per_user(db)
    top_earner = get_top_curos_earner(db)
    
    return {
        "total_curos": total_curos,
        "average_curos": round(average_curos),
        "highest_curos": top_earner["curos"] if top_earner else 0,
        "highest_curos_holder": top_earner["name"] if top_earner else "N/A"
    }

def get_top_curos_earner(db: Session) -> Optional[Dict]:
    """Get the user with the most curos"""
    top = db.query(
        User.user_id,
        User.full_name,
        User.curos
    ).filter(User.curos > 0).order_by(desc(User.curos)).first()
    
    if top:
        return {
            "user_id": top.user_id,
            "name": top.full_name,
            "curos": top.curos
        }
    return None

def get_average_curos_per_user(db: Session) -> float:
    """Get average curos per user (excluding zero)"""
    avg = db.query(func.avg(User.curos)).filter(User.curos > 0).scalar()
    return float(avg) if avg else 0.0

# ============================================
# LEARNING STREAK HELPERS
# ============================================

def get_average_streak(db: Session) -> float:
    """Get average current streak across all users"""
    avg = db.query(func.avg(LearningStreak.current_streak)).scalar()
    return float(avg) if avg else 0.0

def get_total_learning_days(db: Session) -> int:
    """Get total learning days across all users"""
    total = db.query(func.sum(LearningStreak.total_learning_days)).scalar()
    return total or 0

def get_active_today(db: Session) -> int:
    """Get users active today (based on last_activity_date)"""
    today = datetime.now().date()
    return db.query(func.count(LearningStreak.user_id)).filter(
        LearningStreak.last_activity_date == today
    ).scalar() or 0

# ============================================
# PROGRAM STATISTICS HELPERS
# ============================================

def get_total_programs(db: Session, status: Optional[str] = "Published") -> int:
    """Get total number of programs"""
    query = db.query(func.count(Program.id))
    if status:
        query = query.filter(Program.status == status)
    return query.scalar() or 0

def get_program_completion_stats(db: Session) -> Dict[str, int]:
    """Get program completion statistics"""
    stats = db.query(
        func.sum(case((UserProgramProgress.completed == True, 1), else_=0)).label('completed'),
        func.sum(case((UserProgramProgress.status == "In Progress", 1), else_=0)).label('in_progress'),
        func.sum(case((UserProgramProgress.status == "Not Started", 1), else_=0)).label('not_started')
    ).first()
    
    completed = int(stats.completed or 0) if stats else 0
    in_progress = int(stats.in_progress or 0) if stats else 0
    not_started = int(stats.not_started or 0) if stats else 0
    
    return {
        "completed": completed,
        "in_progress": in_progress,
        "not_started": not_started,
        "total": completed + in_progress + not_started
    }

def get_top_programs(db: Session, limit: int = 5) -> List[Dict]:
    """Get top programs by enrollment count"""
    results = db.query(
        Program.id,
        Program.name,
        func.count(UserProgramProgress.id).label('enrollments'),
        func.sum(case((UserProgramProgress.completed == True, 1), else_=0)).label('completions')
    ).join(UserProgramProgress, Program.id == UserProgramProgress.program_id, isouter=True)\
     .group_by(Program.id, Program.name)\
     .order_by(desc('enrollments'))\
     .limit(limit).all()
    
    return [
        {
            "program_id": pid,
            "program_name": name,
            "enrollments": enrollments or 0,
            "completions": completions or 0
        }
        for pid, name, enrollments, completions in results
    ]

# ============================================
# BADGE STATISTICS HELPERS
# ============================================

def get_total_badges_earned(db: Session) -> int:
    """Get total number of badges earned by all users"""
    return db.query(func.count(UserBadge.user_badge_id)).scalar() or 0

def get_most_earned_badge(db: Session) -> Optional[Dict]:
    """Get the most frequently earned badge"""
    result = db.query(
        Badge.badge_id,
        Badge.badge_name,
        Badge.tier,
        func.count(UserBadge.badge_id).label('count')
    ).join(UserBadge, Badge.badge_id == UserBadge.badge_id)\
     .group_by(Badge.badge_id, Badge.badge_name, Badge.tier)\
     .order_by(desc('count')).first()
    
    if result:
        return {
            "badge_id": result.badge_id,
            "badge_name": result.badge_name,
            "tier": result.tier,
            "count": result.count
        }
    return None

def get_user_badge_summary(db: Session) -> Dict[str, int]:
    """Get badge summary by tier"""
    results = db.query(
        Badge.tier,
        func.count(UserBadge.badge_id).label('count')
    ).join(UserBadge, Badge.badge_id == UserBadge.badge_id)\
     .group_by(Badge.tier).all()
    
    return {tier: count for tier, count in results}

# ============================================
# RECENT ACTIVITY HELPERS
# ============================================

def get_audit_logs(db: Session, limit: int = 20) -> List[Dict]:
    """Get recent audit logs for admin dashboard"""
    audit_logs = db.query(AuditLog).order_by(
        AuditLog.created_at.desc()
    ).limit(limit).all()
    
    return [
        {
            "user": log.actor_name or "System",
            "action": log.message or log.action,
            "timestamp": log.created_at,
            "type": "audit",
            "entity_type": log.entity_type,
            "action_type": log.action,
            "metadata": log.log_metadata
        }
        for log in audit_logs
    ]

def get_recent_activity(db: Session, limit: int = 10) -> List[Dict]:
    """Get combined recent activity from multiple sources"""
    activities = []
    
    # Quiz attempts
    quiz_activities = get_recent_quiz_activity(db, limit=5)
    activities.extend(quiz_activities)
    
    # Video completions
    video_activities = db.query(
        VideoCompletion,
        User.full_name,
        Video.title
    ).join(User, VideoCompletion.user_id == User.user_id)\
     .join(Video, VideoCompletion.video_id == Video.id)\
     .filter(VideoCompletion.is_completed == True)\
     .order_by(desc(VideoCompletion.completed_at))\
     .limit(5).all()
    
    for completion, user_name, video_title in video_activities:
        activities.append({
            "user": user_name,
            "action": f"Watched video: {video_title}",
            "timestamp": completion.completed_at,
            "type": "video"
        })
    
    # Sort by timestamp and limit
    activities.sort(
        key=lambda x: x.get("timestamp") or datetime.min,
        reverse=True
    )
    
    return activities[:limit]

def get_recent_quiz_activity(db: Session, limit: int = 5) -> List[Dict]:
    """Get recent quiz activity"""
    quiz_attempts = db.query(
        QuizAttempt,
        User.full_name,
        Quiz.title
    ).join(User, QuizAttempt.user_id == User.user_id)\
     .join(Quiz, QuizAttempt.quiz_id == Quiz.id, isouter=True)\
     .order_by(desc(QuizAttempt.attempted_at))\
     .limit(limit).all()
    
    return [
        {
            "user": full_name,
            "action": f"Completed quiz: {quiz_title or 'Assessment'}",
            "timestamp": attempt.attempted_at,
            "type": "quiz",
            "score": int(attempt.percentage or 0)
        }
        for attempt, full_name, quiz_title in quiz_attempts
    ]

def get_pending_actions(db: Session) -> Dict[str, int]:
    """Get pending actions count from pending_actions table"""
    results = db.query(
        PendingAction.action_type,
        func.count(PendingAction.id).label('count')
    ).filter(
        PendingAction.status == 'pending'
    ).group_by(PendingAction.action_type).all()
    
    counts = {action_type: count for action_type, count in results}
    
    user_approvals = counts.get('user_approval', 0)
    program_approvals = counts.get('program_approval', 0)
    badge_requests = counts.get('badge_request', 0)
    franchise_requests = counts.get('franchise_request', 0)
    
    total_pending = user_approvals + program_approvals + badge_requests + franchise_requests
    
    return {
        "user_approvals": user_approvals,
        "program_approvals": program_approvals,
        "badge_requests": badge_requests,
        "franchise_requests": franchise_requests,
        "total_pending": total_pending
    }

def get_top_team_leaders(db: Session, limit: int = 5) -> List[Dict]:
    """Get top team leaders based on team engagement and progress"""
    # Get all team leaders (role_id = 3)
    team_leaders = db.query(User).filter(User.role_id == 3).all()
    if not team_leaders:
        return []

    leader_ids = [leader.user_id for leader in team_leaders]

    # Fetch all team members for all leaders in a single query
    all_team_members = db.query(User).filter(
        User.Team_Leader_id.in_(leader_ids)
    ).all()

    if not all_team_members:
        return []

    # Group team members by leader_id
    members_by_leader = defaultdict(list)
    all_member_ids = []
    for m in all_team_members:
        members_by_leader[m.Team_Leader_id].append(m)
        all_member_ids.append(m.user_id)

    # Batch fetch program progress and learning streaks for all members
    all_progress = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id.in_(all_member_ids)
    ).all()

    progress_by_user = defaultdict(list)
    for p in all_progress:
        progress_by_user[p.user_id].append(p)

    all_streaks = db.query(LearningStreak).filter(
        LearningStreak.user_id.in_(all_member_ids)
    ).all()

    streaks_by_user = {s.user_id: s.current_streak for s in all_streaks}

    leader_stats = []
    for leader in team_leaders:
        team_members = members_by_leader.get(leader.user_id, [])
        if not team_members:
            continue
        
        total_members = len(team_members)
        active_members = sum(1 for m in team_members if m.is_active)
        
        completed_programs = 0
        total_enrollments = 0
        team_streaks_list = []

        for m in team_members:
            m_prog = progress_by_user.get(m.user_id, [])
            total_enrollments += len(m_prog)
            completed_programs += sum(1 for p in m_prog if p.completed)
            if m.user_id in streaks_by_user:
                team_streaks_list.append(streaks_by_user[m.user_id])
        
        avg_streak = sum(team_streaks_list) / len(team_streaks_list) if team_streaks_list else 0
        
        engagement_score = (active_members / total_members * 0.4) + \
                           (completed_programs / total_enrollments * 0.3 if total_enrollments > 0 else 0) + \
                           (avg_streak / 30 * 0.3)
        
        leader_stats.append({
            "leader_id": leader.user_id,
            "leader_name": leader.full_name,
            "team_size": total_members,
            "active_members": active_members,
            "completed_programs": completed_programs,
            "total_enrollments": total_enrollments,
            "average_streak": round(avg_streak, 2),
            "engagement_score": round(engagement_score, 2)
        })
    
    leader_stats.sort(key=lambda x: x['engagement_score'], reverse=True)
    return leader_stats[:limit]

# ============================================
# COMBINED HELPER FUNCTIONS
# ============================================

def get_admin_dashboard_data(db: Session) -> Dict[str, Any]:
    """
    Get all data needed for admin dashboard in one call
    Uses all the helper functions above
    """
    today = datetime.now().date()
    thirty_days_ago = today - timedelta(days=30)
    seven_days_ago = today - timedelta(days=6)
    
    role_mapping = {
        5: "Franchise Employee",
        4: "Franchise Partner",
        3: "Team Leader",
        6: "Franchise Developer",
        7: "Head Office Staff",
        2: "Admin",
        1: "Master Admin"
    }
    
    role_dist = get_user_role_distribution(db)
    role_counts = {item['role_id']: item['count'] for item in role_dist}
    
    enhanced_distribution = []
    for item in role_dist:
        display_name = role_mapping.get(item['role_id'], item['role_name'])
        enhanced_distribution.append({
            **item,
            "display_name": display_name
        })
    
    top_earner = get_top_curos_earner(db)
    
    # Generate learning activity data for the last 7 days (organization-wide)
    all_user_ids = [user.user_id for user in db.query(User.user_id).filter(User.role_id != 1, User.role_id != 2).all()]
    
    learning_activity = []
    quiz_attempts_all = db.query(QuizAttempt).filter(QuizAttempt.user_id.in_(all_user_ids)).all()
    video_completions_all = db.query(VideoCompletion).filter(
        VideoCompletion.user_id.in_(all_user_ids),
        VideoCompletion.is_completed == True
    ).all()
    program_progress_all = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id.in_(all_user_ids)
    ).all()
    all_users = db.query(User).filter(User.user_id.in_(all_user_ids)).all()
    
    for day_offset in range(6, -1, -1):
        date_value = today - timedelta(days=day_offset)
        
        day_quizzes = sum(
            1 for quiz in quiz_attempts_all
            if quiz.attempted_at and quiz.attempted_at.date() == date_value
        )
        day_videos = sum(
            1 for video in video_completions_all
            if video.completed_at and video.completed_at.date() == date_value
        )
        day_completions = sum(
            1 for progress in program_progress_all
            if progress.completed and progress.completed_at and progress.completed_at.date() == date_value
        )
        day_logins = sum(
            1 for user in all_users
            if user.last_login and user.last_login.date() == date_value
        )
        
        learning_activity.append({
            "day": date_value.strftime("%b %d").replace(" 0", " "),
            "logins": day_logins,
            "videos": day_videos,
            "quizzes": day_quizzes,
            "retention": day_completions,
            "application": 0
        })
    
    return {
        "stat_cards": {
            "total_users": {
                "value": get_total_users(db),
                "change": "18.6%",
                "subtitle": "vs last month",
                "icon": "Users"
            },
            "active_learners": {
                "value": get_active_users(db, 30),
                "change": "12.4%",
                "subtitle": "Currently Active",
                "icon": "Users"
            },
            "programs": {
                "value": get_total_programs(db, "Published"),
                "change": "Master • L&D • Team",
                "subtitle": "",
                "icon": "ShieldCheck"
            },
            "total_curos_in_circulation": {
                "value": get_total_curos(db),
                "change": "All time",
                "subtitle": "Total awarded",
                "icon": "Coins"
            },
            # NEW: Today's stats for admin
            "programs_completed_today": {
                "value": get_programs_completed_today(db),
                "change": "Today",
                "subtitle": "Programs completed",
                "icon": "BookOpen"
            },
            "curos_earned_today": {
                "value": get_curos_earned_today(db),
                "change": "Today",
                "subtitle": "Curos awarded",
                "icon": "Coins"
            },
            "badges_earned_today": {
                "value": get_badges_earned_today(db),
                "change": "Today",
                "subtitle": "Badges unlocked",
                "icon": "ShieldCheck"
            }
        },
        "user_distribution": {
            "by_role": enhanced_distribution,
            "summary": {
                "franchise_employees": role_counts.get(5, 0),
                "franchise_partners": role_counts.get(4, 0),
                "team_leaders": role_counts.get(3, 0),
                "franchise_developers": role_counts.get(6, 0),
                "head_office_staff": role_counts.get(7, 0),
                "admins": role_counts.get(1, 0) + role_counts.get(2, 0)
            }
        },
        "curos_analytics": {
            "total_curos_earned": get_total_curos(db),
            "top_earner": top_earner,
            "average_curos_per_user": get_average_curos_per_user(db),
            "total_learning_days": get_total_learning_days(db),
            "average_streak": get_average_streak(db),
            "active_today": get_active_today(db)
        },
        "program_completion": get_program_completion_stats(db),
        "badge_stats": {
            "total_badges_earned": get_total_badges_earned(db),
            "most_earned_badge": get_most_earned_badge(db),
            "by_tier": get_user_badge_summary(db)
        },
        "trends": {
            "new_users_this_month": get_new_users(db, 30),
            "new_users_this_week": get_new_users(db, 7),
            "active_this_week": get_active_users(db, 7)
        },
        "recent_activity": get_audit_logs(db, 20),
        "pending_actions": get_pending_actions(db),
        "top_programs": get_top_programs(db, 5),
        "top_team_leaders": get_top_team_leaders(db, 5),
        "curo_overview": get_curo_overview(db),
        "learning_activity": learning_activity
    }

def get_team_leader_dashboard_data(db: Session, team_leader_user_id: int) -> Dict[str, Any]:
    """
    Build Team Leader dashboard payload using helper-level reusable data access.
    """
    team_leader = db.query(User).filter(User.user_id == team_leader_user_id).first()
    if not team_leader:
        raise HTTPException(status_code=404, detail="Team Leader not found")

    if team_leader.role_id not in [3, 6]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Team Leader or Franchise Developer privileges required."
        )

    team_members = db.query(User).filter(User.Team_Leader_id == team_leader_user_id).all()
    team_member_ids = [member.user_id for member in team_members]

    today = datetime.now().date()
    seven_days_ago = today - timedelta(days=6)

    if not team_member_ids:
        return {
            "stat_cards": {
                "total_team_members": {"value": 0, "change": "+0 active", "subtitle": "In your team"},
                "total_franchises": {"value": 0, "change": "0 active", "subtitle": "Managed"},
                "franchise_employees": {"value": 0, "change": "Active", "subtitle": "Under supervision"},
                "team_curos": {"value": 0, "change": "Total earned", "subtitle": "By team"},
                "programs_completed_today": {"value": 0, "change": "Today", "subtitle": "Programs done"},
                "curos_earned_today": {"value": 0, "change": "Today", "subtitle": "Curos awarded"},
                "badges_earned_today": {"value": 0, "change": "Today", "subtitle": "Badges unlocked"}
            },
            "franchise_distribution": [],
            "team_analytics": {
                "learning_activity": [],
                "engagement_score": 0,
                "leaderboard": []
            },
            "recent_activity": [],
            "team_members": [],
            "franchises": []
        }

    active_members = sum(1 for member in team_members if member.is_active)
    team_curos = int(sum((member.curos or 0) for member in team_members))

    franchise_partners = [member for member in team_members if member.role_id == 4]

    franchise_distribution = []
    for fp in franchise_partners:
        employee_count = sum(
            1
            for member in team_members
            if member.role_id == 5 and member.reporting_manager == fp.full_name
        )

        franchise_distribution.append({
            "name": fp.full_name,
            "value": employee_count
        })

    franchise_distribution.sort(key=lambda x: x["value"], reverse=True)

    program_rows = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id.in_(team_member_ids)
    ).all()

    progress_by_user = defaultdict(list)
    completion_by_user = {}
    for row in program_rows:
        progress_by_user[row.user_id].append(row)
        if row.completed:
            completion_by_user[row.user_id] = completion_by_user.get(row.user_id, 0) + 1

    # Use the helper functions for today's stats
    programs_completed_today = get_programs_completed_today(db, team_member_ids)
    curos_earned_today = get_curos_earned_today(db, team_member_ids)
    badges_earned_today = get_badges_earned_today(db, team_member_ids)

    learning_activity = []
    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id.in_(team_member_ids)).all()
    video_completions = db.query(VideoCompletion).filter(
        VideoCompletion.user_id.in_(team_member_ids),
        VideoCompletion.is_completed == True
    ).all()

    for day_offset in range(6, -1, -1):
        date_value = today - timedelta(days=day_offset)

        day_quizzes = sum(
            1 for quiz in quiz_attempts
            if quiz.attempted_at and quiz.attempted_at.date() == date_value
        )
        day_videos = sum(
            1 for video in video_completions
            if video.completed_at and video.completed_at.date() == date_value
        )
        day_completions = sum(
            1 for progress in program_rows
            if progress.completed and progress.completed_at and progress.completed_at.date() == date_value
        )

        day_logins = sum(
            1 for member in team_members
            if member.last_login and member.last_login.date() == date_value
        )

        learning_activity.append({
            "day": date_value.strftime("%b %d").replace(" 0", " ") if hasattr(date_value, "strftime") else str(date_value),
            "logins": day_logins,
            "videos": day_videos,
            "quizzes": day_quizzes,
            "retention": day_completions,
            "application": 0
        })

    leaderboard = [
        {
            "name": member.full_name,
            "points": int(member.curos or 0)
        }
        for member in sorted(team_members, key=lambda item: item.curos or 0, reverse=True)[:5]
    ]

    recent_activity = []

    recent_completions = db.query(
        UserProgramProgress,
        User.full_name,
        Program.name
    ).join(User, UserProgramProgress.user_id == User.user_id)\
     .join(Program, UserProgramProgress.program_id == Program.id, isouter=True)\
     .filter(
        UserProgramProgress.user_id.in_(team_member_ids),
        UserProgramProgress.completed == True,
        UserProgramProgress.completed_at.isnot(None)
     )\
     .order_by(desc(UserProgramProgress.completed_at))\
     .limit(4).all()

    for progress, full_name, program_name in recent_completions:
        recent_activity.append({
            "type": "completion",
            "title": f"Program: {program_name or 'Program'}",
            "description": f"{full_name} completed",
            "timestamp": progress.completed_at.strftime("%Y-%m-%d %H:%M") if progress.completed_at else ""
        })

    recent_quiz_attempts = db.query(
        QuizAttempt,
        User.full_name,
        Quiz.title
    ).join(User, QuizAttempt.user_id == User.user_id)\
     .join(Quiz, QuizAttempt.quiz_id == Quiz.id, isouter=True)\
     .filter(QuizAttempt.user_id.in_(team_member_ids))\
     .order_by(desc(QuizAttempt.attempted_at))\
     .limit(4).all()

    for attempt, full_name, quiz_title in recent_quiz_attempts:
        recent_activity.append({
            "type": "quiz",
            "title": f"Quiz: {quiz_title or 'Assessment'}",
            "description": f"{full_name} scored {int(attempt.percentage or 0)}%",
            "timestamp": attempt.attempted_at.strftime("%Y-%m-%d %H:%M") if attempt.attempted_at else ""
        })

    recent_badges = db.query(
        UserBadge,
        User.full_name,
        Badge.badge_name
    ).join(User, UserBadge.user_id == User.user_id)\
     .join(Badge, UserBadge.badge_id == Badge.badge_id, isouter=True)\
     .filter(UserBadge.user_id.in_(team_member_ids))\
     .order_by(desc(UserBadge.earned_at))\
     .limit(3).all()

    for user_badge, full_name, badge_name in recent_badges:
        recent_activity.append({
            "type": "curo",
            "title": f"Badge Unlocked: {badge_name or 'Achievement'}",
            "description": f"{full_name} earned a new badge",
            "timestamp": user_badge.earned_at.strftime("%Y-%m-%d %H:%M") if user_badge.earned_at else ""
        })

    recent_activity.sort(key=lambda item: item.get("timestamp") or "", reverse=True)
    recent_activity = recent_activity[:10]

    team_member_rows = [
        {
            "user_id": member.user_id,
            "full_name": member.full_name,
            "role_name": "Franchise Employee" if member.role_id == 5 else "Team Member",
            "completions": completion_by_user.get(member.user_id, 0)
        }
        for member in sorted(team_members, key=lambda item: completion_by_user.get(item.user_id, 0), reverse=True)
    ]

    franchise_rows = []
    for fp in franchise_partners:
        employee_ids = [
            m.user_id
            for m in team_members
            if m.role_id == 5 and m.reporting_manager == fp.full_name
        ]

        city_total_progress = 0
        city_completed_progress = 0
        for emp_id in employee_ids:
            emp_progs = progress_by_user.get(emp_id, [])
            city_total_progress += len(emp_progs)
            city_completed_progress += sum(1 for p in emp_progs if p.completed)

        performance_score = (
            round((city_completed_progress / city_total_progress) * 100, 2)
            if city_total_progress > 0
            else 0
        )

        franchise_rows.append({
            "franchise_id": fp.user_id,
            "franchise_name": fp.full_name,
            "employee_count": len(employee_ids),
            "performance_score": performance_score
        })

    active_this_week = sum(
        1 for member in team_members
        if member.last_login and member.last_login.date() >= seven_days_ago
    )

    completion_rate = 0
    if program_rows:
        completion_rate = sum(1 for row in program_rows if row.completed) / len(program_rows)

    streak_rows = db.query(LearningStreak).filter(LearningStreak.user_id.in_(team_member_ids)).all()
    avg_streak = sum((row.current_streak or 0) for row in streak_rows) / len(streak_rows) if streak_rows else 0

    engagement_score = round(
        ((active_this_week / len(team_members)) * 50) +
        (completion_rate * 35) +
        (min(avg_streak, 30) / 30 * 15),
        2
    )

    return {
        "stat_cards": {
            "total_team_members": {
                "value": len(team_members),
                "change": f"+{active_members} active",
                "subtitle": "In your team"
            },
            "franchise_partners": {
                "value": sum(1 for member in team_members if member.role_id == 4),
                "change": "Total",
                "subtitle": "Franchise Partners"
            },
            "franchise_employees": {
                "value": sum(1 for member in team_members if member.role_id == 5),
                "change": "Active",
                "subtitle": "Under supervision"
            },
            "team_curos": {
                "value": team_curos,
                "change": "Total earned",
                "subtitle": "By team"
            },
            "programs_completed_today": {
                "value": programs_completed_today,
                "change": "Today",
                "subtitle": "Programs done"
            },
            "curos_earned_today": {
                "value": curos_earned_today,
                "change": "Today",
                "subtitle": "Curos awarded"
            },
            "badges_earned_today": {
                "value": badges_earned_today,
                "change": "Today",
                "subtitle": "Badges unlocked"
            }
        },
        "franchise_distribution": franchise_distribution,
        "team_analytics": {
            "learning_activity": learning_activity,
            "engagement_score": engagement_score,
            "leaderboard": leaderboard
        },
        "recent_activity": recent_activity,
        "team_members": team_member_rows,
        "franchises": franchise_rows
    }

# ============================================
# FRANCHISEE DASHBOARD HELPERS
# ============================================

def get_franchisee_dashboard_data(db: Session, franchisee_user_id: int) -> Dict[str, Any]:
    """
    Build Franchisee Dashboard payload using helper-level reusable data access.
    """
    franchisee = db.query(User).filter(User.user_id == franchisee_user_id).first()
    if not franchisee:
        raise HTTPException(status_code=404, detail="Franchisee not found")

    if franchisee.role_id != 4:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Franchise Partner privileges required."
        )

    employees = db.query(User).filter(
        User.role_id == 5,
        User.reporting_manager == franchisee.full_name
    ).all()
    
    employee_ids = [emp.user_id for emp in employees]
    emp_map = {emp.user_id: emp for emp in employees}

    today = datetime.now().date()
    seven_days_ago = today - timedelta(days=6)

    if not employee_ids:
        return {
            "stat_cards": {
                "programs_completed_today": {"value": 0, "change": "+0", "subtitle": "Today's completions"},
                "curos_earned_today": {"value": 0, "change": "+0", "subtitle": "Rewards earned today"},
                "badges_earned_today": {"value": 0, "change": "+0", "subtitle": "Badges unlocked"},
                "total_employees": {"value": 0, "change": "+0", "subtitle": "Active employees"},
                "total_curos_earned": {"value": 0, "change": "+0", "subtitle": "Total rewards earned"},
                "completion_rate": {"value": 0, "change": "+0%", "subtitle": "Program completion rate"},
                "total_programs": {"value": 0, "change": "+0", "subtitle": "Available programs"}
            },
            "learning_status": [],
            "learning_activity": [],
            "recent_activity": [],
            "top_employees": [],
            "performance_metrics": {
                "average_engagement": 0,
                "monthly_growth": 0,
                "retention_rate": 0,
                "quiz_average": 0
            },
            "monthly_completions": []
        }

    active_employees = sum(1 for emp in employees if emp.is_active)
    total_curos = int(sum((emp.curos or 0) for emp in employees))
    
    program_progress = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id.in_(employee_ids)
    ).all()
    
    total_enrollments = len(program_progress)
    completed_programs = sum(1 for prog in program_progress if prog.completed)
    completion_rate = round((completed_programs / total_enrollments * 100), 1) if total_enrollments > 0 else 0
    
    # Use the helper functions for today's stats
    programs_completed_today = get_programs_completed_today(db, employee_ids)
    curos_earned_today = get_curos_earned_today(db, employee_ids)
    badges_earned_today = get_badges_earned_today(db, employee_ids)
    
    total_programs = db.query(func.count(Program.id)).filter(Program.status == "Published").scalar() or 0
    
    total_progress = len(program_progress)
    if total_progress > 0:
        completed_count = sum(1 for p in program_progress if p.completed)
        in_progress_count = sum(1 for p in program_progress if p.status == "In Progress")
        not_started_count = sum(1 for p in program_progress if p.status == "Not Started")
        
        learning_status = [
            {"label": "Completed", "value": round((completed_count / total_progress) * 100), "color": "#10B981"},
            {"label": "In Progress", "value": round((in_progress_count / total_progress) * 100), "color": "#F59E0B"},
            {"label": "Not Started", "value": round((not_started_count / total_progress) * 100), "color": "#EF4444"}
        ]
    else:
        learning_status = [
            {"label": "Completed", "value": 0, "color": "#10B981"},
            {"label": "In Progress", "value": 0, "color": "#F59E0B"},
            {"label": "Not Started", "value": 100, "color": "#EF4444"}
        ]
    
    quiz_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id.in_(employee_ids),
        QuizAttempt.attempted_at >= datetime.combine(seven_days_ago, datetime.min.time())
    ).all()
    
    video_completions = db.query(VideoCompletion).filter(
        VideoCompletion.user_id.in_(employee_ids),
        VideoCompletion.is_completed == True,
        VideoCompletion.completed_at >= datetime.combine(seven_days_ago, datetime.min.time())
    ).all()
    
    # Generate learning activity data in the format expected by EngagementChart
    learning_activity = []
    for day_offset in range(6, -1, -1):
        date_value = today - timedelta(days=day_offset)
        
        day_quizzes = sum(
            1 for quiz in quiz_attempts
            if quiz.attempted_at and quiz.attempted_at.date() == date_value
        )
        
        day_videos = sum(
            1 for video in video_completions
            if video.completed_at and video.completed_at.date() == date_value
        )
        
        day_completions = sum(
            1 for prog in program_progress
            if prog.completed and prog.completed_at and prog.completed_at.date() == date_value
        )
        
        day_logins = sum(
            1 for emp in employees
            if emp.last_login and emp.last_login.date() == date_value
        )
        
        learning_activity.append({
            "day": date_value.strftime("%b %d").replace(" 0", " "),
            "logins": day_logins,
            "videos": day_videos,
            "quizzes": day_quizzes,
            "retention": day_completions,
            "application": 0
        })
    
    recent_activity = []
    
    recent_completions = db.query(
        UserProgramProgress,
        User.full_name,
        Program.name
    ).join(User, UserProgramProgress.user_id == User.user_id)\
     .join(Program, UserProgramProgress.program_id == Program.id, isouter=True)\
     .filter(
        UserProgramProgress.user_id.in_(employee_ids),
        UserProgramProgress.completed == True,
        UserProgramProgress.completed_at.isnot(None)
     )\
     .order_by(desc(UserProgramProgress.completed_at))\
     .limit(5).all()
    
    for progress, full_name, program_name in recent_completions:
        recent_activity.append({
            "id": progress.id,
            "type": "completion",
            "title": "Program Completed",
            "description": f"{full_name} completed '{program_name or 'Program'}' program",
            "timestamp": progress.completed_at.strftime("%I:%M %p") if progress.completed_at else "",
            "employee": full_name
        })
    
    recent_curos = db.query(AuditLog).filter(
        AuditLog.actor_id.in_(employee_ids),
        AuditLog.action.ilike("%curo%")
    ).order_by(desc(AuditLog.created_at)).limit(5).all()
    
    for log in recent_curos:
        employee = emp_map.get(log.actor_id)
        if employee:
            metadata = log.log_metadata or {}
            amount = 0
            if isinstance(metadata, dict):
                raw_amount = metadata.get("amount") or metadata.get("curos") or metadata.get("value")
                if isinstance(raw_amount, (int, float, Decimal)):
                    amount = int(raw_amount)
                elif isinstance(raw_amount, str):
                    numeric = "".join(ch for ch in raw_amount if ch.isdigit())
                    amount = int(numeric) if numeric else 0
            
            recent_activity.append({
                "id": log.id,
                "type": "curo",
                "title": "Curos Awarded",
                "description": f"{amount} Curos awarded to {employee.full_name}",
                "timestamp": log.created_at.strftime("%I:%M %p") if log.created_at else "",
                "employee": employee.full_name
            })
    
    recent_badges = db.query(
        UserBadge,
        User.full_name,
        Badge.badge_name
    ).join(User, UserBadge.user_id == User.user_id)\
     .join(Badge, UserBadge.badge_id == Badge.badge_id, isouter=True)\
     .filter(UserBadge.user_id.in_(employee_ids))\
     .order_by(desc(UserBadge.earned_at))\
     .limit(5).all()
    
    for user_badge, full_name, badge_name in recent_badges:
        recent_activity.append({
            "id": UserBadge.user_badge_id,
            "type": "badge",
            "title": "Badge Unlocked",
            "description": f"{full_name} earned '{badge_name or 'Achievement'}' badge",
            "timestamp": user_badge.earned_at.strftime("%I:%M %p") if user_badge.earned_at else "",
            "employee": full_name
        })
    
    recent_registrations = db.query(User).filter(
        User.role_id == 5,
        User.reporting_manager == franchisee.full_name,
        User.date_of_joining >= datetime.combine((today - timedelta(days=7)), datetime.min.time())
    ).order_by(desc(User.date_of_joining)).limit(3).all()
    
    for emp in recent_registrations:
        recent_activity.append({
            "id": f"reg_{emp.user_id}",
            "type": "registration",
            "title": "New Employee Registered",
            "description": f"{emp.full_name} joined the franchise as a learner",
            "timestamp": emp.date_of_joining.strftime("%I:%M %p") if emp.date_of_joining else "",
            "employee": emp.full_name
        })
    
    recent_activity.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
    recent_activity = recent_activity[:5]
    
    completions_by_user = {}
    for prog in program_progress:
        if prog.completed:
            completions_by_user[prog.user_id] = completions_by_user.get(prog.user_id, 0) + 1
    
    top_employees = []
    employee_badges = ["🥇", "🥈", "🥉", "⭐", "⭐"]
    
    sorted_employees = sorted(
        employees,
        key=lambda e: (completions_by_user.get(e.user_id, 0), e.curos or 0),
        reverse=True
    )[:5]
    
    for idx, emp in enumerate(sorted_employees):
        top_employees.append({
            "id": emp.user_id,
            "name": emp.full_name,
            "completions": completions_by_user.get(emp.user_id, 0),
            "curos": int(emp.curos or 0),
            "badge": employee_badges[idx] if idx < len(employee_badges) else "⭐"
        })
    
    if employees:
        active_this_week = sum(
            1 for emp in employees
            if emp.last_login and emp.last_login.date() >= seven_days_ago
        )
        avg_engagement = round(((active_this_week / len(employees)) * 50) + (completion_rate * 0.5), 1)
    else:
        avg_engagement = 0
    
    current_month = today.replace(day=1)
    previous_month = (current_month - timedelta(days=1)).replace(day=1)
    
    current_month_joins = db.query(func.count(User.user_id)).filter(
        User.role_id == 5,
        User.reporting_manager == franchisee.full_name,
        User.date_of_joining >= current_month,
        User.date_of_joining < (current_month + timedelta(days=32)).replace(day=1)
    ).scalar() or 0
    
    previous_month_joins = db.query(func.count(User.user_id)).filter(
        User.role_id == 5,
        User.reporting_manager == franchisee.full_name,
        User.date_of_joining >= previous_month,
        User.date_of_joining < current_month
    ).scalar() or 0
    
    monthly_growth = 0
    if previous_month_joins > 0:
        monthly_growth = round(((current_month_joins - previous_month_joins) / previous_month_joins) * 100, 1)
    elif current_month_joins > 0:
        monthly_growth = 100
    
    thirty_days_ago = today - timedelta(days=30)
    retained_employees = sum(
        1 for emp in employees
        if emp.last_login and emp.last_login.date() >= thirty_days_ago
    )
    retention_rate = round((retained_employees / len(employees) * 100), 1) if employees else 0
    
    quiz_attempts_all = db.query(QuizAttempt).filter(
        QuizAttempt.user_id.in_(employee_ids)
    ).all()
    
    quiz_avg = 0
    if quiz_attempts_all:
        quiz_avg = round(sum((a.percentage or 0) for a in quiz_attempts_all) / len(quiz_attempts_all), 1)
    
    monthly_completions = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    for month_idx in range(6):
        month_date = today.replace(day=1) - timedelta(days=(today.month - month_idx - 1) % 12 * 30)
        month_start = month_date.replace(day=1)
        next_month = (month_start + timedelta(days=32)).replace(day=1)
        
        month_progress = sum(
            1 for p in program_progress
            if p.completed and p.completed_at and month_start <= p.completed_at.date() < next_month
        )
        
        monthly_completions.append({
            "month": months[month_date.month - 1],
            "count": month_progress
        })
    
    return {
        "stat_cards": {
            "programs_completed_today": {
                "value": programs_completed_today,
                "change": f"+{programs_completed_today}",
                "subtitle": "Today's completions"
            },
            "curos_earned_today": {
                "value": curos_earned_today,
                "change": f"+{curos_earned_today}",
                "subtitle": "Rewards earned today"
            },
            "badges_earned_today": {
                "value": badges_earned_today,
                "change": f"+{badges_earned_today}",
                "subtitle": "Badges unlocked"
            },
            "total_employees": {
                "value": len(employees),
                "change": f"+{active_employees} active",
                "subtitle": "Active employees"
            },
            "total_curos_earned": {
                "value": total_curos,
                "change": f"+{format_number(total_curos)}",
                "subtitle": "Total rewards earned"
            },
            "completion_rate": {
                "value": completion_rate,
                "change": f"+{completion_rate}%",
                "subtitle": "Program completion rate"
            },
            "total_programs": {
                "value": total_programs,
                "change": f"+{total_programs}",
                "subtitle": "Available programs"
            }
        },
        "learning_status": learning_status,
        "learning_activity": learning_activity,
        "recent_activity": recent_activity,
        "top_employees": top_employees,
        "performance_metrics": {
            "average_engagement": avg_engagement,
            "monthly_growth": monthly_growth,
            "retention_rate": retention_rate,
            "quiz_average": quiz_avg
        },
        "monthly_completions": monthly_completions
    }

def format_number(num: int) -> str:
    """Format number with commas for display"""
    if num is None:
        return "0"
    return f"{num:,}"

# ============================================
# LEARNER DASHBOARD HELPERS
# ============================================

def get_learner_dashboard_data(db: Session, learner_user_id: int) -> Dict[str, Any]:
    """
    Build Learner Dashboard payload using helper-level reusable data access.
    """
    learner = db.query(User).filter(User.user_id == learner_user_id).first()
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")

    if learner.role_id in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Learner privileges required."
        )

    today = datetime.now().date()
    seven_days_ago = today - timedelta(days=6)

    program_progress = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id == learner_user_id
    ).all()
    
    total_programs = db.query(func.count(Program.id)).filter(
        Program.status == "Published"
    ).scalar() or 0
    
    completed_programs = sum(1 for prog in program_progress if prog.completed)
    in_progress_programs = sum(1 for prog in program_progress if prog.status == "In Progress")
    
    video_completions = db.query(func.count(VideoCompletion.id)).filter(
        VideoCompletion.user_id == learner_user_id,
        VideoCompletion.is_completed == True
    ).scalar() or 0
    
    quiz_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == learner_user_id
    ).all()
    
    quizzes_passed = sum(1 for attempt in quiz_attempts if attempt.passed)
    total_quizzes = len(quiz_attempts)
    
    badges_earned = db.query(func.count(UserBadge.user_badge_id)).filter(
        UserBadge.user_id == learner_user_id
    ).scalar() or 0
    
    learning_streak = db.query(LearningStreak).filter(
        LearningStreak.user_id == learner_user_id
    ).first()
    
    current_streak = learning_streak.current_streak if learning_streak else 0
    highest_streak = learning_streak.longest_streak if learning_streak else 0
    
    total_curos = learner.curos or 0
    
    all_users_ranked = db.query(
        User.user_id,
        User.full_name,
        User.curos
    ).filter(
        User.curos > 0
    ).order_by(desc(User.curos)).all()
    
    learner_rank = None
    for idx, user in enumerate(all_users_ranked, 1):
        if user.user_id == learner_user_id:
            learner_rank = idx
            break
    
    if learner_rank is None:
        learner_rank = len(all_users_ranked) + 1
    
    total_participants = len(all_users_ranked)
    
    next_rank_progress = 0
    if learner_rank > 1 and learner_rank <= total_participants:
        next_user = db.query(User).filter(
            User.curos > learner.curos
        ).order_by(User.curos).first()
        
        if next_user and next_user.curos > learner.curos:
            diff_to_next = next_user.curos - learner.curos
            if diff_to_next > 0:
                avg_curos_per_program = 50
                next_rank_progress = min(
                    int((learner.curos % avg_curos_per_program) / avg_curos_per_program * 100),
                    95
                )
    
    programs_list = []
    
    all_published_programs = db.query(Program).filter(
        Program.status == "Published"
    ).all()
    
    published_program_ids = [p.id for p in all_published_programs]
    progress_map = {progress.program_id: progress for progress in program_progress}
    
    all_modules = db.query(Module).filter(
        Module.program_id.in_(published_program_ids)
    ).order_by(Module.module_order).all() if published_program_ids else []
    
    modules_by_program = defaultdict(list)
    all_module_ids = []
    for m in all_modules:
        modules_by_program[m.program_id].append(m)
        all_module_ids.append(m.id)
        
    all_videos = db.query(Video).filter(
        Video.module_id.in_(all_module_ids)
    ).all() if all_module_ids else []
    
    videos_by_module = defaultdict(list)
    all_video_ids = []
    for v in all_videos:
        videos_by_module[v.module_id].append(v)
        all_video_ids.append(v.id)
        
    all_quizzes = db.query(Quiz).filter(
        Quiz.module_id.in_(all_module_ids)
    ).all() if all_module_ids else []
    
    quizzes_by_module = defaultdict(list)
    all_quiz_ids = []
    for q in all_quizzes:
        quizzes_by_module[q.module_id].append(q)
        all_quiz_ids.append(q.id)
        
    completed_video_ids = set()
    if all_video_ids:
        completed_vids = db.query(VideoCompletion.video_id).filter(
            VideoCompletion.user_id == learner_user_id,
            VideoCompletion.video_id.in_(all_video_ids),
            VideoCompletion.is_completed == True
        ).all()
        completed_video_ids = {r[0] for r in completed_vids}
        
    passed_quiz_ids = set()
    if all_quiz_ids:
        passed_qids = db.query(QuizAttempt.quiz_id).filter(
            QuizAttempt.user_id == learner_user_id,
            QuizAttempt.quiz_id.in_(all_quiz_ids),
            QuizAttempt.passed == True
        ).all()
        passed_quiz_ids = {r[0] for r in passed_qids}
        
    for program in all_published_programs:
        progress = progress_map.get(program.id)
        modules = modules_by_program.get(program.id, [])
        
        modules_data = []
        for module in modules:
            videos_in_module = videos_by_module.get(module.id, [])
            quizzes_in_module = quizzes_by_module.get(module.id, [])
            
            completed_videos = sum(1 for v in videos_in_module if v.id in completed_video_ids)
            completed_quizzes = sum(1 for q in quizzes_in_module if q.id in passed_quiz_ids)
            
            module_completed = (
                len(videos_in_module) > 0 and completed_videos == len(videos_in_module) and
                len(quizzes_in_module) > 0 and completed_quizzes == len(quizzes_in_module)
            )
            
            modules_data.append({
                "id": module.id,
                "name": module.title,
                "completed": module_completed,
                "curos": module.curos or 0
            })
        
        completion_status = "not_started"
        progress_percentage = 0
        
        if progress:
            if progress.completed:
                completion_status = "completed"
                progress_percentage = progress.completed_percentage or 100
            elif progress.status == "In Progress":
                completion_status = "in_progress"
                progress_percentage = progress.completed_percentage or 0
            else:
                any_module_completed = any(m["completed"] for m in modules_data)
                if any_module_completed:
                    completion_status = "in_progress"
                    if modules:
                        progress_percentage = int((len([m for m in modules_data if m["completed"]]) / len(modules)) * 100)
        else:
            completion_status = "not_started"
            progress_percentage = 0
        
        duration = program.duration or "Self-paced"
        category = program.category or "General"
        
        is_mandatory = False
        if program.type and program.type.lower() == "mandatory":
            is_mandatory = True
        
        programs_list.append({
            "id": program.id,
            "name": program.name,
            "description": program.description or "",
            "category": category,
            "duration": duration,
            "type": program.type or "optional",
            "is_mandatory": is_mandatory,
            "thumbnail": program.thumbnail,
            "completion_status": completion_status,
            "progress": progress_percentage,
            "last_completed_module": len([m for m in modules_data if m["completed"]]),
            "current_module": len([m for m in modules_data if not m["completed"]]) + 1 if any(not m["completed"] for m in modules_data) else len(modules_data),
            "modules": modules_data,
            "curos": program.curos or 0,
            "total_module_curos": sum(m.get("curos", 0) for m in modules_data),
            "total_curos": (program.curos or 0) + sum(m.get("curos", 0) for m in modules_data)
        })
    
    user_badges = db.query(
        UserBadge,
        Badge
    ).join(Badge, UserBadge.badge_id == Badge.badge_id)\
     .filter(UserBadge.user_id == learner_user_id)\
     .order_by(desc(UserBadge.earned_at)).all()
    
    badges_data = []
    icon_map = {
        "Bronze": "🥉",
        "Silver": "🥈",
        "Gold": "🥇",
        "Platinum": "💎",
        "Diamond": "👑"
    }
    category_map = {
        "speed": "speed",
        "quiz": "quiz",
        "streak": "streak",
        "learning": "learning"
    }
    
    for user_badge, badge in user_badges:
        icon = icon_map.get(badge.tier, "⭐")
        category = category_map.get(badge.badge_type, "learning")
        
        badges_data.append({
            "id": badge.badge_id,
            "name": badge.badge_name,
            "icon": icon,
            "category": category,
            "earned_date": user_badge.earned_at.strftime("%Y-%m-%d") if user_badge.earned_at else ""
        })
    
    seven_days_ago_dt = datetime.combine(today - timedelta(days=6), datetime.min.time())
    
    recent_video_dates = set()
    recent_vids = db.query(VideoCompletion.completed_at).filter(
        VideoCompletion.user_id == learner_user_id,
        VideoCompletion.is_completed == True,
        VideoCompletion.completed_at >= seven_days_ago_dt
    ).all()
    for rv in recent_vids:
        if rv[0]:
            recent_video_dates.add(rv[0].date())
            
    recent_quiz_dates = set()
    recent_quizzes = db.query(QuizAttempt.attempted_at).filter(
        QuizAttempt.user_id == learner_user_id,
        QuizAttempt.attempted_at >= seven_days_ago_dt
    ).all()
    for rq in recent_quizzes:
        if rq[0]:
            recent_quiz_dates.add(rq[0].date())

    week_data = []
    for day_offset in range(6, -1, -1):
        date_value = today - timedelta(days=day_offset)
        
        logged_in = learner.last_login and learner.last_login.date() == date_value
        completed = bool((date_value in recent_video_dates) or (date_value in recent_quiz_dates) or logged_in)
        
        week_data.append({
            "day": date_value.strftime("%a"),
            "completed": completed,
            "date": date_value.strftime("%Y-%m-%d")
        })
    
    return {
        "stats": {
            "completed_programs": completed_programs,
            "total_programs": total_programs,
            "in_progress_programs": in_progress_programs,
            "videos_watched": video_completions,
            "quizzes_passed": quizzes_passed,
            "badges_earned": badges_earned,
            "current_streak": current_streak,
            "highest_streak": highest_streak,
            "total_curos": total_curos,
            "leaderboard_rank": learner_rank or total_participants + 1,
            "total_participants": total_participants,
            "next_rank_progress": next_rank_progress
        },
        "programs": programs_list,
        "badges": badges_data,
        "week_data": week_data
    }

def get_learner_program_stats(db: Session, learner_user_id: int, program_id: int) -> Dict[str, Any]:
    """
    Get detailed stats for a specific program for a learner.
    """
    learner = db.query(User).filter(User.user_id == learner_user_id).first()
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    progress = db.query(UserProgramProgress).filter(
        UserProgramProgress.user_id == learner_user_id,
        UserProgramProgress.program_id == program_id
    ).first()
    
    modules = db.query(Module).filter(
        Module.program_id == program_id
    ).order_by(Module.module_order).all()
    
    module_ids = [m.id for m in modules]
    
    all_videos = db.query(Video).filter(Video.module_id.in_(module_ids)).all() if module_ids else []
    all_quizzes = db.query(Quiz).filter(Quiz.module_id.in_(module_ids)).all() if module_ids else []
    
    videos_by_module = defaultdict(list)
    video_ids = []
    for v in all_videos:
        videos_by_module[v.module_id].append(v)
        video_ids.append(v.id)
        
    quizzes_by_module = defaultdict(list)
    quiz_ids = []
    for q in all_quizzes:
        quizzes_by_module[q.module_id].append(q)
        quiz_ids.append(q.id)
        
    completed_video_ids = set()
    if video_ids:
        vids = db.query(VideoCompletion.video_id).filter(
            VideoCompletion.user_id == learner_user_id,
            VideoCompletion.video_id.in_(video_ids),
            VideoCompletion.is_completed == True
        ).all()
        completed_video_ids = {r[0] for r in vids}
        
    passed_quiz_ids = set()
    if quiz_ids:
        qids = db.query(QuizAttempt.quiz_id).filter(
            QuizAttempt.user_id == learner_user_id,
            QuizAttempt.quiz_id.in_(quiz_ids),
            QuizAttempt.passed == True
        ).all()
        passed_quiz_ids = {r[0] for r in qids}
        
    modules_data = []
    total_videos = len(all_videos)
    completed_videos = sum(1 for vid_id in video_ids if vid_id in completed_video_ids)
    total_quizzes = len(all_quizzes)
    completed_quizzes = sum(1 for q_id in quiz_ids if q_id in passed_quiz_ids)
    
    for module in modules:
        vids = videos_by_module.get(module.id, [])
        qs = quizzes_by_module.get(module.id, [])
        
        mod_completed_vids = sum(1 for v in vids if v.id in completed_video_ids)
        mod_completed_qs = sum(1 for q in qs if q.id in passed_quiz_ids)
        
        module_completed = False
        if len(vids) > 0 and len(qs) > 0:
            module_completed = (mod_completed_vids == len(vids) and mod_completed_qs == len(qs))
        elif len(vids) > 0:
            module_completed = (mod_completed_vids == len(vids))
        elif len(qs) > 0:
            module_completed = (mod_completed_qs == len(qs))
            
        modules_data.append({
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "module_order": module.module_order,
            "completed": module_completed,
            "total_videos": len(vids),
            "completed_videos": mod_completed_vids,
            "total_quizzes": len(qs),
            "completed_quizzes": mod_completed_qs
        })
        
    return {
        "program_id": program.id,
        "program_name": program.name,
        "program_description": program.description,
        "program_status": progress.status if progress else "Not Started",
        "completed_percentage": progress.completed_percentage if progress else 0,
        "is_completed": progress.completed if progress else False,
        "modules": modules_data,
        "total_videos": total_videos,
        "completed_videos": completed_videos,
        "total_quizzes": total_quizzes,
        "completed_quizzes": completed_quizzes
    }