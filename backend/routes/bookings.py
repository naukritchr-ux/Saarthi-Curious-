from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date, datetime, time
from typing import Optional
from pydantic import BaseModel
import calendar

from services.google_calendar import (
    create_google_meet_event,
    reschedule_google_event,
    delete_google_event,
    fetch_google_events,
)
from database import get_db
from models import AdminSchedule, Booking, UserGoogleToken, User, Task, CalendarEvent


# ─────────────────────────────────────────────────────────────
# Schedule auto-generation
# ─────────────────────────────────────────────────────────────

def auto_generate_schedules(db: Session, admin_id: int = 2, months_to_generate: int = 3):
    today = datetime.now()
    current_month_str = today.strftime("%Y-%m")
    try:
        result = generate_schedule_internal(current_month_str, admin_id, months_to_generate, db)
        print(f"Auto-generated schedules: {result['slots_created']} slots for {result['months_generated']} months")
        return result
    except Exception as e:
        print(f"Error auto-generating schedules: {e}")
        return None


def auto_generate_schedules_wrapper():
    from database import SessionLocal
    db = SessionLocal()
    try:
        auto_generate_schedules(db, admin_id=2, months_to_generate=3)
    except Exception as e:
        print(f"Error in auto-generate schedules wrapper: {e}")
    finally:
        db.close()


def get_valid_admin_token(db: Session, admin_id: int):
    token = (
        db.query(UserGoogleToken)
        .filter(
            UserGoogleToken.user_id == admin_id,
            UserGoogleToken.refresh_token.isnot(None),
            UserGoogleToken.refresh_token != "pending_auth",
            UserGoogleToken.refresh_token != "",
        )
        .order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc())
        .first()
    )
    return token



def generate_schedule_internal(month: str, admin_id: int, months_ahead: int, db: Session):
    try:
        year, month_number = map(int, month.split("-"))
    except Exception:
        raise ValueError("Month format should be YYYY-MM")

    slots = [(time(10, 0), time(10, 15)), (time(14, 0), time(14, 15)), (time(16, 0), time(16, 15))]
    total_created = 0

    for offset in range(months_ahead):
        target_month = month_number + offset
        target_year = year
        while target_month > 12:
            target_month -= 12
            target_year += 1
        total_days = calendar.monthrange(target_year, target_month)[1]
        for day in range(1, total_days + 1):
            current_date = date(target_year, target_month, day)
            if current_date.weekday() >= 5:
                continue
            for start_time, end_time in slots:
                exists = (
                    db.query(AdminSchedule)
                    .filter(
                        AdminSchedule.admin_id == admin_id,
                        AdminSchedule.date == current_date,
                        AdminSchedule.start_time == start_time,
                    )
                    .first()
                )
                if exists:
                    continue
                schedule = AdminSchedule(
                    admin_id=admin_id,
                    date=current_date,
                    start_time=start_time,
                    end_time=end_time,
                    status="available",
                )
                db.add(schedule)
                total_created += 1
    db.commit()
    return {"slots_created": total_created, "months_generated": months_ahead}


# ─────────────────────────────────────────────────────────────
# Request models
# ─────────────────────────────────────────────────────────────

class BookingRequest(BaseModel):
    schedule_id: int
    user_id: int


class RescheduleRequest(BaseModel):
    source_date: date
    target_date: date


class SingleRescheduleRequest(BaseModel):
    new_schedule_id: int


class CancelRequest(BaseModel):
    reason: str = "Cancelled by admin"


class CustomBookingRequest(BaseModel):
    admin_id: int
    user_id: int
    date: str          # "YYYY-MM-DD"
    start_time: str    # "HH:MM" 24-hour
    end_time: str      # "HH:MM"
    title: Optional[str] = "Saarthi Curious - Meeting"
    description: Optional[str] = "Scheduled via Saarthi"
    add_meet: bool = True


router = APIRouter(prefix="/bookings", tags=["Bookings"])


# ─────────────────────────────────────────────────────────────
# POST /bookings/create-custom
# ─────────────────────────────────────────────────────────────

