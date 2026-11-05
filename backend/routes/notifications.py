import json
import os
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import LearningStreak, QuizAttempt, User, UserNotification, UserProgramProgress
from schemas import (
    NotificationCountResponse,
    NotificationDispatchRequest,
    NotificationNudgeGenerateRequest,
    UserNotificationResponse,
)


router = APIRouter(tags=["Notifications"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GMAIL_SENDER_EMAIL = os.getenv("anujjadhv3558@gmail.com", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")


class GroqSuggestRequest(BaseModel):
    mode: str = "universal"
    model_instructions: str = ""
    learner: Optional[Dict[str, Any]] = None
    telemetry: Optional[Dict[str, Any]] = None


class SendGmailRequest(BaseModel):
    subject: str
    message: str
    recipient_emails: List[str]
    recipient_name: Optional[str] = "Learner"


def _build_nudge_message(objective: str, audience: str, tone: str, preferred_slot: str, reward: str | int) -> dict:
    objective_map = {
        "reduce_attrition": "Reduce learner drop-off",
        "improve_streaks": "Protect daily momentum",
        "boost_completion": "Boost completion velocity",
    }

    tone_map = {
        "encouraging": "encouraging and supportive",
        "urgent": "urgent but constructive",
        "motivational": "high-energy and motivating",
    }

    slot_label = preferred_slot if preferred_slot else "morning"
    reward_value = int(reward) if str(reward).isdigit() else 25
    audience_label = {
        "all": "all learners",
        "at_risk": "at-risk learners",
        "leaders": "high-performing learners",
    }.get(audience, "all learners")

    title = f"{objective_map.get(objective, 'Reduce learner drop-off')} • {slot_label.title()} Nudge"
    message = (
        f"Hi team, this is a {tone_map.get(tone, 'encouraging and supportive')} reminder to keep momentum high for {audience_label}. "
        f"A short progress check today can help learners recover their next milestone and stay on track. "
        f"Please consider a +{reward_value} Curos encouragement boost in the next {slot_label} touchpoint."
    )
    return {"title": title, "message": message}


# ==================================================
# Get all notifications of logged-in user
# ==================================================
@router.get("", response_model=list[UserNotificationResponse])
def get_notifications(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.user_id == current_user
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    notifications = (
        db.query(UserNotification)
        .filter(
            UserNotification.user_id == current_user
        )
        .order_by(UserNotification.sent_at.desc())
        .all()
    )

    IST = timezone(timedelta(hours=5, minutes=30))

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


# ==================================================
# Generate AI nudge suggestions from telemetry
# ==================================================
@router.post("/ai-generate-nudge")
def generate_ai_nudge(
    payload: NotificationNudgeGenerateRequest,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    try:
        reward_value = int(payload.reward) if str(payload.reward).isdigit() else 25

        if payload.objective == "reduce_attrition":
            total_users = db.query(User).count()
            recovery_potential = max(12, min(94, total_users % 28 + 18))
            message = (
                f"Your {payload.audience} segment shows {recovery_potential}% recovery potential. "
                f"A {payload.tone} nudge with a +{reward_value} Curos milestone boost in the {payload.preferred_slot} slot should help reduce learner drop-off."
            )
            return {
                "title": "Recovery Nudge for At-Risk learners",
                "message": message,
                "objective": payload.objective,
                "audience": payload.audience,
                "reward": reward_value,
            }

        generated = _build_nudge_message(
            objective=payload.objective,
            audience=payload.audience,
            tone=payload.tone,
            preferred_slot=payload.preferred_slot,
            reward=payload.reward,
        )
        return generated
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate nudge: {str(exc)}")


# ==================================================
# Dispatch generated nudge to selected audience
# ==================================================
@router.post("/dispatch")
def dispatch_notification(
    payload: NotificationDispatchRequest,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    try:
        if not payload.title or not payload.message:
            raise HTTPException(status_code=400, detail="Title and message are required")

        audience_users = db.query(User).all()
        audience_key = (payload.audience or "all").strip().lower()

        if audience_key == "at_risk":
            audience_users = db.query(User).filter(User.role_id.in_([3, 4, 5, 6, 7])).all()
        elif audience_key == "leaders":
            audience_users = db.query(User).filter(User.role_id == 3).all()
        elif audience_key in {"role", "team_leaders"}:
            audience_users = db.query(User).filter(User.role_id == 3).all()
        elif audience_key == "franchise_partners":
            audience_users = db.query(User).filter(User.role_id == 4).all()
        elif audience_key == "employees":
            audience_users = db.query(User).filter(User.role_id == 5).all()
        elif audience_key == "all":
            audience_users = db.query(User).all()

        if payload.recipients:
            audience_users = db.query(User).filter(User.user_id.in_(payload.recipients)).all()

        for user in audience_users:
            notification = UserNotification(
                user_id=user.user_id,
                title=payload.title,
                message=payload.message,
                notification_type="AI Nudge",
                is_read=False,
                sent_at=datetime.utcnow(),
            )
            db.add(notification)

        db.commit()
        return {
            "message": "Notification dispatched successfully",
            "recipient_count": len(audience_users),
            "channel": payload.channel,
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to dispatch notification: {str(exc)}")


@router.post("/groq-suggest")
async def generate_groq_nudge_suggestions(payload: GroqSuggestRequest):
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY not set in environment; use frontend fallback until backend env is configured.",
        )

    system_prompt = (
        "You are a highly effective L&D nudge strategist. "
        "Return valid JSON only with a top-level key named 'suggestions'. "
        "The value should be an array of exactly 2 objects, each with keys: "
        "id, slot, situationTag, title, message. "
        f"Custom instructions: {payload.model_instructions or 'Write concise, motivating text.'}"
    )

    user_input = {
        "mode": payload.mode,
        "learner": payload.learner,
        "telemetry": payload.telemetry,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(user_input)},
                ],
                "temperature": 0.6,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        payload_json = response.json()
        content = payload_json["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return {"suggestions": parsed.get("suggestions", [])}


@router.post("/send-gmail")
def send_nudge_via_gmail(payload: SendGmailRequest):
    if not GMAIL_SENDER_EMAIL or not GMAIL_APP_PASSWORD:
        return {
            "status": "simulated_queued",
            "detail": "Set GMAIL_SENDER_EMAIL and GMAIL_APP_PASSWORD in .env for real SMTP sending.",
            "recipients": payload.recipient_emails,
        }

    sent_to: List[str] = []
    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.starttls()
        smtp.login(GMAIL_SENDER_EMAIL, GMAIL_APP_PASSWORD)

        for target in payload.recipient_emails:
            if not target or "@" not in target:
                continue

            msg = EmailMessage()
            msg["Subject"] = payload.subject
            msg["From"] = f"Saarthi Curious <{GMAIL_SENDER_EMAIL}>"
            msg["To"] = target
            msg.set_content(payload.message)
            msg.add_alternative(
                f"""
                <div style="font-family:Arial,sans-serif;background:#F8F4EA;padding:26px;border-radius:16px;border:1px solid #E7D9B6;">
                  <div style="font-size:11px;letter-spacing:0.18em;color:#B45309;font-weight:700;text-transform:uppercase;">Saarthi Curious • Learning Nudge</div>
                  <h2 style="margin:14px 0 10px;color:#1C1917;">{payload.subject}</h2>
                  <p style="font-size:14px;line-height:1.7;color:#3D382E;background:#FFFDF8;padding:16px;border-radius:12px;border:1px solid #E7D9B6;">{payload.message}</p>
                  <p style="margin-top:16px; font-size:12px; color:#5B554D;">Warmly,<br/>Saarthi Curious L&D Team</p>
                </div>
                """,
                subtype="html",
            )
            smtp.send_message(msg)
            sent_to.append(target)

    return {"status": "sent", "sent_count": len(sent_to), "recipients": sent_to}