from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from database import get_db
from models import User, LearningStreak, UserProgramProgress, Program, Module, ModuleCompletion, QuizAttempt, VideoCompletion, Video, Quiz
from schemas import UserCreate, UserUpdate, UserProfileResponse
from auth import hash_password, get_current_user
from email_service import send_welcome_email
from routes.audit_helpers import create_audit_log

router = APIRouter()


# Get Reporting Managers
@router.get("/reporting-managers")
def get_reporting_managers(
    db: Session = Depends(get_db)
):
    reporting_managers = db.query(User).filter(
        User.role_id == 3,
        User.is_active == True
    ).all()

    return [
        {
            "user_id": rm.user_id,
            "full_name": rm.full_name
        }
        for rm in reporting_managers
    ]


# Get Team Leaders
@router.get("/team-leaders")
def get_team_leaders(
    db: Session = Depends(get_db)
):
    team_leaders = db.query(User).filter(
        User.role_id == 3,
        User.is_active == True
    ).all()

    return [
        {
            "user_id": tl.user_id,
            "full_name": tl.full_name
        }
        for tl in team_leaders
    ]


# Create User
@router.post("/users")
def create_user(
    user: UserCreate,
    request: Request,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None)
):
    # Authorization: Only Master Admin (1) and Admin (2) can create users
    current_user = db.query(User).filter(User.user_id == current_user_id).first()
    if not current_user or current_user.role_id not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin and Admin can create users"
        )
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    # Validate Team_Leader_id if provided
    if user.Team_Leader_id:
        team_leader = db.query(User).filter(
            User.user_id == user.Team_Leader_id,
            User.role_id == 3,
            User.is_active == True
        ).first()

        if not team_leader:
            raise HTTPException(
                status_code=400,
                detail="Invalid Team Leader ID or Team Leader is not active"
            )

    try:
        hashed_password = hash_password(
            user.password
        )

        new_user = User(
            full_name=user.full_name,
            email=user.email,
            city=user.city,
            reporting_manager=user.reporting_manager,
            Team_Leader_id=user.Team_Leader_id,
            role_id=user.role_id,
            date_of_joining=user.date_of_joining,
            password_hash=hashed_password,
            is_active=True,
            last_login=datetime.utcnow()
        )

        db.add(new_user)
        db.flush()  # Generates new_user.user_id without committing

        new_streak = LearningStreak(
            user_id=new_user.user_id,
            current_streak=0,
            longest_streak=0,
            total_learning_days=0,
            last_activity_date=None,
            updated_at=datetime.utcnow()
        )

        db.add(new_streak)
        db.commit()

        db.refresh(new_user)

        # Create audit log
        create_audit_log(
            db=db,
            request=request,
            actor_id=actor_id,
            actor_name=actor_name,
            action="user_created",
            entity_type="user",
            entity_id=new_user.user_id,
            message=f"Created new user: {new_user.full_name} ({new_user.email})",
            metadata={
                "user_id": int(new_user.user_id) if new_user.user_id else None,
                "full_name": str(new_user.full_name) if new_user.full_name else None,
                "email": str(new_user.email) if new_user.email else None,
                "role_id": int(new_user.role_id) if new_user.role_id else None,
                "city": str(new_user.city) if new_user.city else None
            }
        )

        try:
            send_welcome_email(
                user.email,
                user.password
            )
        except Exception as e:
            print("EMAIL ERROR:", e)

        return {
            "message": "User Created Successfully",
            "user_id": new_user.user_id
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# Get All Users
@router.get("/users")
def get_users(
    Team_Leader_id: Optional[int] = Query(None),
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get current user
    current_user = db.query(User).filter(User.user_id == current_user_id).first()
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    query = db.query(User)

    # Role-based hierarchy filtering
    if current_user.role_id in [1, 2]:
        # Master Admin and Admin can view all users
        pass  # No filtering needed
    elif current_user.role_id == 3:
        # Team Leader can see users under them (Franchise Partners and their employees)
        # Get all Franchise Partners (role 4) under this Team Leader
        franchise_partners = db.query(User).filter(
            User.Team_Leader_id == current_user.user_id,
            User.role_id == 4
        ).all()
        
        # Get Franchise Partner IDs
        franchise_partner_ids = [fp.user_id for fp in franchise_partners]
        
        # Also include the Franchise Partners themselves
        query = query.filter(
            (User.Team_Leader_id == current_user.user_id) |  # Franchise Partners
            (User.reporting_manager.in_([fp.full_name for fp in franchise_partners]))  # Franchise Employees
        )
    elif current_user.role_id == 4:
        # Franchise Partner can see themselves and their Franchise Employees
        # Get Franchise Employees (role 5) where this Franchise Partner is the reporting manager
        query = query.filter(
            (User.user_id == current_user.user_id) |  # Themselves
            (User.reporting_manager == current_user.full_name)  # Their employees (role 5)
        )
    else:
        # Other roles (5, 6, 7) cannot view user directory
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to view user directory"
        )

    # Additional filter by Team_Leader_id if provided (for Admin filtering)
    if Team_Leader_id and current_user.role_id in [1, 2]:
        query = query.filter(User.Team_Leader_id == Team_Leader_id)

    users = query.all()

    # Self-join to get reporting manager name and team leader name
    result = []
    for user in users:
        team_leader_name = None
        if user.Team_Leader_id:
            team_leader = db.query(User).filter(
                User.user_id == user.Team_Leader_id
            ).first()
            if team_leader:
                team_leader_name = team_leader.full_name

        result.append({
            "user_id": user.user_id,
            "full_name": user.full_name,
            "email": user.email,
            "city": user.city,
            "reporting_manager": user.reporting_manager,
            "Team_Leader_id": user.Team_Leader_id,
            "role_id": user.role_id,
            "date_of_joining": user.date_of_joining,
            "is_active": user.is_active,
            "last_login": user.last_login
        })

    return result


# Get Single User
@router.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Get reporting manager name
    reporting_manager_name = user.reporting_manager

    # Get team leader name
    team_leader_name = None
    if user.Team_Leader_id:
        team_leader = db.query(User).filter(
            User.user_id == user.Team_Leader_id
        ).first()
        if team_leader:
            team_leader_name = team_leader.full_name

    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "city": user.city,
        "reporting_manager": user.reporting_manager,
        "Team_Leader_id": user.Team_Leader_id,
        "role_id": user.role_id,
        "date_of_joining": user.date_of_joining,
        "is_active": user.is_active,
        "last_login": user.last_login
    }


