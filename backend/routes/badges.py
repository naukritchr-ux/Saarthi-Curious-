from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import (
    Badge,
    UserBadge,
    UserProgramProgress,
    RetentionQuizAttempt,
    ApplicationCheckAttempt,
    User
)

router = APIRouter(
    prefix="/badges",
    tags=["Badges"]
)


@router.post("/check/{user_id}")
def check_badges(user_id: int, db: Session = Depends(get_db)):
    """Check and award badges based on various criteria"""
    
    # Get user curos
    user = db.query(User).filter(User.user_id == user_id).first()
    user_curos = user.curos if user else 0
    
    # Count completed programs
    completed_programs = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.completed == True
        )
        .count()
    )
    
    # Count passed retention quizzes
    passed_retention_quizzes = (
        db.query(RetentionQuizAttempt)
        .filter(
            RetentionQuizAttempt.user_id == user_id,
            RetentionQuizAttempt.passed == True
        )
        .count()
    )
    
    # Count passed application checks
    passed_application_checks = (
        db.query(ApplicationCheckAttempt)
        .filter(
            ApplicationCheckAttempt.user_id == user_id,
            ApplicationCheckAttempt.passed == True
        )
        .count()
    )

    badges = db.query(Badge).filter(Badge.is_active == True).all()

    # Fetch all existing badge IDs for this user in one query
    existing_badge_ids = {
        ub.badge_id
        for ub in db.query(UserBadge.badge_id).filter(UserBadge.user_id == user_id).all()
    }

    awarded = []

    for badge in badges:
        if badge.badge_id in existing_badge_ids:
            continue  # Already awarded this badge
        
        criteria_met = False
        
        # Check criteria based on badge type
        if badge.badge_type.lower() == "completion":
            if completed_programs >= badge.requirement_value:
                criteria_met = True
        elif badge.badge_type.lower() == "retention":
            if passed_retention_quizzes >= badge.requirement_value:
                criteria_met = True
        elif badge.badge_type.lower() == "application":
            if passed_application_checks >= badge.requirement_value:
                criteria_met = True
        elif badge.badge_type.lower() == "curos":
            if user_curos >= badge.requirement_value:
                criteria_met = True
        
        if criteria_met:
            new_badge = UserBadge(
                user_id=user_id,
                badge_id=badge.badge_id
            )
            db.add(new_badge)
            awarded.append(badge.badge_name)
            
            # Award curos if badge has reward
            if badge.curos_reward > 0 and user:
                user.curos += badge.curos_reward

    db.commit()

    return {
        "completed_programs": completed_programs,
        "passed_retention_quizzes": passed_retention_quizzes,
        "passed_application_checks": passed_application_checks,
        "user_curos": user_curos,
        "new_badges": awarded
    }


@router.get("/user/{user_id}")
def get_user_badges(user_id: int, db: Session = Depends(get_db)):

    badges = (
        db.query(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.badge_id)
        .filter(UserBadge.user_id == user_id)
        .all()
    )

    return [
        {
            "badge_id": badge.badge_id,
            "badge_name": badge.badge_name,
            "badge_type": badge.badge_type,
            "tier": badge.tier,
            "requirement_value": badge.requirement_value,
            "reward_curos": badge.curos_reward,
            "description": badge.description,
            "badge_icon": badge.badge_icon,
            "earned_at": user_badge.earned_at
        }
        for user_badge, badge in badges
    ]


@router.get("/all")
def get_all_badges(db: Session = Depends(get_db)):
    """Get all available badges with their criteria"""
    badges = db.query(Badge).filter(Badge.is_active == True).all()
    
    return [
        {
            "badge_id": badge.badge_id,
            "badge_name": badge.badge_name,
            "badge_type": badge.badge_type,
            "tier": badge.tier,
            "requirement_value": badge.requirement_value,
            "curos_reward": badge.curos_reward,
            "description": badge.description,
            "badge_icon": badge.badge_icon,
            "is_active": badge.is_active
        }
        for badge in badges
    ]


@router.post("/check-all")
def check_all_users_badges(db: Session = Depends(get_db)):
    """Check and award badges for all users (admin function)"""
    users = db.query(User).filter(~User.role_id.in_([1, 2])).all()
    
    total_awarded = 0
    results = []
    
    for user in users:
        result = check_badges(user.user_id, db)
        if result["new_badges"]:
            total_awarded += len(result["new_badges"])
            results.append({
                "user_id": user.user_id,
                "user_name": user.full_name,
                "badges_awarded": result["new_badges"]
            })
    
    return {
        "total_users_checked": len(users),
        "total_badges_awarded": total_awarded,
        "details": results
    }