@router.post("/create-custom")
def create_custom_booking(
    request: CustomBookingRequest,
    db: Session = Depends(get_db),
):
    """
    Admin creates a meeting at an arbitrary time (not tied to pre-generated slots).
    """
    try:
        booking_date = date.fromisoformat(request.date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date. Use YYYY-MM-DD.")

    try:
        start_h, start_m = map(int, request.start_time.split(":"))
        end_h, end_m = map(int, request.end_time.split(":"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid time. Use HH:MM (24h).")

    if (end_h, end_m) <= (start_h, start_m):
        raise HTTPException(status_code=400, detail="End time must be after start time.")

    start_dt = datetime.combine(booking_date, time(start_h, start_m))
    end_dt = datetime.combine(booking_date, time(end_h, end_m))

    if start_dt < datetime.now():
        raise HTTPException(status_code=400, detail="Cannot book a time in the past.")

    # Conflict check
    overlapping = (
        db.query(AdminSchedule, Booking)
        .outerjoin(Booking, Booking.schedule_id == AdminSchedule.id)
        .filter(
            AdminSchedule.admin_id == request.admin_id,
            AdminSchedule.date == booking_date,
            Booking.id.isnot(None),
            Booking.booking_status.in_(["confirmed", "pending"]),
        )
        .all()
    )

    for sched, bk in overlapping:
        s = datetime.combine(sched.date, sched.start_time)
        e = datetime.combine(sched.date, sched.end_time)
        if start_dt < e and end_dt > s:
            raise HTTPException(
                status_code=400,
                detail=f"This time overlaps an existing booking ({sched.start_time.strftime('%H:%M')}–{sched.end_time.strftime('%H:%M')}).",
            )

    admin = db.query(User).filter(User.user_id == request.admin_id).first()
    learner = db.query(User).filter(User.user_id == request.user_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found.")
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found.")

    slot = AdminSchedule(
        admin_id=request.admin_id,
        date=booking_date,
        start_time=time(start_h, start_m),
        end_time=time(end_h, end_m),
        status="booked",
    )
    db.add(slot)
    db.flush()

    booking = Booking(
        schedule_id=slot.id,
        user_id=request.user_id,
        admin_id=request.admin_id,
        meeting_link=None,
        google_event_id=None,
        booking_status="confirmed",
    )
    db.add(booking)
    db.flush()

    # Google Calendar — both admin and learner get the invite
    host_token_row = get_valid_admin_token(db, request.admin_id)


    if host_token_row and host_token_row.refresh_token:
        try:
            attendees = []
            if admin and admin.email:
                attendees.append(admin.email)
            if learner and learner.email and learner.email != admin.email:
                attendees.append(learner.email)
            if host_token_row.google_email and host_token_row.google_email not in attendees:
                attendees.append(host_token_row.google_email)

            google_result = create_google_meet_event(
                title=request.title or f"Saarthi Curious - {learner.full_name if learner else 'Meeting'}",
                start_datetime=start_dt,
                end_datetime=end_dt,
                refresh_token=host_token_row.refresh_token,
                attendees=attendees,
                description=request.description or f"Meeting with {learner.full_name if learner else 'Attendee'}",
            )
            booking.meeting_link = google_result.get("meeting_link")
            booking.google_event_id = google_result.get("event_id")
            print(f"[create-custom] Google Calendar event created: {booking.google_event_id}")
        except Exception as e:
            print(f"[create-custom] Google Calendar error: {e}")
            booking.meeting_link = "Google Meet link will be provided later"

    try:
        db.commit()
        db.refresh(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Unable to save booking: {e}")

    return {
        "message": "Meeting created",
        "booking_id": booking.id,
        "slot_id": slot.id,
        "admin_id": booking.admin_id,
        "user_id": booking.user_id,
        "date": slot.date.isoformat(),
        "start_time": slot.start_time.strftime("%H:%M"),
        "end_time": slot.end_time.strftime("%H:%M"),
        "meeting_link": booking.meeting_link,
        "google_event_id": booking.google_event_id,
        "attendees": [u for u in [admin.email, learner.email] if u],
    }


@router.get("/test")
def test_booking_route():
    return {"message": "Booking API is working"}


@router.get("/schedule")
def get_schedule(
    month: str = Query(..., description="Month in YYYY-MM format"),
    admin_id: int = Query(..., description="Admin user ID"),
    db: Session = Depends(get_db),
):
    try:
        year, month_number = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM.")

    next_month = date(year + 1, 1, 1) if month_number == 12 else date(year, month_number + 1, 1)
    current_month = date(year, month_number, 1)

    schedules = (
        db.query(AdminSchedule)
        .filter(
            AdminSchedule.admin_id == admin_id,
            AdminSchedule.date >= current_month,
            AdminSchedule.date < next_month,
        )
        .order_by(AdminSchedule.date, AdminSchedule.start_time)
        .all()
    )

    return [
        {
            "id": slot.id,
            "admin_id": slot.admin_id,
            "date": slot.date.isoformat(),
            "start_time": slot.start_time.strftime("%H:%M"),
            "end_time": slot.end_time.strftime("%H:%M"),
            "status": slot.status,
        }
        for slot in schedules
    ]


# ─────────────────────────────────────────────────────────────
# GET /bookings/calendar  ← Unified Calendar Feed (Bookings + Tasks + Google + Events)
# ─────────────────────────────────────────────────────────────
@router.get("/calendar")
def get_calendar(
    month: str = Query(..., description="YYYY-MM"),
    admin_id: int = Query(...),
    device_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    import calendar as pycal
    try:
        year, month_num = map(int, month.split("-"))
    except Exception:
        today = date.today()
        year, month_num = today.year, today.month

    last_day = pycal.monthrange(year, month_num)[1]
    start_date = date(year, month_num, 1)
    end_date = date(year, month_num, last_day)

    unified_events = []

    # 1. FETCH ONLY REAL CONFIRMED/PENDING BOOKINGS (Never output empty unbooked slots)
    try:
        bookings = (
            db.query(AdminSchedule, Booking, User)
            .outerjoin(Booking, Booking.schedule_id == AdminSchedule.id)
            .outerjoin(User, User.user_id == Booking.user_id)
            .filter(
                AdminSchedule.admin_id == admin_id,
                AdminSchedule.date >= start_date,
                AdminSchedule.date <= end_date,
            )
            .all()
        )

        for sched, book, user in bookings:
            if book and book.booking_status in ["confirmed", "pending"]:
                user_name = user.full_name if user else "Booked Meeting"
                unified_events.append({
                    "id": f"book_{book.id}",
                    "title": f"Meeting: {user_name}",
                    "start": f"{sched.date.isoformat()}T{sched.start_time.isoformat()}",
                    "end": f"{sched.date.isoformat()}T{sched.end_time.isoformat()}",
                    "backgroundColor": "#8b5cf6" if book.booking_status == "confirmed" else "#f4c95d",
                    "source": "booking",
                    "extendedProps": {
                        "type": "meeting",
                        "time": f"{sched.start_time.strftime('%I:%M %p')} – {sched.end_time.strftime('%I:%M %p')}".replace(" 0", " "),
                        "attendees": 2,
                        "meeting_link": getattr(book, "meeting_link", None),
                        "status": book.booking_status,
                    },
                })
    except Exception as e:
        print(f"Error fetching bookings in /calendar: {e}")

    # 2. FETCH REAL DB TASKS
    try:
        tasks = (
            db.query(Task)
            .filter(
                Task.admin_id == admin_id,
                Task.date >= start_date,
                Task.date <= end_date,
            )
            .all()
        )
        for task in tasks:
            st = task.start_time.isoformat() if task.start_time else "09:00:00"
            et = task.end_time.isoformat() if task.end_time else "10:00:00"
            unified_events.append({
                "id": f"task_{task.id}",
                "title": task.title,
                "start": f"{task.date.isoformat()}T{st}",
                "end": f"{task.date.isoformat()}T{et}",
                "backgroundColor": "#10b981",
                "source": "task",
                "extendedProps": {
                    "type": "task",
                    "time": f"{st[:5]} – {et[:5]}",
                    "is_completed": getattr(task, "is_completed", False),
                },
            })
    except Exception as e:
        print(f"Error fetching tasks in /calendar: {e}")

    # 3. FETCH CALENDAR EVENTS
    try:
        events = (
            db.query(CalendarEvent)
            .filter(
                CalendarEvent.admin_id == admin_id,
                CalendarEvent.date >= start_date,
                CalendarEvent.date <= end_date,
            )
            .all()
        )
        for ev in events:
            st = ev.start_time.isoformat() if ev.start_time else "10:00:00"
            et = ev.end_time.isoformat() if ev.end_time else "11:00:00"
            color = "#6b21a8" if ev.event_type == "meeting" else ("#065f46" if ev.event_type == "holiday" else "#2563eb")
            unified_events.append({
                "id": f"calev_{ev.id}",
                "title": ev.title,
                "start": f"{ev.date.isoformat()}T{st}",
                "end": f"{ev.date.isoformat()}T{et}",
                "backgroundColor": color,
                "source": "calendar_event",
                "extendedProps": {
                    "type": ev.event_type or "meeting",
                    "time": f"{st[:5]} – {et[:5]}",
                    "attendees": 3,
                    "description": ev.description,
                },
            })
    except Exception as e:
        print(f"Error fetching calendar events in /calendar: {e}")

    # 4. FETCH REAL GOOGLE EVENTS (Strictly for this admin/user only)
    try:
        tokens = db.query(UserGoogleToken).filter(
            UserGoogleToken.user_id == admin_id,
            UserGoogleToken.refresh_token.isnot(None),
            UserGoogleToken.refresh_token != "pending_auth",
            UserGoogleToken.refresh_token != "",
        ).all()


        for tok in tokens:
            if tok and tok.refresh_token and tok.refresh_token != "pending_auth":
                try:
                    from services.google_calendar import fetch_google_events
                    for g_event in fetch_google_events(tok.refresh_token, month):
                        g_start = str(g_event.get("start", ""))[:16]
                        g_title = (g_event.get("title") or "").strip().lower()
                        # Deduplicate: Skip if an existing event in unified_events has same start time and title
                        is_dup = any(
                            str(u.get("start", ""))[:16] == g_start and (
                                g_title in u.get("title", "").strip().lower() or
                                u.get("title", "").strip().lower() in g_title
                            )
                            for u in unified_events
                        )
                        if not is_dup:
                            unified_events.append({
                                "id": f"gcal_{g_event.get('id', '')}",
                                "title": g_event.get("title", "Google Event"),
                                "start": g_event.get("start"),
                                "end": g_event.get("end"),
                                "backgroundColor": "#2563eb",
                                "source": "google_calendar",
                                "extendedProps": {
                                    "type": "meeting",
                                    "meeting_link": g_event.get("meeting_link"),
                                },
                            })
                except Exception as err:
                    print(f"Error fetching Google events: {err}")
    except Exception as e:
        print(f"Error checking google tokens in /calendar: {e}")

    # Deduplicate unified_events across all sources (Booking, Task, CalendarEvent, GoogleCalendar)
    seen_keys = set()
    deduped_events = []
    for ev in unified_events:
        s_raw = str(ev.get("start", ""))[:16]
        t_clean = (ev.get("title") or "").strip().lower()
        if t_clean.startswith("meeting:"):
            t_clean = t_clean.replace("meeting:", "").strip()
        key = f"{s_raw}_{t_clean}"
        if key not in seen_keys:
            seen_keys.add(key)
            deduped_events.append(ev)

    return deduped_events



@router.get("/available-slots")
def get_available_slots(
    selected_date: date,
    admin_id: int,
    db: Session = Depends(get_db),
):
    schedules = (
        db.query(AdminSchedule)
        .filter(and_(AdminSchedule.date == selected_date, AdminSchedule.admin_id == admin_id))
        .order_by(AdminSchedule.start_time)
        .all()
    )
    if len(schedules) == 0:
        all_schedules = db.query(AdminSchedule).filter(AdminSchedule.date == selected_date).all()
        if all_schedules:
            schedules = all_schedules

    response = []
    for schedule in schedules:
        booking = (
            db.query(Booking)
            .filter(Booking.schedule_id == schedule.id, Booking.booking_status == "confirmed")
            .first()
        )
        is_booked = schedule.status == "booked" or booking
        response.append({
            "id": schedule.id,
            "time": f"{schedule.start_time.strftime('%I:%M %p')} - {schedule.end_time.strftime('%I:%M %p')}",
            "status": "booked" if is_booked else "available",
        })
    return response


@router.post("/generate-schedule")
def generate_schedule(
    month: str,
    admin_id: int,
    months_ahead: int = 1,
    db: Session = Depends(get_db),
):
    try:
        result = generate_schedule_internal(month, admin_id, months_ahead, db)
        return {"message": "Schedule generated successfully", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating schedule: {str(e)}")


@router.post("/book")
def book_slot(request: BookingRequest, db: Session = Depends(get_db)):
    if not request.user_id:
        raise HTTPException(status_code=400, detail="User ID is required")

    schedule = db.query(AdminSchedule).filter(AdminSchedule.id == request.schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if schedule.status != "available":
        raise HTTPException(status_code=400, detail="This slot is no longer available")

    existing_booking = (
        db.query(Booking)
        .filter(Booking.schedule_id == request.schedule_id, Booking.booking_status == "confirmed")
        .first()
    )
    if existing_booking:
        raise HTTPException(status_code=400, detail="This slot has already been booked")

    booking = Booking(
        schedule_id=request.schedule_id,
        user_id=request.user_id,
        admin_id=schedule.admin_id,
        meeting_link=None,
        google_event_id=None,
        booking_status="pending",
    )
    db.add(booking)
    schedule.status = "booked"

    try:
        db.commit()
        db.refresh(booking)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to complete booking.")

    return {
        "message": "Booking successful",
        "booking_id": booking.id,
        "schedule_id": booking.schedule_id,
        "admin_id": booking.admin_id,
        "booking_status": booking.booking_status,
        "meeting_link": booking.meeting_link,
        "google_event_id": booking.google_event_id,
    }


@router.post("/{booking_id}/approve")
def approve_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.booking_status != "pending":
        raise HTTPException(status_code=400, detail=f"Only pending bookings can be approved. This one is {booking.booking_status}.")

    schedule = db.query(AdminSchedule).filter(AdminSchedule.id == booking.schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Associated slot not found")

    start_dt = datetime.combine(schedule.date, schedule.start_time)
    end_dt = datetime.combine(schedule.date, schedule.end_time)

    host_token_row = get_valid_admin_token(db, booking.admin_id)
    admin = db.query(User).filter(User.user_id == booking.admin_id).first()
    learner = db.query(User).filter(User.user_id == booking.user_id).first()

    if host_token_row and host_token_row.refresh_token:
        try:
            attendees = []
            if admin and admin.email:
                attendees.append(admin.email)
            if learner and learner.email and learner.email != (admin.email if admin else None):
                attendees.append(learner.email)

            google_result = create_google_meet_event(
                title="Saarthi Curious - Admin Call",
                start_datetime=start_dt,
                end_datetime=end_dt,
                refresh_token=host_token_row.refresh_token,
                attendees=attendees,
            )
            booking.meeting_link = google_result.get("meeting_link")
            booking.google_event_id = google_result.get("event_id")
        except Exception as e:
            print(f"[approve] Google error: {e}")
            raise HTTPException(status_code=500, detail=f"Could not create Google Calendar event: {e}")
    else:
        booking.meeting_link = "Google Meet link will be provided later"

    booking.booking_status = "confirmed"
    try:
        db.commit()
        db.refresh(booking)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to approve booking")

    return {
        "message": "Booking approved",
        "booking_id": booking.id,
        "booking_status": booking.booking_status,
        "meeting_link": booking.meeting_link,
        "google_event_id": booking.google_event_id,
    }


@router.post("/{booking_id}/reject")
def reject_booking(booking_id: int, request: CancelRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.booking_status != "pending":
        raise HTTPException(status_code=400, detail=f"Only pending bookings can be rejected. This one is {booking.booking_status}.")

    slot = db.query(AdminSchedule).filter(AdminSchedule.id == booking.schedule_id).first()
    if slot:
        slot.status = "available"
    booking.booking_status = "rejected"

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to reject booking")

    return {"message": "Booking rejected", "booking_id": booking.id, "reason": request.reason}


@router.post("/{booking_id}/reschedule")
def reschedule_single_booking(booking_id: int, request: SingleRescheduleRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.booking_status != "confirmed":
        raise HTTPException(status_code=400, detail=f"Cannot reschedule a {booking.booking_status} booking")

    new_slot = db.query(AdminSchedule).filter(AdminSchedule.id == request.new_schedule_id).first()
    if not new_slot:
        raise HTTPException(status_code=404, detail="Target slot not found")
    if new_slot.status != "available":
        raise HTTPException(status_code=400, detail="Target slot is not available")

    old_slot = db.query(AdminSchedule).filter(AdminSchedule.id == booking.schedule_id).first()

    new_start = datetime.combine(new_slot.date, new_slot.start_time)
    new_end = datetime.combine(new_slot.date, new_slot.end_time)

    if booking.google_event_id:
        host_token_row = get_valid_admin_token(db, booking.admin_id)
        if host_token_row and host_token_row.refresh_token:
            try:
                reschedule_google_event(
                    event_id=booking.google_event_id,
                    new_start_datetime=new_start,
                    new_end_datetime=new_end,
                    refresh_token=host_token_row.refresh_token,
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Google Calendar move failed: {e}")

    if old_slot:
        old_slot.status = "available"
    new_slot.status = "booked"
    booking.schedule_id = new_slot.id

    try:
        db.commit()
        db.refresh(booking)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to reschedule booking")

    return {
        "message": "Booking rescheduled",
        "booking_id": booking.id,
        "new_slot_id": new_slot.id,
        "new_date": new_slot.date.isoformat(),
        "new_start_time": new_slot.start_time.strftime("%H:%M"),
        "new_end_time": new_slot.end_time.strftime("%H:%M"),
    }


@router.post("/{booking_id}/cancel")
def cancel_booking(booking_id: int, request: CancelRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.booking_status != "confirmed":
        raise HTTPException(status_code=400, detail=f"Booking is already {booking.booking_status}")

    if booking.google_event_id:
        host_token_row = get_valid_admin_token(db, booking.admin_id)
        if host_token_row and host_token_row.refresh_token:
            try:
                delete_google_event(
                    event_id=booking.google_event_id,
                    refresh_token=host_token_row.refresh_token,
                )
            except Exception as e:
                print(f"Google delete error (non-fatal): {e}")

    slot = db.query(AdminSchedule).filter(AdminSchedule.id == booking.schedule_id).first()
    if slot:
        slot.status = "available"
    booking.booking_status = "cancelled"

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to cancel booking")

    return {"message": "Booking cancelled", "booking_id": booking.id, "reason": request.reason}


@router.post("/reschedule-date")
def reschedule_date(request: RescheduleRequest, db: Session = Depends(get_db)):
    bookings = (
        db.query(Booking)
        .join(AdminSchedule, Booking.schedule_id == AdminSchedule.id)
        .filter(AdminSchedule.date == request.source_date, Booking.booking_status == "confirmed")
        .order_by(AdminSchedule.start_time)
        .all()
    )

    if not bookings:
        return {"message": "No meetings found on this date.", "rescheduled": 0}

    available_slots = (
        db.query(AdminSchedule)
        .filter(AdminSchedule.date == request.target_date, AdminSchedule.status == "available")
        .order_by(AdminSchedule.start_time)
        .all()
    )

    if len(available_slots) < len(bookings):
        raise HTTPException(
            status_code=400,
            detail=f"Not enough available slots on target date. Need {len(bookings)}, only {len(available_slots)} available.",
        )

    rescheduled = []
    for booking, new_slot in zip(bookings, available_slots):
        old_schedule = db.query(AdminSchedule).filter(AdminSchedule.id == booking.schedule_id).first()
        new_start = datetime.combine(new_slot.date, new_slot.start_time)
        new_end = datetime.combine(new_slot.date, new_slot.end_time)

        if booking.google_event_id:
            host_token_row = get_valid_admin_token(db, booking.admin_id)
            if host_token_row and host_token_row.refresh_token:
                try:
                    reschedule_google_event(
                        event_id=booking.google_event_id,
                        new_start_datetime=new_start,
                        new_end_datetime=new_end,
                        refresh_token=host_token_row.refresh_token,
                    )
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Google reschedule failed: {e}")

        if old_schedule:
            old_schedule.status = "available"
        new_slot.status = "booked"
        booking.schedule_id = new_slot.id

        rescheduled.append({
            "booking_id": booking.id,
            "user_id": booking.user_id,
            "new_date": new_slot.date.isoformat(),
            "new_start_time": new_slot.start_time.strftime("%H:%M"),
            "new_end_time": new_slot.end_time.strftime("%H:%M"),
            "meeting_link": booking.meeting_link,
        })

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to reschedule meetings.")

    return {
        "message": "Meetings rescheduled successfully.",
        "rescheduled": len(rescheduled),
        "meetings": rescheduled,
    }


# ─────────────────────────────────────────────────────────────
# POST /bookings/link-google-calendar
# ─────────────────────────────────────────────────────────────

class LinkCalendarRequest(BaseModel):
    email: str
    device_id: Optional[str] = None
    user_id: Optional[int] = None


@router.post("/link-google-calendar")
def link_google_calendar(
    request: LinkCalendarRequest,
    db: Session = Depends(get_db),
):
    try:
        target_user_id = request.user_id
        if not target_user_id:
            target_user = db.query(User).filter(User.email == request.email).first()
            if target_user:
                target_user_id = target_user.user_id

        if not target_user_id:
            raise HTTPException(status_code=400, detail="user_id is required to link Google Calendar")

        # Check if we already have an authorized token for THIS user and email
        existing_token = (
            db.query(UserGoogleToken)
            .filter(
                UserGoogleToken.user_id == target_user_id,
                UserGoogleToken.google_email == request.email,
                UserGoogleToken.refresh_token.isnot(None),
                UserGoogleToken.refresh_token != "pending_auth",
                UserGoogleToken.refresh_token != "",
            )
            .order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc())
            .first()
        )

        if existing_token:
            if request.device_id:
                existing_token.device_id = request.device_id
            existing_token.is_personal = True
            db.commit()
            return {
                "message": f"Google Calendar linked successfully with {request.email}!",
                "connected": True,
                "email": request.email
            }

        auth_url = f"/google/connect?email={request.email}&user_id={target_user_id}&is_personal=true&device_id={request.device_id or ''}"
        return {
            "message": "Authorization needed to complete Google Calendar sync.",
            "connected": False,
            "auth_required": True,
            "auth_url": auth_url,
            "email": request.email
        }
    except Exception as e:
        db.rollback()
        target_user_id = request.user_id
        if not target_user_id:
            raise HTTPException(status_code=400, detail="user_id is required to link Google Calendar")
        auth_url = f"/google/connect?email={request.email}&user_id={target_user_id}&is_personal=true&device_id={request.device_id or ''}"
        return {
            "message": "Connecting to Google OAuth...",
            "connected": False,
            "auth_required": True,
            "auth_url": auth_url,
            "email": request.email
        }

