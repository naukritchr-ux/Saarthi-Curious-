from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timezone, timedelta

from database import get_db
from models import UserNotification, User
from schemas import (
    UserNotificationResponse,
    NotificationCountResponse
)
from auth import get_current_user


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ==================================================
# Get all notifications of logged-in user
# ==================================================
@router.get("", response_model=list[UserNotificationResponse])
def get_notifications(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get logged-in user's details
    user = db.query(User).filter(
        User.user_id == current_user
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Get notifications belonging to the logged-in user
    notifications = (
        db.query(UserNotification)
        .filter(
            UserNotification.user_id == current_user
        )
        .order_by(UserNotification.sent_at.desc())
        .all()
    )

    IST = timezone(timedelta(hours=5, minutes=30))

    # Add role_id to every notification
    # so frontend knows whether the user is Admin or learner.
    return [
    {
        "id": notification.id,
        "user_id": notification.user_id,
        "script_id": notification.script_id,
        "program_id": notification.program_id,
        "title": notification.title,
        "message": notification.message,
        "is_read": notification.is_read,
        "sent_at": (
            notification.sent_at
            .replace(tzinfo=timezone.utc)
            .astimezone(IST)
            if notification.sent_at
            else None
        ),
        "role_id": user.role_id,
    }
    for notification in notifications
]


# ==================================================
# Get unread notification count
# ==================================================
@router.get(
    "/unread-count",
    response_model=NotificationCountResponse
)
def unread_count(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = (
        db.query(func.count(UserNotification.id))
        .filter(
            UserNotification.user_id == current_user,
            UserNotification.is_read == False
        )
        .scalar()
    )

    return {
        "unread": count
    }


# ==================================================
# Mark notification as read
# ==================================================
@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = (
        db.query(UserNotification)
        .filter(
            UserNotification.id == notification_id,
            UserNotification.user_id == current_user
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification marked as read"
    }


# ==================================================
# Mark all notifications as read
# ==================================================
@router.put("/mark-all-read")
def mark_all_read(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(UserNotification).filter(
        UserNotification.user_id == current_user,
        UserNotification.is_read == False
    ).update(
        {"is_read": True},
        synchronize_session=False
    )

    db.commit()

    return {
        "message": "All notifications marked as read"
    }


# ==================================================
# Delete notification
# ==================================================
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = (
        db.query(UserNotification)
        .filter(
            UserNotification.id == notification_id,
            UserNotification.user_id == current_user
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification deleted successfully"
    }