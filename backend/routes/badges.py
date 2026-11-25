from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

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


@router.get("")
def get_user_earned_badge_ids(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get earned badge IDs for a user, or all active badges"""
    if not user_id:
        return {
            "earned_badge_ids": [],
            "badges": []
        }

    user_badges = (
        db.query(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.badge_id)
        .filter(UserBadge.user_id == user_id)
        .all()
    )

    earned_ids = []
    for ub, b in user_badges:
        earned_ids.append(str(b.badge_id))
        if b.badge_name:
            earned_ids.append(b.badge_name.lower().replace(" ", "_"))

    return {
        "user_id": user_id,
        "earned_badge_ids": earned_ids,
        "count": len(user_badges)
    }



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


class UpdateBadgeRequest(BaseModel):
    badge_name: Optional[str] = None
    badge_type: Optional[str] = None
    tier: Optional[str] = None
    requirement_value: Optional[int] = None
    curos_reward: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.put("/{badge_id}")
@router.patch("/{badge_id}")
def update_badge_rule(
    badge_id: int,
    request: UpdateBadgeRequest,
    db: Session = Depends(get_db)
):
    """Update rule thresholds, Curo reward, or active status for a badge"""
    badge = db.query(Badge).filter(Badge.badge_id == badge_id).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    
    if request.badge_name is not None:
        badge.badge_name = request.badge_name
    if request.badge_type is not None:
        badge.badge_type = request.badge_type
    if request.tier is not None:
        badge.tier = request.tier
    if request.requirement_value is not None:
        badge.requirement_value = request.requirement_value
    if request.curos_reward is not None:
        badge.curos_reward = request.curos_reward
    if request.description is not None:
        badge.description = request.description
    if request.is_active is not None:
        badge.is_active = request.is_active
        
    db.commit()
    db.refresh(badge)
    return {
        "badge_id": badge.badge_id,
        "badge_name": badge.badge_name,
        "badge_type": badge.badge_type,
        "tier": badge.tier,
        "requirement_value": badge.requirement_value,
        "curos_reward": badge.curos_reward,
        "description": badge.description,
        "is_active": badge.is_active
    }
