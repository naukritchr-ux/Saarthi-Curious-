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


# ─── Calendar Contacts for Guest Selection ────────────────────────────────────

_CONTACTS_CACHE = {"timestamp": 0.0, "data": []}
_CONTACTS_CACHE_TTL = 120.0

@router.get("/contacts")
def get_calendar_contacts(db: Session = Depends(get_db)):
    """
    Returns list of active system users to power guest search and autocomplete.
    Cached in memory for 2 minutes to eliminate repeated 1.3s database query latency.
    """
    import time
    now_ts = time.time()
    if _CONTACTS_CACHE["data"] and (now_ts - _CONTACTS_CACHE["timestamp"] < _CONTACTS_CACHE_TTL):
        return _CONTACTS_CACHE["data"]

    users = db.query(User).filter(User.is_active == True).all()
    results = []
    seen = set()
    for u in users:
        if u.email and u.email.strip().lower() not in seen:
            email_lower = u.email.strip().lower()
            seen.add(email_lower)
            results.append({
                "name": u.full_name or email_lower.split("@")[0],
                "email": email_lower,
                "role_id": u.role_id,
            })
    _CONTACTS_CACHE["timestamp"] = now_ts
    _CONTACTS_CACHE["data"] = results
    return results


# ─── Guest Availability Check ────────────────────────────────────────────────

class GuestAvailabilityRequest(BaseModel):
    guest_email: str
    date: str          # YYYY-MM-DD
    start_time: str    # HH:MM
    end_time: str      # HH:MM
    admin_id: Optional[int] = None


