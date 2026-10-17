from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, time
from typing import Optional
from pydantic import BaseModel

from database import get_db
from models import CalendarEvent, UserGoogleToken, User
from services.google_calendar import (
    create_google_meet_event,
    delete_google_event,
)

router = APIRouter(prefix="/calendar", tags=["Calendar Events"])


class CalendarEventRequest(BaseModel):
    admin_id: int
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

    # Sync to Google Calendar
    token_row = (
        db.query(UserGoogleToken)
        .filter(UserGoogleToken.user_id == request.admin_id)
        .first()
    )
    if request.add_meet and token_row and token_row.refresh_token:
        try:
            start_dt = datetime.combine(event_date, start)
            end_dt = datetime.combine(event_date, end)
            
            attendee_list = []
            if admin.email:
                attendee_list.append(admin.email)
            
            # Add the custom emails typed by the user
            if request.attendee_emails:
                for email in request.attendee_emails:
                    if email and email not in attendee_list:
                        attendee_list.append(email)

            result = create_google_meet_event(
                title=request.title,
                start_datetime=start_dt,
                end_datetime=end_dt,
                refresh_token=token_row.refresh_token,
                attendees=attendee_list,  # <-- Pass the combined list
                description=request.description or request.title,
            )
            ev.google_event_id = result.get("event_id")
            print(f"[calendar-events] Synced to Google Calendar: {ev.google_event_id}")
        except Exception as e:
            print(f"[calendar-events] Google sync failed: {e}")
    else:
        print(f"[calendar-events] add_meet={request.add_meet}, skipping Google Calendar sync.")

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
            .filter(UserGoogleToken.user_id == ev.admin_id)
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