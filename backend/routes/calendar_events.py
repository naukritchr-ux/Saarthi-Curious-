from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, time
from typing import Optional, List
from pydantic import BaseModel

from database import get_db
from models import CalendarEvent, UserGoogleToken, User
from services.google_calendar import (
    create_google_meet_event,
    delete_google_event,
    update_google_calendar_event,
)

router = APIRouter(prefix="/calendar", tags=["Calendar Events"])


class CalendarEventRequest(BaseModel):
    admin_id: Optional[int] = 2
    title: str
    event_type: str = "custom"
    date: str            # "YYYY-MM-DD"
    start_time: Optional[str] = None   # "HH:MM" — required for meetings, optional for all-day
    end_time: Optional[str] = None
    all_day: bool = False
    description: Optional[str] = None
    add_meet: bool = True
    attendee_emails: list[str] = []  # <-- ADD THIS


@router.post("/events")
def create_event(request: CalendarEventRequest, db: Session = Depends(get_db)):
    """Create a calendar event (birthday, holiday, trip, custom). Syncs to Google Calendar."""
    try:
        event_date = date.fromisoformat(request.date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date. Use YYYY-MM-DD.")

    start = end = None
    all_day = request.all_day or (request.event_type in ("birthday", "holiday"))

    if not all_day:
        if not request.start_time or not request.end_time:
            raise HTTPException(status_code=400, detail="start_time and end_time are required.")
        try:
            sh, sm = map(int, request.start_time.split(":"))
            eh, em = map(int, request.end_time.split(":"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid time format.")
        if (eh, em) <= (sh, sm):
            raise HTTPException(status_code=400, detail="End must be after start.")
        start = time(sh, sm)
        end = time(eh, em)
    else:
        start = time(0, 0)
        end = time(23, 59)

    admin = db.query(User).filter(User.user_id == request.admin_id).first()
    if not admin:
        admin = db.query(User).filter(User.role_id.in_([1, 2])).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found.")

    ev = CalendarEvent(
        admin_id=request.admin_id,
        title=request.title,
        description=request.description,
        event_type=request.event_type,
        date=event_date,
        start_time=start,
        end_time=end,
        all_day=all_day,
    )
    db.add(ev)
    db.flush()

    # Sync to Google Calendar (only if this admin has their own token)
    token_row = (
        db.query(UserGoogleToken)
        .filter(
            UserGoogleToken.user_id == request.admin_id,
            UserGoogleToken.refresh_token.isnot(None),
            UserGoogleToken.refresh_token != "pending_auth",
            UserGoogleToken.refresh_token != "",
        )
        .order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc())
        .first()
    )

    meeting_link = None
    if token_row and token_row.refresh_token:
        try:
            start_dt = datetime.combine(event_date, start)
            end_dt = datetime.combine(event_date, end)
            
            attendee_list = []
            if admin and admin.email:
                attendee_list.append(admin.email)
            if token_row.google_email and token_row.google_email not in attendee_list:
                attendee_list.append(token_row.google_email)
            
            # Add custom guests typed by user
            if request.attendee_emails:
                for email in request.attendee_emails:
                    if email and email not in attendee_list:
                        attendee_list.append(email)

            result = create_google_meet_event(
                title=request.title,
                start_datetime=start_dt,
                end_datetime=end_dt,
                refresh_token=token_row.refresh_token,
                attendees=attendee_list,
                description=request.description or request.title,
            )
            ev.google_event_id = result.get("event_id")
            meeting_link = result.get("meeting_link")
            print(f"[calendar-events] Synced to Google Calendar ({token_row.google_email}): {ev.google_event_id}, Meet: {meeting_link}")
        except Exception as e:
            print(f"[calendar-events] Google sync failed: {e}")

    try:
        db.commit()
        db.refresh(ev)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Save failed: {e}")

    return {
        "id": ev.id,
        "title": ev.title,
        "event_type": ev.event_type,
        "date": ev.date.isoformat(),
        "start_time": ev.start_time.strftime("%H:%M") if ev.start_time else None,
        "end_time": ev.end_time.strftime("%H:%M") if ev.end_time else None,
        "all_day": ev.all_day,
        "google_event_id": ev.google_event_id,
        "meeting_link": meeting_link,
    }


@router.get("/events")
def list_events(
    month: str = Query(..., description="YYYY-MM"),
    admin_id: int = Query(...),
    db: Session = Depends(get_db),
):
    try:
        year, m = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format.")

    start_month = date(year, m, 1)
    next_month = date(year + 1, 1, 1) if m == 12 else date(year, m + 1, 1)

    rows = (
        db.query(CalendarEvent)
        .filter(
            CalendarEvent.admin_id == admin_id,
            CalendarEvent.date >= start_month,
            CalendarEvent.date < next_month,
        )
        .order_by(CalendarEvent.date, CalendarEvent.start_time)
        .all()
    )

    return [
        {
            "id": e.id,
            "title": e.title,
            "event_type": e.event_type,
            "date": e.date.isoformat(),
            "start_time": e.start_time.strftime("%H:%M") if e.start_time else None,
            "end_time": e.end_time.strftime("%H:%M") if e.end_time else None,
            "all_day": e.all_day,
            "google_event_id": e.google_event_id,
        }
        for e in rows
    ]


@router.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found.")

    if ev.google_event_id:
        token_row = (
            db.query(UserGoogleToken)
            .filter(
                UserGoogleToken.user_id == ev.admin_id,
                UserGoogleToken.refresh_token.isnot(None),
                UserGoogleToken.refresh_token != "pending_auth",
                UserGoogleToken.refresh_token != "",
            )
            .order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc())
            .first()
        )
        if token_row and token_row.refresh_token:
            try:
                delete_google_event(ev.google_event_id, token_row.refresh_token)
            except Exception as e:
                print(f"[calendar-events] Google delete failed: {e}")

    db.delete(ev)
    db.commit()
    return {"message": "Event deleted", "id": event_id}


class UpdateEventRequest(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    description: Optional[str] = None
    attendee_emails: Optional[List[str]] = None


@router.put("/events/{event_id}")
def update_event(event_id: int, request: UpdateEventRequest, db: Session = Depends(get_db)):
    """Update event in DB and synchronize update to Google Calendar."""
    ev = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found.")

    if request.title is not None and request.title.strip():
        ev.title = request.title.strip()
    if request.description is not None:
        ev.description = request.description
    if request.date:
        try:
            ev.date = date.fromisoformat(request.date)
        except Exception:
            pass
    if request.start_time:
        try:
            sh, sm = map(int, request.start_time.split(":")[:2])
            ev.start_time = time(sh, sm)
        except Exception:
            pass
    if request.end_time:
        try:
            eh, em = map(int, request.end_time.split(":")[:2])
            ev.end_time = time(eh, em)
        except Exception:
            pass

    # Sync update to Google Calendar if linked
    if ev.google_event_id:
        token_row = (
            db.query(UserGoogleToken)
            .filter(
                UserGoogleToken.user_id == ev.admin_id,
                UserGoogleToken.refresh_token.isnot(None),
                UserGoogleToken.refresh_token != "pending_auth",
                UserGoogleToken.refresh_token != "",
            )
            .order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc())
            .first()
        )
        if token_row and token_row.refresh_token:
            try:
                start_dt = datetime.combine(ev.date, ev.start_time or time(10, 0))
                end_dt = datetime.combine(ev.date, ev.end_time or time(11, 0))
                update_google_calendar_event(
                    event_id=ev.google_event_id,
                    refresh_token=token_row.refresh_token,
                    title=ev.title,
                    start_datetime=start_dt,
                    end_datetime=end_dt,
                    description=ev.description,
                    attendees=request.attendee_emails
                )
                print(f"[calendar-events] Synced event update to Google Calendar: {ev.google_event_id}")
            except Exception as e:
                print(f"[calendar-events] Google update notice: {e}")

    db.commit()
    db.refresh(ev)
    return {
        "id": ev.id,
        "title": ev.title,
        "date": ev.date.isoformat(),
        "start_time": ev.start_time.strftime("%H:%M") if ev.start_time else None,
        "end_time": ev.end_time.strftime("%H:%M") if ev.end_time else None,
        "google_event_id": ev.google_event_id
    }


@router.delete("/events/google/{google_event_id}")
def delete_google_calendar_event_endpoint(
    google_event_id: str,
    admin_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Delete an event from Google Calendar and clean up any local record."""
    ev = db.query(CalendarEvent).filter(CalendarEvent.google_event_id == google_event_id).first()
    effective_admin_id = admin_id or (ev.admin_id if ev else None)

    if effective_admin_id:
        token_row = (
            db.query(UserGoogleToken)
            .filter(
                UserGoogleToken.user_id == effective_admin_id,
                UserGoogleToken.refresh_token.isnot(None),
                UserGoogleToken.refresh_token != "pending_auth",
                UserGoogleToken.refresh_token != "",
            )
            .order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc())
            .first()
        )
        if token_row and token_row.refresh_token:
            try:
                delete_google_event(google_event_id, token_row.refresh_token)
                print(f"[calendar-events] Deleted Google Calendar event: {google_event_id}")
            except Exception as e:
                print(f"[calendar-events] Failed to delete from Google Calendar: {e}")

    if ev:
        db.delete(ev)
        db.commit()

    return {"message": "Google event deleted", "google_event_id": google_event_id}


class SendReminderRequest(BaseModel):
    admin_id: Optional[int] = None
    event_id: Optional[int] = None
    recipient_emails: Optional[List[str]] = None
    note: Optional[str] = None


@router.post("/send-reminders")
def send_calendar_reminders(
    payload: Optional[SendReminderRequest] = None,
    admin_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Sends automated meeting reminder emails via Gmail to attendees.
    """
    effective_admin_id = (payload.admin_id if payload else None) or admin_id
    if not effective_admin_id:
        raise HTTPException(status_code=400, detail="Admin ID is required to send reminders.")
    admin = db.query(User).filter(User.user_id == effective_admin_id).first()

    events = []
    if payload and payload.event_id:
        target = db.query(CalendarEvent).filter(CalendarEvent.id == payload.event_id).first()
        if target:
            events.append(target)

    if not events:
        today = date.today()
        events = (
            db.query(CalendarEvent)
            .filter(CalendarEvent.admin_id == effective_admin_id, CalendarEvent.date >= today)
            .order_by(CalendarEvent.date, CalendarEvent.start_time)
            .limit(3)
            .all()
        )

    token_row = (
        db.query(UserGoogleToken)
        .filter(
            UserGoogleToken.user_id == effective_admin_id,
            UserGoogleToken.refresh_token.isnot(None),
            UserGoogleToken.refresh_token != "pending_auth",
        )
        .order_by(UserGoogleToken.updated_at.desc())
        .first()
    )

    recipients_sent = []
    failed_recipients = []

    try:
        from email_service import send_email as gmail_send
    except Exception as ie:
        print(f"[send-reminders] Could not import email_service: {ie}")
        gmail_send = None

    google_service = None
    if token_row and token_row.refresh_token:
        try:
            from services.google_calendar import _build_service
            google_service = _build_service(token_row.refresh_token)
        except Exception as ge:
            print(f"[send-reminders] Could not build Google service: {ge}")

    for ev in events:
        if not ev:
            continue
        ev_title = ev.title or "Upcoming Schedule Sync"
        ev_date_str = ev.date.strftime("%A, %d %B %Y")
        ev_time_str = (
            f"{ev.start_time.strftime('%I:%M %p')} – {ev.end_time.strftime('%I:%M %p')}"
            if (ev.start_time and ev.end_time)
            else "10:00 AM – 11:00 AM"
        )

        # 1. Trigger Google Calendar notification email if event has google_event_id
        if google_service and ev.google_event_id:
            try:
                patch_res = google_service.events().patch(
                    calendarId='primary',
                    eventId=ev.google_event_id,
                    sendUpdates='all',
                    body={
                        "description": f"{ev.description or ''}\n\n[Reminder notification sent: {datetime.now().strftime('%Y-%m-%d %H:%M')}]"
                    }
                ).execute()
                for a in patch_res.get('attendees', []):
                    em = a.get('email')
                    if em:
                        recipients_sent.append(em)
                print(f"[send-reminders] Dispatched Google Calendar update to: {recipients_sent}")
            except Exception as e:
                print(f"[send-reminders] Google patch warning: {e}")

        targets = []
        if payload and payload.recipient_emails:
            targets.extend(payload.recipient_emails)
        if admin and admin.email and admin.email not in targets:
            targets.append(admin.email)
        if token_row and token_row.google_email and token_row.google_email not in targets:
            targets.append(token_row.google_email)

        html_body = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b0c10; color: #e2e8f0; padding: 24px; border-radius: 12px; max-width: 520px; border: 1px solid #1e293b;">
            <div style="margin-bottom: 16px;">
                <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">📅 Saarthi Calendar Reminder</h2>
            </div>
            <p style="font-size: 14px; color: #94a3b8; margin-top: 0;">You have an upcoming event scheduled on your calendar:</p>
            <div style="background-color: #13151f; border: 1px solid #334155; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0; font-size: 16px; font-weight: 600; color: #ffffff;">{ev_title}</p>
                <p style="margin: 6px 0; font-size: 13px; color: #93c5fd;"><strong>Date:</strong> {ev_date_str}</p>
                <p style="margin: 6px 0; font-size: 13px; color: #93c5fd;"><strong>Time:</strong> {ev_time_str}</p>
                {f'<p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;"><strong>Note:</strong> {payload.note}</p>' if (payload and payload.note) else ''}
            </div>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">This automated reminder was sent by Saarthi Scheduler Assistant.</p>
        </div>
        """

        for email in targets:
            if not email or "@" not in email:
                continue
            if email in recipients_sent:
                continue
            try:
                if gmail_send:
                    success = gmail_send(to_email=email, subject=f"Reminder: {ev_title} on {ev_date_str}", html=html_body)
                    if success:
                        recipients_sent.append(email)
            except Exception as e:
                print(f"[send-reminders] Direct email notice: {e}")

    return {
        "status": "success",
        "message": f"Reminders processed. Notified {len(recipients_sent)} recipients.",
        "sent_to": list(set(recipients_sent)),
        "failed": list(set(failed_recipients)),
    }