# Update User
@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_update: UserUpdate,
    request: Request,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None)
):
    # Authorization: Only Master Admin (1) and Admin (2) can update users
    current_user = db.query(User).filter(User.user_id == current_user_id).first()
    if not current_user or current_user.role_id not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin and Admin can update users"
        )
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Capture old values for audit log
    old_values = {
        "full_name": user.full_name,
        "email": user.email,
        "city": user.city,
        "reporting_manager": user.reporting_manager,
        "role_id": user.role_id,
        "is_active": user.is_active
    }

    update_data = user_update.dict(exclude_unset=True)

    new_email = update_data.get("email")

    if new_email and new_email != user.email:
        existing_user = db.query(User).filter(
            User.email == new_email,
            User.user_id != user_id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

    # Validate Team_Leader_id if provided
    if "Team_Leader_id" in update_data and update_data["Team_Leader_id"]:
        team_leader = db.query(User).filter(
            User.user_id == update_data["Team_Leader_id"],
            User.role_id == 3,
            User.is_active == True
        ).first()

        if not team_leader:
            raise HTTPException(
                status_code=400,
                detail="Invalid Team Leader ID or Team Leader is not active"
            )

    try:
        password = update_data.pop("password", None)

        if password:
            user.password_hash = hash_password(password)

        for field, value in update_data.items():
            setattr(user, field, value)

        db.commit()
        db.refresh(user)

        # Create audit log
        create_audit_log(
            db=db,
            request=request,
            actor_id=actor_id,
            actor_name=actor_name,
            action="user_updated",
            entity_type="user",
            entity_id=user.user_id,
            message=f"Updated user: {user.full_name}",
            metadata={
                "user_id": int(user.user_id) if user.user_id else None,
                "old_values": {
                    "full_name": str(old_values.get("full_name")) if old_values.get("full_name") else None,
                    "email": str(old_values.get("email")) if old_values.get("email") else None,
                    "city": str(old_values.get("city")) if old_values.get("city") else None,
                    "reporting_manager": str(old_values.get("reporting_manager")) if old_values.get("reporting_manager") else None,
                    "role_id": int(old_values.get("role_id")) if old_values.get("role_id") else None,
                    "is_active": bool(old_values.get("is_active")) if old_values.get("is_active") is not None else None
                },
                "changes": {k: str(v) if not isinstance(v, (int, bool, type(None))) else v for k, v in update_data.items()}
            }
        )

        return {
            "message": "User Updated Successfully",
            "user_id": user.user_id
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# Get Inactive Users
@router.get("/inactive-users")
def get_inactive_users(
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(
        User.is_active == False
    ).all()

    return [
        {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "email": user.email,
            "city": user.city,
            "reporting_manager": user.reporting_manager,
            "role_id": user.role_id,
            "date_of_joining": user.date_of_joining,
            "is_active": user.is_active,
            "last_login": user.last_login
        }
        for user in users
    ]


# Activate User
@router.put("/users/{user_id}/activate")
def activate_user(
    user_id: int,
    request: Request,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None)
):
    # Authorization: Only Master Admin (1) and Admin (2) can activate users
    current_user = db.query(User).filter(User.user_id == current_user_id).first()
    if not current_user or current_user.role_id not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin and Admin can activate users"
        )
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = True

    db.commit()

    # Create audit log
    create_audit_log(
        db=db,
        request=request,
        actor_id=actor_id,
        actor_name=actor_name,
        action="user_activated",
        entity_type="user",
        entity_id=user.user_id,
        message=f"Activated user: {user.full_name}",
        metadata={
            "user_id": user.user_id,
            "full_name": user.full_name,
            "email": user.email
        }
    )

    return {
        "message": "User activated successfully"
    }


# Deactivate User
@router.put("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    request: Request,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None)
):
    # Authorization: Only Master Admin (1) and Admin (2) can deactivate users
    current_user = db.query(User).filter(User.user_id == current_user_id).first()
    if not current_user or current_user.role_id not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin and Admin can deactivate users"
        )
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = False

    db.commit()

    # Create audit log
    create_audit_log(
        db=db,
        request=request,
        actor_id=actor_id,
        actor_name=actor_name,
        action="user_deactivated",
        entity_type="user",
        entity_id=user.user_id,
        message=f"Deactivated user: {user.full_name}",
        metadata={
            "user_id": user.user_id,
            "full_name": user.full_name,
            "email": user.email
        }
    )

    return {
        "message": "User deactivated successfully"
    }


