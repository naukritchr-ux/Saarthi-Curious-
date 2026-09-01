from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import (
    User,
    UserProgramProgress,
    RetentionQuizAttempt,
    ApplicationCheckAttempt
)

router = APIRouter(prefix="/leaderboards", tags=["Leaderboards"])


@router.get("/completion")
def get_completion_leaderboard(db: Session = Depends(get_db)):
    """Get leaderboard sorted by number of completed programs"""
    try:
        # Count completed programs per user
        completion_counts = (
            db.query(
                UserProgramProgress.user_id,
                func.count(UserProgramProgress.id).label('completed_count')
            )
            .filter(UserProgramProgress.completed == True)
            .group_by(UserProgramProgress.user_id)
            .all()
        )
        
        # Create a dictionary of user_id -> completed_count
        completion_dict = {user_id: count for user_id, count in completion_counts}
        
        # Get all users (excluding admins)
        users = db.query(User).filter(~User.role_id.in_([1, 2])).all()
        
        result = []
        for user in users:
            result.append({
                "user_id": user.user_id,
                "name": user.full_name,
                "role_id": user.role_id,
                "completed_programs": completion_dict.get(user.user_id, 0)
            })
        
        # Sort by completed programs descending
        result.sort(key=lambda x: x["completed_programs"], reverse=True)
        
        return result
    except Exception as e:
        print(f"Error fetching completion leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/retention")
def get_retention_leaderboard(db: Session = Depends(get_db)):
    """Get leaderboard sorted by number of passed retention quizzes"""
    try:
        # Count passed retention quiz attempts per user
        retention_counts = (
            db.query(
                RetentionQuizAttempt.user_id,
                func.count(RetentionQuizAttempt.id).label('passed_count')
            )
            .filter(RetentionQuizAttempt.passed == True)
            .group_by(RetentionQuizAttempt.user_id)
            .all()
        )
        
        # Create a dictionary of user_id -> passed_count
        retention_dict = {user_id: count for user_id, count in retention_counts}
        
        # Get all users (excluding admins)
        users = db.query(User).filter(~User.role_id.in_([1, 2])).all()
        
        result = []
        for user in users:
            result.append({
                "user_id": user.user_id,
                "name": user.full_name,
                "role_id": user.role_id,
                "passed_retention_quizzes": retention_dict.get(user.user_id, 0)
            })
        
        # Sort by passed retention quizzes descending
        result.sort(key=lambda x: x["passed_retention_quizzes"], reverse=True)
        
        return result
    except Exception as e:
        print(f"Error fetching retention leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/application")
def get_application_leaderboard(db: Session = Depends(get_db)):
    """Get leaderboard sorted by number of passed application checks"""
    try:
        # Count passed application check attempts per user
        application_counts = (
            db.query(
                ApplicationCheckAttempt.user_id,
                func.count(ApplicationCheckAttempt.id).label('passed_count')
            )
            .filter(ApplicationCheckAttempt.passed == True)
            .group_by(ApplicationCheckAttempt.user_id)
            .all()
        )
        
        # Create a dictionary of user_id -> passed_count
        application_dict = {user_id: count for user_id, count in application_counts}
        
        # Get all users (excluding admins)
        users = db.query(User).filter(~User.role_id.in_([1, 2])).all()
        
        result = []
        for user in users:
            result.append({
                "user_id": user.user_id,
                "name": user.full_name,
                "role_id": user.role_id,
                "passed_application_checks": application_dict.get(user.user_id, 0)
            })
        
        # Sort by passed application checks descending
        result.sort(key=lambda x: x["passed_application_checks"], reverse=True)
        
        return result
    except Exception as e:
        print(f"Error fetching application leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/completion/stats")
def get_completion_stats(db: Session = Depends(get_db)):
    """Get overall completion statistics"""
    try:
        completion_counts = (
            db.query(
                UserProgramProgress.user_id,
                func.count(UserProgramProgress.id).label('completed_count')
            )
            .filter(UserProgramProgress.completed == True)
            .group_by(UserProgramProgress.user_id)
            .all()
        )
        
        if not completion_counts:
            return {
                "total_users": 0,
                "users_with_completions": 0,
                "total_completed_programs": 0,
                "avg_completed_programs": 0,
                "max_completed_programs": 0
            }
        
        counts = [count for _, count in completion_counts]
        users_with_completions = len(completion_counts)
        total_completed_programs = sum(counts)
        avg_completed = total_completed_programs / users_with_completions
        max_completed = max(counts)
        
        return {
            "total_users": users_with_completions,
            "users_with_completions": users_with_completions,
            "total_completed_programs": total_completed_programs,
            "avg_completed_programs": round(avg_completed, 1),
            "max_completed_programs": max_completed
        }
    except Exception as e:
        print(f"Error fetching completion stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/retention/stats")
def get_retention_stats(db: Session = Depends(get_db)):
    """Get overall retention statistics"""
    try:
        retention_counts = (
            db.query(
                RetentionQuizAttempt.user_id,
                func.count(RetentionQuizAttempt.id).label('passed_count')
            )
            .filter(RetentionQuizAttempt.passed == True)
            .group_by(RetentionQuizAttempt.user_id)
            .all()
        )
        
        if not retention_counts:
            return {
                "total_users": 0,
                "users_with_passes": 0,
                "total_passed_quizzes": 0,
                "avg_passed_quizzes": 0,
                "max_passed_quizzes": 0
            }
        
        counts = [count for _, count in retention_counts]
        users_with_passes = len(retention_counts)
        total_passed_quizzes = sum(counts)
        avg_passed = total_passed_quizzes / users_with_passes
        max_passed = max(counts)
        
        return {
            "total_users": users_with_passes,
            "users_with_passes": users_with_passes,
            "total_passed_quizzes": total_passed_quizzes,
            "avg_passed_quizzes": round(avg_passed, 1),
            "max_passed_quizzes": max_passed
        }
    except Exception as e:
        print(f"Error fetching retention stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/application/stats")
def get_application_stats(db: Session = Depends(get_db)):
    """Get overall application statistics"""
    try:
        application_counts = (
            db.query(
                ApplicationCheckAttempt.user_id,
                func.count(ApplicationCheckAttempt.id).label('passed_count')
            )
            .filter(ApplicationCheckAttempt.passed == True)
            .group_by(ApplicationCheckAttempt.user_id)
            .all()
        )
        
        if not application_counts:
            return {
                "total_users": 0,
                "users_with_passes": 0,
                "total_passed_checks": 0,
                "avg_passed_checks": 0,
                "max_passed_checks": 0
            }
        
        counts = [count for _, count in application_counts]
        users_with_passes = len(application_counts)
        total_passed_checks = sum(counts)
        avg_passed = total_passed_checks / users_with_passes
        max_passed = max(counts)
        
        return {
            "total_users": users_with_passes,
            "users_with_passes": users_with_passes,
            "total_passed_checks": total_passed_checks,
            "avg_passed_checks": round(avg_passed, 1),
            "max_passed_checks": max_passed
        }
    except Exception as e:
        print(f"Error fetching application stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
