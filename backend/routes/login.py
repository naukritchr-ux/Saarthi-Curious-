from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import User
from schemas import (
    LoginRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    ChangePasswordRequest
)
from auth import (
    verify_password,
    create_access_token,
    generate_otp,
    store_otp,
    verify_otp,
    clear_otp,
    hash_password,
    get_current_user
)
from email_service import (
    send_otp_email,
    send_login_otp_email
)

router = APIRouter()

@router.post("/login")
def login(
    request: LoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    print(f"\n{'=' * 60}\nLOGIN ATTEMPT\n{'=' * 60}")

    user = db.query(User).filter(User.email.ilike(request.email)).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid Email")

    # Check account status
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is inactive. Contact administrator."
        )

    # Check password
    password_match = verify_password(
        request.password,
        user.password_hash
    )

    if not password_match:
        raise HTTPException(status_code=401, detail="Invalid Password")

    # Generate OTP for login
    otp = generate_otp()

    # Store OTP for 10 minutes
    store_otp(request.email, otp, "login")

    # Queue email sending in the background so login responds instantly.
    background_tasks.add_task(
        send_login_otp_email,
        request.email,
        otp
    )

    print(f"Queued login OTP email for {request.email}")

    return {
        "message": "OTP sent successfully",
        "otp_required": True
    }


@router.post("/send-otp")
def send_otp(request: SendOTPRequest, db: Session = Depends(get_db)):
    """Send OTP to user's email for password reset"""
    print(f"\n{'=' * 60}\nSEND OTP REQUEST\n{'=' * 60}")

    # Check if user exists
    user = db.query(User).filter(User.email.ilike(request.email)).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive. Contact administrator.")

    # Generate and store OTP
    otp = generate_otp()
    store_otp(request.email, otp, "reset_password")

    # Send OTP email
    try:
        send_otp_email(request.email, otp)
        print(f"OTP sent to {request.email}: {otp}")
        return {"message": "OTP sent successfully"}
    except Exception as e:
        print(f"FAILED TO SEND OTP EMAIL: {repr(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-otp")
def verify_otp_endpoint(request: VerifyOTPRequest):
    """Verify OTP for password reset"""
    print(f"\n{'=' * 60}\nVERIFY OTP REQUEST\n{'=' * 60}")

    is_valid = verify_otp(
        request.email,
        request.otp,
        "reset_password"
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    return {"message": "OTP verified successfully"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset user password after OTP verification"""
    print(f"\n{'=' * 60}\nRESET PASSWORD REQUEST\n{'=' * 60}")

    # Verify OTP first
    is_valid = verify_otp(
        request.email,
        request.otp,
        "reset_password"
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Find user
    user = db.query(User).filter(User.email.ilike(request.email)).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash new password
    new_password_hash = hash_password(request.new_password)

    # Update password
    user.password_hash = new_password_hash
    db.commit()

    # Clear OTP
    clear_otp(
        request.email,
        "reset_password"
    )

    print(f"Password reset successful for {request.email}")
    return {"message": "Password reset successful"}

@router.post("/verify-login-otp")
def verify_login_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    print(f"\n{'=' * 60}\nVERIFY LOGIN OTP\n{'=' * 60}")

    # Verify OTP
    is_valid = verify_otp(
        request.email,
        request.otp,
        "login"
    )

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP"
        )

    # Find user
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is inactive. Contact administrator."
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create login token
    token = create_access_token({
        "user_id": user.user_id
    })

    # Clear OTP after successful login
    clear_otp(
        request.email,
        "login"
    )

    print(f"Login successful for {request.email}")

    return {
        "message": "Login Successful",
        "access_token": token,
        "user_id": user.user_id,
        "role_id": user.role_id,
        "name": user.full_name
    }

@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find currently logged-in user
    user = db.query(User).filter(
        User.user_id == current_user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Verify current password
    if not verify_password(
        request.current_password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    # Prevent using same password
    if request.current_password == request.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password cannot be the same as current password"
        )

    # Hash and update new password
    user.password_hash = hash_password(
        request.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully"
    }

@router.get("/test")
def test_route():
    return {"message": "Login router is working!"}