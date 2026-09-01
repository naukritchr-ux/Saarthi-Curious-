
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from database import get_db
from models import User, Program
from schemas import UpdateProgramCurosRequest
from sqlalchemy import func

router = APIRouter(prefix="/curo", tags=["Curo Management"])

Subordinate = aliased(User)

@router.get("/programs")
def get_program_curos(db: Session = Depends(get_db)):
    """Get all programs with their curo configuration"""
    programs = db.query(Program).all()
    return [
        {
            "id": program.id,
            "name": program.name,
            "curos": program.curos or 0
        }
        for program in programs
    ]

@router.put("/programs/{program_id}")
def update_program_curo(
    program_id: int,
    request: UpdateProgramCurosRequest,
    db: Session = Depends(get_db)
):
    """Update program curo configuration"""
    program = db.query(Program).filter(
        Program.id == program_id
    ).first()
    
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    program.curos = request.curos
    db.commit()
    db.refresh(program)
    
    return {
        "id": program.id,
        "name": program.name,
        "curos": program.curos
    }


@router.get("/users")
def get_all_user_curos(db: Session = Depends(get_db)):
    """Get all users with their curo balances"""
    users = db.query(User).all()
    return [
        {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "curos": user.curos or 0,
            "role_id": user.role_id
        }
        for user in users
    ]


@router.get("/users/{user_id}")
def get_user_curo(user_id: int, db: Session = Depends(get_db)):
    """Get curo balance for a specific user"""
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "curos": user.curos or 0,
        "role_id": user.role_id
    }


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """Get leaderboard with user curo balances"""
    users = db.query(User).filter(~User.role_id.in_([1, 2])).order_by(User.curos.desc()).all()
    
    return [
        {
            "user_id": user.user_id,
            "name": user.full_name,
            "curos": user.curos or 0,
            "role_id": user.role_id,
            "reporting_manager": user.reporting_manager,
            "Team_Leader_id": user.Team_Leader_id,
        }
        for user in users
    ]


@router.get("/team-leader-rankings")
def get_team_leader_rankings(db: Session = Depends(get_db)):
    rankings = (
        db.query(
            User.user_id.label("id"),
            User.full_name.label("name"),
            func.count(Subordinate.user_id).label("subordinates"),
            func.coalesce(func.sum(Subordinate.curos), 0).label("totalSubordinateCuros"),
        )
        .outerjoin(
            Subordinate,
            Subordinate.Team_Leader_id == User.user_id
        )
        .filter(User.role_id == 3)
        .group_by(User.user_id, User.full_name)
        .order_by(func.coalesce(func.sum(Subordinate.curos), 0).desc())
        .all()
    )

    return [
        {
            "id": r.id,
            "name": r.name,
            "subordinates": r.subordinates,
            "totalSubordinateCuros": r.totalSubordinateCuros,
        }
        for r in rankings
    ]


@router.get("/stats")
def get_curo_stats(db: Session = Depends(get_db)):
    """Get overall curo statistics"""
    eligible_users = db.query(User).filter(~User.role_id.in_([1, 2])).all()

    total_curos = sum(u.curos or 0 for u in eligible_users)
    active_users = sum(1 for u in eligible_users if (u.curos or 0) > 0)
    zero_curos_users = sum(1 for u in eligible_users if (u.curos or 0) == 0)
    avg_curos = round(total_curos / active_users) if active_users > 0 else 0

    return {
        "total_curos": total_curos,
        "active_users": active_users,
        "zero_curos_users": zero_curos_users,
        "avg_curos": avg_curos
    }
