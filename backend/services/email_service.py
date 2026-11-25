from __future__ import annotations

import json
import os
import smtplib
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, Optional


def _build_branded_html(
    *,
    badge_label: str,
    heading: str,
    body_text: str,
    cta_label: Optional[str] = None,
    cta_url: Optional[str] = None,
    footer_note: str = "Saarthi Curious LMS • Automated Learning Operations",
) -> str:
    cta_block = ""
    if cta_label and cta_url:
        cta_block = f"""
        <div style="margin:24px 0;">
          <a href="{cta_url}" style="display:inline-block;padding:12px 24px;border-radius:12px;
             background:linear-gradient(180deg,#FEF08A 0%,#EAB308 60%,#B45309 100%);
             color:#120B03;font-weight:800;font-size:13px;text-decoration:none;">
            {cta_label}
          </a>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:24px;background:#07060F;font-family:Inter,Segoe UI,Arial,sans-serif;color:#F8FAFC;">
        <div style="max-width:560px;margin:0 auto;background:#110E21;border:1.5px solid #D4A137;border-radius:20px;overflow:hidden;">
          <div style="padding:20px 26px;background:linear-gradient(120deg,#1B1433,#0E0B1A);border-bottom:1px solid rgba(250,204,21,0.25);">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:rgba(245,158,11,0.2);
                         border:1px solid rgba(251,191,36,0.5);color:#FDE68A;font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">
              {badge_label}
            </span>
            <h1 style="margin:12px 0 0;font-size:20px;line-height:1.3;color:#FFFFFF;">{heading}</h1>
          </div>
          <div style="padding:24px 26px;font-size:14px;line-height:1.65;color:#E2E8F0;">
            <p style="margin:0;">{body_text}</p>
            {cta_block}
          </div>
          <div style="padding:14px 26px;background:#090812;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#94A3B8;">
            {footer_note}
          </div>
        </div>
      </body>
    </html>
    """


def send_email(
    *,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Priority cascade:
      1. Resend API (RESEND_API_KEY)
      2. SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS)
      3. Deterministic Log-Only Sandbox (never crashes)
    """
    if not to_email or "@" not in to_email:
        return {"delivered": False, "provider": "skipped", "reason": "Missing valid recipient email"}

    from_email = os.getenv("EMAIL_FROM", "Saarthi Curious <onboarding@resend.dev>")
    final_html = html_body or _build_branded_html(
        badge_label="SAARTHI TELEMETRY",
        heading=subject,
        body_text=text_body,
    )

    # 1. Resend API
    resend_key = os.getenv("RESEND_API_KEY", "").strip()
    if resend_key:
        try:
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps(
                    {
                        "from": from_email,
                        "to": [to_email],
                        "subject": subject,
                        "html": final_html,
                        "text": text_body,
                    }
                ).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                return {"delivered": True, "provider": "resend", "message_id": body.get("id")}
        except Exception as exc:
            last_err = str(exc)
    else:
        last_err = None

    # 2. Standard SMTP (Gmail / Zoho / Outlook)
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))

    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_user
            msg["To"] = to_email
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
            msg.attach(MIMEText(final_html, "html", "utf-8"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [to_email], msg.as_string())
            return {"delivered": True, "provider": "smtp"}
        except Exception as exc:
            last_err = str(exc)

    # 3. Deterministic Sandbox Fallback
    return {
        "delivered": False,
        "provider": "sandbox_fallback",
        "reason": last_err or "No RESEND_API_KEY or SMTP credentials set (logged safely)",
    }


def send_nudge_email(
    *,
    to_email: str,
    learner_name: str,
    message: str,
    portal_url: Optional[str] = None,
) -> Dict[str, Any]:
    app_url = portal_url or os.getenv("FRONTEND_URL", "http://localhost:5173/programs")
    first_name = (learner_name or "Learner").split()[0]
    subject = f"Quick Learning Check-In for {first_name} (+50 Curos Waiting)"
    html = _build_branded_html(
        badge_label="STREAK & PROGRESS NUDGE",
        heading=f"Keep Your Momentum Going, {first_name}",
        body_text=message,
        cta_label="Resume Your Track →",
        cta_url=app_url,
    )
    return send_email(
        to_email=to_email,
        subject=subject,
        text_body=message,
        html_body=html,
    )


def send_meeting_invite_email(
    *,
    to_email: str,
    attendee_name: str,
    slot_label: str,
    agenda: str,
    meet_link: Optional[str] = None,
) -> Dict[str, Any]:
    first_name = (attendee_name or "Learner").split()[0]
    subject = f"15-Min Coaching Session Scheduled: {slot_label}"
    body = (
        f"Hi {first_name}, a 15-minute learning & progress coaching session has been booked "
        f"for <strong>{slot_label}</strong>.<br/><br/><strong>Agenda:</strong> {agenda}"
    )
    html = _build_branded_html(
        badge_label="COACHING SESSION CONFIRMED",
        heading=f"Coaching Call • {slot_label}",
        body_text=body,
        cta_label="Join Google Meet" if meet_link else None,
        cta_url=meet_link,
    )
    return send_email(
        to_email=to_email,
        subject=subject,
        text_body=f"Coaching session scheduled for {slot_label}. Agenda: {agenda}. Link: {meet_link or 'TBD'}",
        html_body=html,
    )

