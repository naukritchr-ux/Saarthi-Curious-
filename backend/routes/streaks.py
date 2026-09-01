from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import LearningStreak, User
from datetime import date, timedelta
from typing import Optional

router = APIRouter(prefix="/streaks", tags=["Streak Management"])


@router.get("/user/{user_id}")
def get_user_streak(user_id: int, db: Session = Depends(get_db)):
    """Get streak data for a specific user"""
    streak = db.query(LearningStreak).filter(
        LearningStreak.user_id == user_id
    ).first()
    
    if not streak:
        raise HTTPException(status_code=404, detail="User streak not found")
    
    return {
        "user_id": streak.user_id,
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_activity_date": streak.last_activity_date,
        "total_learning_days": streak.total_learning_days,
        "freezes": streak.freezes,  # Add this
        "updated_at": streak.updated_at
    }


@router.get("/current")
def get_current_user_streak(db: Session = Depends(get_db)):
    """Get current user's streak (placeholder - needs auth)"""
    streak = db.query(LearningStreak).first()
    
    if not streak:
        return {
            "user_id": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None,
            "total_learning_days": 0,
            "freezes": 0,  # Add this
            "updated_at": None
        }
    
    return {
        "user_id": streak.user_id,
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_activity_date": streak.last_activity_date,
        "total_learning_days": streak.total_learning_days,
        "freezes": streak.freezes,  # Add this
        "updated_at": streak.updated_at
    }


@router.get("/leaderboard")
def get_streak_leaderboard(db: Session = Depends(get_db)):
    """Get leaderboard sorted by current streak"""
    try:
        streaks = db.query(User, LearningStreak).outerjoin(
            LearningStreak, User.user_id == LearningStreak.user_id
        ).order_by(
            LearningStreak.current_streak.desc().nulls_last()
        ).all()
        
        result = []
        for user, streak in streaks:
            result.append({
                "user_id": user.user_id,
                "name": user.full_name,
                "role_id": user.role_id,
                "current_streak": streak.current_streak if streak else 0,
                "longest_streak": streak.longest_streak if streak else 0,
                "total_learning_days": streak.total_learning_days if streak else 0,
                "freezes": streak.freezes if streak else 0  # Add this
            })
        
        return result
    except Exception as e:
        print(f"Error fetching streak leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
def get_streak_stats(db: Session = Depends(get_db)):
    """Get overall streak statistics"""
    streaks = db.query(LearningStreak).all()
    
    if not streaks:
        return {
            "total_users": 0,
            "active_streaks": 0,
            "avg_current_streak": 0,
            "longest_overall_streak": 0,
            "total_freezes": 0  # Add this
        }
    
    active_streaks = len([s for s in streaks if s.current_streak > 0])
    avg_current_streak = sum(s.current_streak for s in streaks) / len(streaks)
    longest_overall = max(s.longest_streak for s in streaks)
    total_freezes = sum(s.freezes for s in streaks) if streaks else 0  # Add this
    
    return {
        "total_users": len(streaks),
        "active_streaks": active_streaks,
        "avg_current_streak": round(avg_current_streak, 1),
        "longest_overall_streak": longest_overall,
        "total_freezes": total_freezes  # Add this
    }


@router.post("/user/{user_id}/activity")
def record_activity(user_id: int, db: Session = Depends(get_db)):
    """Record learning activity and update streak with freeze support"""
    streak = db.query(LearningStreak).filter(
        LearningStreak.user_id == user_id
    ).first()
    
    if not streak:
        # Create new streak record
        streak = LearningStreak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_activity_date=date.today(),
            total_learning_days=1,
            freezes=0
        )
        db.add(streak)
    else:
        # Update existing streak
        today = date.today()
        
        if streak.last_activity_date:
            days_since_last = (today - streak.last_activity_date).days
            
            if days_since_last == 1:
                # Consecutive day - increment streak
                streak.current_streak += 1
                streak.total_learning_days += 1
                if streak.current_streak > streak.longest_streak:
                    streak.longest_streak = streak.current_streak
                # Check for freeze rewards
                check_freezes(streak)
            elif days_since_last > 1:
                # Check if we can use a freeze
                days_to_cover = days_since_last - 1  # Number of missed days
                if streak.freezes >= days_to_cover:
                    # Use freezes to cover missed days
                    streak.freezes -= days_to_cover
                    # Streak continues but total learning days only for actual activity
                    streak.current_streak += 1  # Add one for today
                    streak.total_learning_days += 1
                    if streak.current_streak > streak.longest_streak:
                        streak.longest_streak = streak.current_streak
                    # Check for freeze rewards
                    check_freezes(streak)
                else:
                    # Not enough freezes - reset streak
                    streak.current_streak = 1
                    streak.total_learning_days += 1
            # If same day, don't change streak
        else:
            streak.current_streak = 1
            streak.total_learning_days = 1
        
        streak.last_activity_date = today
    
    db.commit()
    db.refresh(streak)
    
    return {
        "user_id": streak.user_id,
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_activity_date": streak.last_activity_date,
        "total_learning_days": streak.total_learning_days,
        "freezes": streak.freezes,
        "freeze_used": days_to_cover if 'days_to_cover' in locals() and days_to_cover > 0 else 0
    }


def check_freezes(streak: LearningStreak):
    """Check and award freezes based on streak milestones"""
    # Award 1 freeze every 10 consecutive days
    # You can adjust the multiplier as needed
    freeze_threshold = 10
    
    # Check if we should award a freeze
    if streak.current_streak % freeze_threshold == 0:
        streak.freezes += 1
        print(f"Freeze awarded! User {streak.user_id} now has {streak.freezes} freezes")


@router.post("/user/{user_id}/freeze")
def add_freeze(user_id: int, db: Session = Depends(get_db)):
    """Manually add a freeze to a user (admin only)"""
    streak = db.query(LearningStreak).filter(
        LearningStreak.user_id == user_id
    ).first()
    
    if not streak:
        raise HTTPException(status_code=404, detail="User streak not found")
    
    streak.freezes += 1
    db.commit()
    
    return {
        "user_id": streak.user_id,
        "freezes": streak.freezes
    }


@router.post("/user/{user_id}/freeze/remove")
def remove_freeze(user_id: int, db: Session = Depends(get_db)):
    """Manually remove a freeze from a user (admin only)"""
    streak = db.query(LearningStreak).filter(
        LearningStreak.user_id == user_id
    ).first()
    
    if not streak:
        raise HTTPException(status_code=404, detail="User streak not found")
    
    if streak.freezes <= 0:
        raise HTTPException(status_code=400, detail="No freezes available to remove")
    
    streak.freezes -= 1
    db.commit()
    
    return {
        "user_id": streak.user_id,
        "freezes": streak.freezes
    }


@router.post("/seed")
def seed_streak_data(db: Session = Depends(get_db)):
    """Seed sample streak data for testing"""
    users = db.query(User).all()
    
    for i, user in enumerate(users):
        existing_streak = db.query(LearningStreak).filter(
            LearningStreak.user_id == user.user_id
        ).first()
        
        if not existing_streak:
            # Create sample streak data
            streak = LearningStreak(
                user_id=user.user_id,
                current_streak=(i % 30) + 1,
                longest_streak=(i % 50) + 10,
                last_activity_date=date.today(),
                total_learning_days=(i % 100) + 20,
                freezes=(i % 5)  # Give some users freezes
            )
            db.add(streak)
    
    db.commit()
    return {"message": f"Seeded streak data for {len(users)} users"}