# Delete User
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    request: Request,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None)
):
    # Authorization: Only Master Admin (1) and Admin (2) can delete users
    current_user = db.query(User).filter(User.user_id == current_user_id).first()
    if not current_user or current_user.role_id not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin and Admin can delete users"
        )
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Capture user details before deletion
    user_details = {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "role_id": user.role_id
    }

    db.delete(user)
    db.commit()

    # Create audit log
    create_audit_log(
        db=db,
        request=request,
        actor_id=actor_id,
        actor_name=actor_name,
        action="user_deleted",
        entity_type="user",
        entity_id=user_id,
        message=f"Deleted user: {user_details['full_name']}",
        metadata=user_details
    )

    return {
        "message": "User Deleted Successfully"
    }


# Get User Profile by User ID
@router.get("/profile/{user_id}")
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return UserProfileResponse(
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        city=user.city,
        reporting_manager=user.reporting_manager,
        Team_Leader_id=user.Team_Leader_id,
        team_leader_name=None,
        role_id=user.role_id,
        date_of_joining=user.date_of_joining,
        created_at=user.created_at,
        is_active=user.is_active,
        last_login=user.last_login,
        curos=user.curos
    )


# Manual Program Completion
@router.post("/users/{user_id}/complete-program/{program_id}")
def manually_complete_program(
    user_id: int,
    program_id: int,
    request: Request,
    current_user_id: int = Depends(get_current_user),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Manually mark a program as complete for a user.
    This will:
    1. Mark all modules as completed
    2. Mark retention quiz as completed
    3. Mark application checks 1-3 as completed
    4. Mark the program as completed
    5. Grant program curos to the user
    """
    # Authorization: Only Master Admin (1) and Admin (2) can manually complete programs
    current_user = db.query(User).filter(User.user_id == current_user_id).first()
    if not current_user or current_user.role_id not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin and Admin can manually complete programs"
        )

    # Verify the target user exists
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Verify the program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(
            status_code=404,
            detail="Program not found"
        )

    # Get all modules in the program
    modules = db.query(Module).filter(Module.program_id == program_id).all()
    if not modules:
        raise HTTPException(
            status_code=400,
            detail="Program has no modules"
        )

    try:
        # 1. Mark all modules as completed
        for module in modules:
            # Check if module completion already exists
            existing_completion = db.query(ModuleCompletion).filter(
                ModuleCompletion.user_id == user_id,
                ModuleCompletion.module_id == module.id,
                ModuleCompletion.program_id == program_id
            ).first()

            if not existing_completion:
                # Create module completion
                module_completion = ModuleCompletion(
                    user_id=user_id,
                    module_id=module.id,
                    program_id=program_id,
                    is_completed=True,
                    completed_at=datetime.utcnow()
                )
                db.add(module_completion)

        # 2. Mark all videos in the program as completed
        for module in modules:
            # Get all videos in this module
            videos = db.query(Video).filter(Video.module_id == module.id).all()
            for video in videos:
                # Check if video completion already exists
                existing_video_completion = db.query(VideoCompletion).filter(
                    VideoCompletion.user_id == user_id,
                    VideoCompletion.video_id == video.id
                ).first()

                if not existing_video_completion:
                    # Create video completion
                    video_completion = VideoCompletion(
                        user_id=user_id,
                        video_id=video.id,
                        is_completed=True,
                        completed_at=datetime.utcnow()
                    )
                    db.add(video_completion)

        # 3. Mark all quizzes in the program as completed (passed)
        for module in modules:
            # Get all quizzes in this module
            quizzes = db.query(Quiz).filter(Quiz.module_id == module.id).all()
            for quiz in quizzes:
                # Check if quiz attempt already exists
                existing_quiz_attempt = db.query(QuizAttempt).filter(
                    QuizAttempt.user_id == user_id,
                    QuizAttempt.quiz_id == quiz.id
                ).first()

                if not existing_quiz_attempt:
                    # Create quiz attempt as passed
                    quiz_attempt = QuizAttempt(
                        user_id=user_id,
                        quiz_id=quiz.id,
                        percentage=100,  # Perfect score
                        passed=True,
                        attempted_at=datetime.utcnow()
                    )
                    db.add(quiz_attempt)

        # 4. Mark retention quiz as completed (if exists for the program)
        # Assuming retention quiz is a specific quiz type or has a specific identifier
        # For now, we'll mark all quizzes as completed which covers retention quiz

        # 5. Mark application checks 1-3 as completed
        # Application checks are typically quiz types or specific modules
        # Since we're marking all quizzes and modules as completed, this is covered

        # 6. Update or create program progress as completed
        program_progress = db.query(UserProgramProgress).filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program_id
        ).first()

        if program_progress:
            program_progress.completed = True
            program_progress.completed_percentage = 100
            program_progress.status = "Completed"
            program_progress.completed_at = datetime.utcnow()
            program_progress.retention_quiz_unlocked_at = datetime.utcnow()
            program_progress.retention_quiz = True  # Mark retention quiz as completed
            program_progress.application_completed = True  # Mark application checks as completed
            program_progress.streak_completed = True  # Mark streak as completed
        else:
            program_progress = UserProgramProgress(
                user_id=user_id,
                program_id=program_id,
                completed=True,
                completed_percentage=100,
                status="Completed",
                completed_at=datetime.utcnow(),
                retention_quiz_unlocked_at=datetime.utcnow(),
                retention_quiz=True,  # Mark retention quiz as completed
                application_completed=True,  # Mark application checks as completed
                streak_completed=True  # Mark streak as completed
            )
            db.add(program_progress)

        # 7. Grant program curos to the user
        program_curos = program.curos if program.curos else 0
        if program_curos > 0:
            old_curos = target_user.curos or 0
            target_user.curos = old_curos + program_curos

        # Commit all changes
        db.commit()

        # Create audit log
        create_audit_log(
            db=db,
            request=request,
            actor_id=actor_id,
            actor_name=actor_name,
            action="program_manually_completed",
            entity_type="user_program_progress",
            entity_id=program_progress.id,
            message=f"Manually completed program '{program.name}' for user '{target_user.full_name}'",
            metadata={
                "user_id": user_id,
                "user_name": target_user.full_name,
                "program_id": program_id,
                "program_name": program.name,
                "curos_awarded": program_curos,
                "completed_by": current_user.full_name
            }
        )

        return {
            "message": "Program manually completed successfully",
            "user_id": user_id,
            "program_id": program_id,
            "program_name": program.name,
            "curos_awarded": program_curos,
            "completed_at": program_progress.completed_at
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to manually complete program: {str(e)}"
    )


# Manual Program Completion
@router.post("/users/{user_id}/complete-program/{program_id}")
def manually_complete_program(
    user_id: int,
    program_id: int,
    request: Request,
    current_user_id: int = Depends(get_current_user),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Manually mark a program as complete for a user.
    This will:
    1. Mark all modules as completed
    2. Mark retention quiz as completed
    3. Mark application checks 1-3 as completed
    4. Mark the program as completed
    5. Grant program curos to the user
    """
    # Authorization: Only Master Admin (1) and Admin (2) can manually complete programs
    current_user = db.query(User).filter(User.user_id == current_user_id).first()
    if not current_user or current_user.role_id not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="Only Master Admin and Admin can manually complete programs"
        )

    # Verify the target user exists
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Verify the program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(
            status_code=404,
            detail="Program not found"
        )

    # Get all modules in the program
    modules = db.query(Module).filter(Module.program_id == program_id).all()
    if not modules:
        raise HTTPException(
            status_code=400,
            detail="Program has no modules"
        )

    try:
        # 1. Mark all modules as completed
        for module in modules:
            # Check if module completion already exists
            existing_completion = db.query(ModuleCompletion).filter(
                ModuleCompletion.user_id == user_id,
                ModuleCompletion.module_id == module.id,
                ModuleCompletion.program_id == program_id
            ).first()

            if not existing_completion:
                # Create module completion
                module_completion = ModuleCompletion(
                    user_id=user_id,
                    module_id=module.id,
                    program_id=program_id,
                    is_completed=True,
                    completed_at=datetime.utcnow()
                )
                db.add(module_completion)

        # 2. Mark all videos in the program as completed
        for module in modules:
            # Get all videos in this module
            videos = db.query(Video).filter(Video.module_id == module.id).all()
            for video in videos:
                # Check if video completion already exists
                existing_video_completion = db.query(VideoCompletion).filter(
                    VideoCompletion.user_id == user_id,
                    VideoCompletion.video_id == video.id
                ).first()

                if not existing_video_completion:
                    # Create video completion
                    video_completion = VideoCompletion(
                        user_id=user_id,
                        video_id=video.id,
                        is_completed=True,
                        completed_at=datetime.utcnow()
                    )
                    db.add(video_completion)

        # 3. Mark all quizzes in the program as completed (passed)
        for module in modules:
            # Get all quizzes in this module
            quizzes = db.query(Quiz).filter(Quiz.module_id == module.id).all()
            for quiz in quizzes:
                # Check if quiz attempt already exists
                existing_quiz_attempt = db.query(QuizAttempt).filter(
                    QuizAttempt.user_id == user_id,
                    QuizAttempt.quiz_id == quiz.id
                ).first()

                if not existing_quiz_attempt:
                    # Create quiz attempt as passed
                    quiz_attempt = QuizAttempt(
                        user_id=user_id,
                        quiz_id=quiz.id,
                        percentage=100,  # Perfect score
                        passed=True,
                        attempted_at=datetime.utcnow()
                    )
                    db.add(quiz_attempt)

        # 4. Mark retention quiz as completed (if exists for the program)
        # Assuming retention quiz is a specific quiz type or has a specific identifier
        # For now, we'll mark all quizzes as completed which covers retention quiz

        # 5. Mark application checks 1-3 as completed
        # Application checks are typically quiz types or specific modules
        # Since we're marking all quizzes and modules as completed, this is covered

        # 6. Update or create program progress as completed
        program_progress = db.query(UserProgramProgress).filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program_id
        ).first()

        if program_progress:
            program_progress.completed = True
            program_progress.completed_percentage = 100
            program_progress.status = "Completed"
            program_progress.completed_at = datetime.utcnow()
            program_progress.retention_quiz_unlocked_at = datetime.utcnow()
            program_progress.retention_quiz = True  # Mark retention quiz as completed
            program_progress.application_completed = True  # Mark application checks as completed
            program_progress.streak_completed = True  # Mark streak as completed
        else:
            program_progress = UserProgramProgress(
                user_id=user_id,
                program_id=program_id,
                completed=True,
                completed_percentage=100,
                status="Completed",
                completed_at=datetime.utcnow(),
                retention_quiz_unlocked_at=datetime.utcnow(),
                retention_quiz=True,  # Mark retention quiz as completed
                application_completed=True,  # Mark application checks as completed
                streak_completed=True  # Mark streak as completed
            )
            db.add(program_progress)

        # 7. Calculate total curos to award (module curos + program curos)
        module_curos_total = sum((module.curos or 0) for module in modules)
        program_curos = program.curos if program.curos else 0
        total_curos_to_award = module_curos_total + program_curos

        # Grant total curos to the user
        if total_curos_to_award > 0:
            old_curos = target_user.curos or 0
            target_user.curos = old_curos + total_curos_to_award

        # Commit all changes
        db.commit()

        # Create audit log
        create_audit_log(
            db=db,
            request=request,
            actor_id=actor_id,
            actor_name=actor_name,
            action="program_manually_completed",
            entity_type="user_program_progress",
            entity_id=program_progress.id,
            message=f"Manually completed program '{program.name}' for user '{target_user.full_name}'",
            metadata={
                "user_id": user_id,
                "user_name": target_user.full_name,
                "program_id": program_id,
                "program_name": program.name,
                "module_curos_awarded": module_curos_total,
                "program_curos_awarded": program_curos,
                "total_curos_awarded": total_curos_to_award,
                "completed_by": current_user.full_name
            }
        )

        return {
            "message": "Program manually completed successfully",
            "user_id": user_id,
            "program_id": program_id,
            "program_name": program.name,
            "module_curos_awarded": module_curos_total,
            "program_curos_awarded": program_curos,
            "total_curos_awarded": total_curos_to_award,
            "completed_at": program_progress.completed_at
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to manually complete program: {str(e)}"
        )