@router.post("/guest-availability")
def check_guest_availability(payload: GuestAvailabilityRequest, db: Session = Depends(get_db)):
    """
    Check if a guest email is free during the specified time window on a given date.
    Returns:
      - is_free: bool
      - busy_slots: list of {start, end} that are busy
      - free_slots: list of {start, end} free within 09:00–18:00 working hours
      - source: 'google' | 'db' | 'combined' | 'unknown'
    """
    from datetime import timedelta
    import re

    email = payload.guest_email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid guest email")

    try:
        check_date = date.fromisoformat(payload.date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    def time_to_minutes(t_str: str) -> int:
        """Convert HH:MM to minutes from midnight."""
        try:
            h, m = map(int, t_str[:5].split(":"))
            return h * 60 + m
        except Exception:
            return 0

    def minutes_to_hhmm(mins: int) -> str:
        h = mins // 60
        m = mins % 60
        return f"{h:02d}:{m:02d}"

    WORK_START = 9 * 60    # 09:00
    WORK_END   = 18 * 60   # 18:00

    req_start_min = time_to_minutes(payload.start_time)
    req_end_min   = time_to_minutes(payload.end_time)
    if req_end_min <= req_start_min:
        req_end_min = req_start_min + 30

    busy_slots = []
    source_flags = []

    # ── 1. Try Google Calendar freebusy for this guest ──
    token_row = (
        db.query(UserGoogleToken)
        .filter(
            UserGoogleToken.google_email.ilike(email),
            UserGoogleToken.refresh_token.isnot(None),
            UserGoogleToken.refresh_token != "pending_auth",
            UserGoogleToken.refresh_token != "",
        )
        .order_by(UserGoogleToken.updated_at.desc())
        .first()
    )

    if not token_row and payload.admin_id:
        token_row = (
            db.query(UserGoogleToken)
            .filter(
                UserGoogleToken.user_id == payload.admin_id,
                UserGoogleToken.refresh_token.isnot(None),
                UserGoogleToken.refresh_token != "pending_auth",
                UserGoogleToken.refresh_token != "",
            )
            .order_by(UserGoogleToken.updated_at.desc())
            .first()
        )

    if token_row and token_row.refresh_token:
        try:
            from services.google_calendar import _build_service
            service = _build_service(token_row.refresh_token)

            time_min = f"{payload.date}T00:00:00+05:30"
            time_max = f"{payload.date}T23:59:59+05:30"

            freebusy_body = {
                "timeMin": time_min,
                "timeMax": time_max,
                "timeZone": "Asia/Kolkata",
                "items": [{"id": email}]
            }
            result = service.freebusy().query(body=freebusy_body).execute()
            calendars = result.get("calendars", {})
            cal_info = calendars.get(email, {})
            google_busy = cal_info.get("busy", [])

            for slot in google_busy:
                s_str = slot.get("start", "")
                e_str = slot.get("end", "")
                s_hhmm = s_str[11:16] if len(s_str) > 15 else s_str
                e_hhmm = e_str[11:16] if len(e_str) > 15 else e_str
                busy_slots.append({"start": s_hhmm, "end": e_hhmm})
            if google_busy:
                source_flags.append("google")
        except Exception as ex:
            print(f"[guest-availability] Google freebusy notice for {email}: {ex}")

    # ── 2. Check Database Events & Tasks for this user ──
    from models import CalendarEvent, Task
    user_row = db.query(User).filter(User.email.ilike(email)).first()
    if user_row:
        # Check CalendarEvents where user is admin/owner
        db_events = db.query(CalendarEvent).filter(
            CalendarEvent.admin_id == user_row.user_id,
            CalendarEvent.date == check_date,
        ).all()
        for ev in db_events:
            if ev.start_time and ev.end_time:
                busy_slots.append({
                    "start": ev.start_time.strftime("%H:%M"),
                    "end": ev.end_time.strftime("%H:%M"),
                })
                source_flags.append("db")

        # Check Tasks
        db_tasks = db.query(Task).filter(
            Task.admin_id == user_row.user_id,
            Task.date == check_date,
        ).all()
        for t in db_tasks:
            if t.start_time and t.end_time:
                busy_slots.append({
                    "start": t.start_time.strftime("%H:%M"),
                    "end": t.end_time.strftime("%H:%M"),
                })
                source_flags.append("db")

    # Also check any CalendarEvents where this guest is mentioned in description
    shared_events = db.query(CalendarEvent).filter(
        CalendarEvent.date == check_date,
        CalendarEvent.description.ilike(f"%{email}%")
    ).all()
    for se in shared_events:
        if se.start_time and se.end_time:
            s_str = se.start_time.strftime("%H:%M")
            e_str = se.end_time.strftime("%H:%M")
            if not any(bs["start"] == s_str and bs["end"] == e_str for bs in busy_slots):
                busy_slots.append({"start": s_str, "end": e_str})
                source_flags.append("db")

    # ── 3. Determine Overlap ──
    is_free = True
    for bs in busy_slots:
        bs_start = time_to_minutes(bs["start"])
        bs_end   = time_to_minutes(bs["end"])
        if bs_start < req_end_min and bs_end > req_start_min:
            is_free = False
            break

    # ── 4. Compute Free Slots in 09:00–18:00 Working Hours ──
    busy_ranges = []
    for bs in busy_slots:
        bs_start = max(time_to_minutes(bs["start"]), WORK_START)
        bs_end   = min(time_to_minutes(bs["end"]), WORK_END)
        if bs_end > bs_start:
            busy_ranges.append((bs_start, bs_end))

    busy_ranges.sort()
    merged = []
    for rng in busy_ranges:
        if merged and rng[0] <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], rng[1]))
        else:
            merged.append(list(rng))

    # Requested meeting duration (default 30 mins)
    desired_duration = max(30, req_end_min - req_start_min)

    free_slots = []
    cursor = WORK_START
    for b_start, b_end in merged:
        gap = b_start - cursor
        if gap >= 30:
            # Generate 30m / desired_duration step pills within this gap
            step_cursor = cursor
            while step_cursor + 30 <= b_start:
                slot_end = min(step_cursor + desired_duration, b_start)
                free_slots.append({
                    "start": minutes_to_hhmm(step_cursor),
                    "end": minutes_to_hhmm(slot_end),
                })
                step_cursor += 30
        cursor = max(cursor, b_end)

    if cursor <= WORK_END - 30:
        step_cursor = cursor
        while step_cursor + 30 <= WORK_END:
            slot_end = min(step_cursor + desired_duration, WORK_END)
            free_slots.append({
                "start": minutes_to_hhmm(step_cursor),
                "end": minutes_to_hhmm(slot_end),
            })
            step_cursor += 30

    # Limit to unique reasonable free slots (max 8)
    seen_slots = set()
    unique_free_slots = []
    for fs in free_slots:
        key = f"{fs['start']}-{fs['end']}"
        if key not in seen_slots:
            seen_slots.add(key)
            unique_free_slots.append(fs)
        if len(unique_free_slots) >= 8:
            break

    source = "+".join(sorted(set(source_flags))) if source_flags else "db"

    return {
        "guest_email": email,
        "date": payload.date,
        "requested_slot": {"start": payload.start_time, "end": payload.end_time},
        "is_free": is_free,
        "busy_slots": busy_slots,
        "free_slots": unique_free_slots,
        "working_hours": "09:00 - 18:00",
        "source": source,
    }