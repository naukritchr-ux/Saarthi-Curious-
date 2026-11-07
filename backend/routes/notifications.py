import os
import json
import smtplib
from email.message import EmailMessage
from datetime import datetime
from typing import List, Optional, Dict, Any

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import UserNotification, User
from schemas import (
    UserNotificationResponse,
    NotificationCountResponse,
)
from auth import get_current_user

load_dotenv()

router = APIRouter(tags=["Notifications"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def _get_active_smtp_config():
    """Reload environment and return sanitized SMTP credentials."""
    load_dotenv(override=True)
    sender_email = (
        os.getenv("GMAIL_SENDER_EMAIL")
        or os.getenv("GMAIL_USER")
        or os.getenv("SMTP_USERNAME")
        or os.getenv("SMTP_USER")
        or "anujjadhv3551@gmail.com"
    ).strip()
    app_password = (
        os.getenv("GMAIL_APP_PASSWORD")
        or os.getenv("SMTP_PASSWORD")
        or os.getenv("MAIL_PASSWORD")
        or ""
    ).replace(" ", "").strip()
    host = os.getenv("SMTP_HOST") or "smtp.gmail.com"
    try:
        port = int(os.getenv("SMTP_PORT") or "587")
    except ValueError:
        port = 587
    return sender_email, app_password, host, port


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================
class GroqSuggestRequest(BaseModel):
    mode: str = "universal"  # 'universal' | 'one_to_one'
    model_instructions: str = ""
    learner: Optional[Dict[str, Any]] = None
    telemetry: Optional[Dict[str, Any]] = None


class SendMailRequest(BaseModel):
    subject: str
    message: str
    recipient_emails: List[str]
    recipient_name: Optional[str] = "Learner"


class SmtpConfigRequest(BaseModel):
    sender_email: str
    app_password: str
    smtp_host: Optional[str] = "smtp.gmail.com"
    smtp_port: Optional[int] = 587


# Alias for backward compatibility
SendGmailRequest = SendMailRequest


# ============================================================================
# IN-APP NOTIFICATIONS (For Header NotificationBell.jsx)
# ============================================================================
@router.get("", response_model=list[UserNotificationResponse])
@router.get("/notifications", response_model=list[UserNotificationResponse])
def get_notifications(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notifications of logged-in user."""
    user = db.query(User).filter(
        (User.user_id == current_user) | (User.email == str(current_user))
    ).first()

    if not user:
        return []

    notifications = (
        db.query(UserNotification)
        .filter(UserNotification.user_id == user.user_id)
        .order_by(UserNotification.sent_at.desc())
        .limit(50)
        .all()
    )

    result = []
    for notif in notifications:
        result.append(
            UserNotificationResponse(
                notification_id=notif.notification_id,
                user_id=notif.user_id,
                title=notif.title,
                message=notif.message,
                is_read=notif.is_read,
                sent_at=notif.sent_at,
                source="saarthi_ai"
            )
        )
    return result


@router.get(
    "/unread-count",
    response_model=NotificationCountResponse
)
@router.get(
    "/notifications/unread-count",
    response_model=NotificationCountResponse
)
def unread_count(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications for the user."""
    user = db.query(User).filter(
        (User.user_id == current_user) | (User.email == str(current_user))
    ).first()

    if not user:
        return NotificationCountResponse(unread_count=0)

    count = (
        db.query(UserNotification)
        .filter(
            UserNotification.user_id == user.user_id,
            UserNotification.is_read == False
        )
        .count()
    )
    return NotificationCountResponse(unread_count=count)


@router.put("/{notification_id}/read")
@router.put("/notifications/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    user = db.query(User).filter(
        (User.user_id == current_user) | (User.email == str(current_user))
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    notification = (
        db.query(UserNotification)
        .filter(
            UserNotification.notification_id == notification_id,
            UserNotification.user_id == user.user_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.put("/mark-all-read")
@router.put("/notifications/mark-all-read")
def mark_all_read(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user."""
    user = db.query(User).filter(
        (User.user_id == current_user) | (User.email == str(current_user))
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(UserNotification).filter(
        UserNotification.user_id == user.user_id,
        UserNotification.is_read == False
    ).update({"is_read": True})

    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
@router.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification."""
    user = db.query(User).filter(
        (User.user_id == current_user) | (User.email == str(current_user))
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    notification = (
        db.query(UserNotification)
        .filter(
            UserNotification.notification_id == notification_id,
            UserNotification.user_id == user.user_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted successfully"}


# ============================================================================
# 1. AI ASSISTANCE SUGGESTIONS VIA GROQ
# ============================================================================
@router.post("/notifications/groq-suggest")
@router.post("/groq-suggest")
async def generate_ai_assistance_suggestions(payload: GroqSuggestRequest):
    """
    Analyzes live learner or cohort telemetry and returns 2 concise Morning & Evening
    nudge suggestions for the AI Assistance panel.
    """
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY not configured; using frontend fallback.",
        )

    system_prompt = (
        "You are Saarthi Curious AI Assistance. "
        f"Admin Instruction: {payload.model_instructions}\n"
        "Return ONLY valid JSON with key 'suggestions' containing a list of 2 objects: "
        "[{'id': '1', 'slot': 'morning', 'title': '...', 'message': '...'}, "
        "{'id': '2', 'slot': 'evening', 'title': '...', 'message': '...'}]"
    )

    user_context = (
        f"Mode: {payload.mode}\n"
        f"Selected Learner: {json.dumps(payload.learner)}\n"
        f"Cohort Telemetry: {json.dumps(payload.telemetry)}"
    )

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_context},
                ],
                "temperature": 0.6,
                "response_format": {"type": "json_object"},
            },
        )
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return {"suggestions": parsed.get("suggestions", [])}


# ============================================================================
# 2. SMTP GMAIL DISPATCHER & IN-APP NOTIFICATION RECORDER
# ============================================================================
@router.get("/notifications/smtp-status")
@router.get("/smtp-status")
def get_smtp_status():
    """Returns the current SMTP setup status (masked for security)."""
    sender, password, host, port = _get_active_smtp_config()
    is_configured = bool(sender and password)
    masked_pass = (
        f"{password[:2]}••••••••{password[-2:]}"
        if len(password) >= 4
        else ("••••••••" if password else "")
    )
    return {
        "configured": is_configured,
        "sender_email": sender or "anujjadhv3551@gmail.com",
        "has_password": bool(password),
        "masked_password": masked_pass,
        "host": host,
        "port": port,
    }


@router.post("/notifications/configure-smtp")
@router.post("/configure-smtp")
def configure_smtp(payload: SmtpConfigRequest):
    """
    Verifies and persists Gmail SMTP credentials directly to backend/.env.
    Performs a live test login against smtp.gmail.com:587 before saving.
    """
    clean_sender = payload.sender_email.strip()
    clean_pass = payload.app_password.replace(" ", "").strip()
    host = payload.smtp_host or "smtp.gmail.com"
    port = payload.smtp_port or 587

    if not clean_sender or "@" not in clean_sender:
        raise HTTPException(
            status_code=400,
            detail="A valid sender email address is required (e.g. anujjadhv3551@gmail.com).",
        )
    if not clean_pass:
        raise HTTPException(
            status_code=400,
            detail="Google App Password cannot be empty.",
        )

    # 1. Live authentication verification test
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=12) as test_server:
                test_server.login(clean_sender, clean_pass)
        else:
            with smtplib.SMTP(host, port, timeout=12) as test_server:
                test_server.starttls()
                test_server.login(clean_sender, clean_pass)
    except smtplib.SMTPAuthenticationError as auth_err:
        raise HTTPException(
            status_code=400,
            detail=f"Google rejected login: Username and password not accepted. Make sure you enable 2-Step Verification and use a 16-character App Password (https://myaccount.google.com/apppasswords). Details: {auth_err}",
        )
    except Exception as ex:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to connect to SMTP server {host}:{port}: {ex}",
        )

    # 2. Update current process environment
    os.environ["GMAIL_SENDER_EMAIL"] = clean_sender
    os.environ["GMAIL_USER"] = clean_sender
    os.environ["GMAIL_FROM_EMAIL"] = clean_sender
    os.environ["GMAIL_APP_PASSWORD"] = clean_pass
    os.environ["SMTP_HOST"] = host
    os.environ["SMTP_PORT"] = str(port)

    # 3. Persist to backend/.env file
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    try:
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()

            import re
            def _upsert(key: str, val: str, text: str) -> str:
                if re.search(rf"^{key}=.*$", text, flags=re.MULTILINE):
                    return re.sub(rf"^{key}=.*$", f"{key}={val}", text, flags=re.MULTILINE)
                return text + f"\n{key}={val}"

            content = _upsert("GMAIL_SENDER_EMAIL", clean_sender, content)
            content = _upsert("GMAIL_USER", clean_sender, content)
            content = _upsert("GMAIL_FROM_EMAIL", clean_sender, content)
            content = _upsert("GMAIL_APP_PASSWORD", clean_pass, content)
            content = _upsert("SMTP_HOST", host, content)
            content = _upsert("SMTP_PORT", str(port), content)

            with open(env_path, "w", encoding="utf-8") as f:
                f.write(content)
    except Exception as file_ex:
        print(f"Warning: could not write to .env file: {file_ex}")

    return {
        "status": "success",
        "message": f"Verified! Logged into {host} as {clean_sender}.",
        "sender_email": clean_sender,
    }


@router.post("/notifications/send-mail")
@router.post("/send-mail")
@router.post("/notifications/send-gmail")
@router.post("/send-gmail")
def send_notification_mail(payload: SendMailRequest, db: Session = Depends(get_db)):
    """
    Sends real HTML emails via Gmail SMTP (smtp.gmail.com:587) when 'Send Mail' is clicked.
    Also creates in-app UserNotification rows for matched users in Supabase.
    """
    sender_email, app_password, host, port = _get_active_smtp_config()

    # In-app notification creation for matched learners
    in_app_count = 0
    if db:
        for email_addr in payload.recipient_emails:
            if not email_addr or "@" not in email_addr:
                continue
            clean_email = email_addr.strip().lower()
            u = db.query(User).filter(func.lower(User.email) == clean_email).first()
            if u:
                try:
                    notif = UserNotification(
                        user_id=u.user_id,
                        title=payload.subject,
                        message=payload.message,
                        is_read=False,
                        sent_at=datetime.utcnow()
                    )
                    db.add(notif)
                    in_app_count += 1
                except Exception as ex:
                    print(f"Error recording UserNotification for {u.user_id}: {ex}")

        try:
            db.commit()
        except Exception:
            db.rollback()

    if not app_password:
        raise HTTPException(
            status_code=400,
            detail="Gmail App Password is not configured in backend/.env. Please enter your 16-character Google App Password in the setup dialog.",
        )

    sent_recipients = []
    effective_sender = sender_email or "anujjadhv3551@gmail.com"

    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=20)
        else:
            server = smtplib.SMTP(host, port, timeout=20)
            server.starttls()

        with server:
            server.login(effective_sender, app_password)

            for email_addr in payload.recipient_emails:
                if not email_addr or "@" not in email_addr:
                    continue

                msg = EmailMessage()
                msg["Subject"] = payload.subject
                msg["From"] = f"Saarthi Curious <{effective_sender}>"
                msg["To"] = email_addr
                msg.set_content(payload.message)
                msg.add_alternative(
                    f"""
                    <div style="font-family:sans-serif; background:#F8F4EA; padding:26px; border-radius:16px; color:#1C1917; border:1px solid #E5DEC9;">
                      <div style="font-size:11px; font-weight:800; letter-spacing:0.15em; color:#0284C7; text-transform:uppercase;">
                        Saarthi Curious • Learning Nudge
                      </div>
                      <h2 style="margin:10px 0 12px 0; color:#1C1917;">{payload.subject}</h2>
                      <p style="font-size:14px; line-height:1.6; color:#3F3A32; background:#FFFDF9; padding:16px; border-radius:12px; border:1px solid #E5DEC9;">
                        {payload.message}
                      </p>
                      <a href="http://localhost:5173" style="display:inline-block; margin-top:14px; padding:10px 20px; background:#0284C7; color:#FFFFFF; text-decoration:none; font-weight:800; font-size:12px; border-radius:10px;">
                        Continue Learning →
                      </a>
                    </div>
                    """,
                    subtype="html",
                )
                server.send_message(msg)
                sent_recipients.append(email_addr)

    except smtplib.SMTPAuthenticationError as auth_err:
        raise HTTPException(
            status_code=401,
            detail=f"Google rejected Gmail login. Please verify your 16-character App Password at https://myaccount.google.com/apppasswords ({auth_err})",
        )
    except Exception as ex:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to dispatch email via SMTP ({host}:{port}): {ex}",
        )

    return {
        "status": "sent",
        "sent_count": len(sent_recipients),
        "recipients": sent_recipients,
        "in_app_count": in_app_count,
    }
