from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_ 
from datetime import date
from services.google_calendar import (
    create_google_meet_event,
    reschedule_google_event,
    delete_google_event,
)
from database import get_db
from models import AdminSchedule, Booking, UserGoogleToken, User
from datetime import datetime, timedelta, time
import calendar
from pydantic import BaseModel


# ─────────────────────────────────────────────────────────────
# Schedule auto-generation (unchanged)
# ─────────────────────────────────────────────────────────────

def auto_generate_schedules(db: Session, admin_id: int = 2, months_to_generate: int = 3):
    today = datetime.now()
    current_month_str = today.strftime("%Y-%m")
    try:
        result = generate_schedule_internal(
            current_month_str, admin_id, months_to_generate, db
        )
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


def generate_schedule_internal(month: str, admin_id: int, months_ahead: int, db: Session):
    try:
        year, month_number = map(int, month.split("-"))
    except:
        raise ValueError("Month format should be YYYY-MM")

    slots = [
        (time(10, 0), time(10, 15)),
        (time(14, 0), time(14, 15)),
        (time(16, 0), time(16, 15)),
    ]

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
                        AdminSchedule.start_time == start_time
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
                    status="available"
                )
                db.add(schedule)
                total_created += 1

    db.commit()

    return {
        "slots_created": total_created,
        "months_generated": months_ahead
    }


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


# ─────────────────────────────────────────────────────────────
# Router
# ─────────────────────────────────────────────────────────────

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


@router.get("/test")
def test_booking_route():
    return {"message": "Booking API is working"}


# ─────────────────────────────────────────────────────────────
# GET /bookings/schedule
# ─────────────────────────────────────────────────────────────

@router.get("/schedule")
def get_schedule(
    month: str = Query(..., description="Month in YYYY-MM format"),
    admin_id: int = Query(..., description="Admin user ID"),
    db: Session = Depends(get_db)
):
    try:
        year, month_number = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM.")

    if month_number == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month_number + 1, 1)

    current_month = date(year, month_number, 1) 

    schedules = (
        db.query(AdminSchedule)
        .filter(
            AdminSchedule.admin_id == admin_id,
            AdminSchedule.date >= current_month,
            AdminSchedule.date < next_month
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
            "status": slot.status
        }
        for slot in schedules
    ]


# ─────────────────────────────────────────────────────────────
# GET /bookings/calendar  ← NEW: full month with joined booking data
# ─────────────────────────────────────────────────────────────

@router.get("/calendar")
def get_calendar(
    month: str = Query(..., description="Month in YYYY-MM format"),
    admin_id: int = Query(..., description="Host user ID"),
    db: Session = Depends(get_db)
):
    """
    Return all slots for the month, joined with booking + learner info.
    This is the endpoint the calendar UI calls.
    """
    try:
        year, month_number = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM.")

    current_month = date(year, month_number, 1)
    if month_number == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month_number + 1, 1)

    rows = (
        db.query(AdminSchedule, Booking, User)
        .outerjoin(Booking, Booking.schedule_id == AdminSchedule.id)
        .outerjoin(User, User.user_id == Booking.user_id)
        .filter(
            AdminSchedule.admin_id == admin_id,
            AdminSchedule.date >= current_month,
            AdminSchedule.date < next_month,
        )
        .order_by(AdminSchedule.date, AdminSchedule.start_time)
        .all()
    )

    result = []
    for schedule, booking, user in rows:
        result.append({
            "slot_id": schedule.id,
            "date": schedule.date.isoformat(),
            "start_time": schedule.start_time.strftime("%H:%M"),
            "end_time": schedule.end_time.strftime("%H:%M"),
            "status": schedule.status,
            "booking": None if not booking else {
                "booking_id": booking.id,
                "user_id": booking.user_id,
                "user_name": user.full_name if user else "Unknown",
                "user_email": user.email if user else None,
                "meeting_link": booking.meeting_link,
                "google_event_id": booking.google_event_id,
                "booking_status": booking.booking_status,
            },
        })

    return result


# ─────────────────────────────────────────────────────────────
# GET /bookings/available-slots
# ─────────────────────────────────────────────────────────────

@router.get("/available-slots")
def get_available_slots(
    selected_date: date,
    admin_id: int,
    db: Session = Depends(get_db)
):
    schedules = (
        db.query(AdminSchedule)
        .filter(
            and_(
                AdminSchedule.date == selected_date,
                AdminSchedule.admin_id == admin_id
            )
        )
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
            .filter(
                Booking.schedule_id == schedule.id,
                Booking.booking_status == "confirmed"
            )
            .first()
        )
        is_booked = schedule.status == "booked" or booking

        response.append(
            {
                "id": schedule.id,
                "time": f"{schedule.start_time.strftime('%I:%M %p')} - {schedule.end_time.strftime('%I:%M %p')}",
                "status": "booked" if is_booked else "available"
            }
        )

    return response


# ─────────────────────────────────────────────────────────────
# POST /bookings/generate-schedule
# ─────────────────────────────────────────────────────────────

@router.post("/generate-schedule")
def generate_schedule(
    month: str,
    admin_id: int,
    months_ahead: int = 1,
    db: Session = Depends(get_db)
):
    try:
        result = generate_schedule_internal(month, admin_id, months_ahead, db)
        return {"message": "Schedule generated successfully", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating schedule: {str(e)}")


# ─────────────────────────────────────────────────────────────
# POST /bookings/book
# ─────────────────────────────────────────────────────────────

@router.post("/book")
def book_slot(
    request: BookingRequest,
    db: Session = Depends(get_db)
):
    print(f"\n=== Booking Debug ===")
    print(f"Schedule ID: {request.schedule_id}")
    print(f"User ID: {request.user_id}")

    if not request.user_id:
        raise HTTPException(status_code=400, detail="User ID is required")

    schedule = (
        db.query(AdminSchedule)
        .filter(AdminSchedule.id == request.schedule_id)
        .first()
    )

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if schedule.status != "available":
        raise HTTPException(status_code=400, detail="This slot is no longer available")

    existing_booking = (
        db.query(Booking)
        .filter(
            Booking.schedule_id == request.schedule_id,
            Booking.booking_status == "confirmed"
        )
        .first()
    )

    if existing_booking:
        raise HTTPException(status_code=400, detail="This slot has already been booked")

    start_datetime = datetime.combine(schedule.date, schedule.start_time)
    end_datetime = datetime.combine(schedule.date, schedule.end_time)

    # Google Calendar event is created when the admin approves the booking.
    meeting_link = None
    google_event_id = None

    booking = Booking(
        schedule_id=request.schedule_id,
        user_id=request.user_id,
        admin_id=schedule.admin_id,
        meeting_link=None,
        google_event_id=None,
        booking_status="pending"
    )

    db.add(booking)
    schedule.status = "booked"

    try:
        db.commit()
        db.refresh(booking)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to complete booking.")

    print(f"Booking successful: {booking.id}")
    print("=== End Booking Debug ===\n")

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
def approve_booking(
    booking_id: int,
    db: Session = Depends(get_db)
):
    """Admin approves a pending booking. Creates the Google Calendar event now."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.booking_status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Only pending bookings can be approved. This one is {booking.booking_status}."
        )

    schedule = (
        db.query(AdminSchedule)
        .filter(AdminSchedule.id == booking.schedule_id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Associated slot not found")

    start_datetime = datetime.combine(schedule.date, schedule.start_time)
    end_datetime = datetime.combine(schedule.date, schedule.end_time)

    meeting_link = None
    google_event_id = None

    host_token_row = (
        db.query(UserGoogleToken)
        .filter(UserGoogleToken.user_id == booking.admin_id)
        .first()
    )

    if host_token_row and host_token_row.refresh_token:
        try:
            print(f"Approving booking {booking.id}. Creating Google Calendar event...")
            google_result = create_google_meet_event(
                title="Saarthi Curious - Admin Call",
                start_datetime=start_datetime,
                end_datetime=end_datetime,
                refresh_token=host_token_row.refresh_token,
            )
            meeting_link = google_result.get("meeting_link")
            google_event_id = google_result.get("event_id")
            print(f"Approved: Google Calendar event {google_event_id}")
        except Exception as e:
            print(f"Google Calendar error on approval: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Could not create Google Calendar event: {e}"
            )
    else:
        print(f"Host {booking.admin_id} has no Google token — approving without Meet link.")
        meeting_link = "Google Meet link will be provided later"

    booking.meeting_link = meeting_link
    booking.google_event_id = google_event_id
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
def reject_booking(
    booking_id: int,
    request: CancelRequest,
    db: Session = Depends(get_db)
):
    """Admin rejects a pending booking. Frees the slot."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.booking_status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Only pending bookings can be rejected. This one is {booking.booking_status}."
        )

    slot = (
        db.query(AdminSchedule)
        .filter(AdminSchedule.id == booking.schedule_id)
        .first()
    )
    if slot:
        slot.status = "available"

    booking.booking_status = "rejected"

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to reject booking")

    return {
        "message": "Booking rejected",
        "booking_id": booking.id,
        "reason": request.reason,
    }


# ─────────────────────────────────────────────────────────────
# POST /bookings/{booking_id}/reschedule  ← NEW: single booking move
# ─────────────────────────────────────────────────────────────

@router.post("/{booking_id}/reschedule")
def reschedule_single_booking(
    booking_id: int,
    request: SingleRescheduleRequest,
    db: Session = Depends(get_db)
):
    """
    Move ONE booking to a new slot. Also moves the Google Calendar event.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.booking_status != "confirmed":
        raise HTTPException(status_code=400, detail=f"Cannot reschedule a {booking.booking_status} booking")

    new_slot = (
        db.query(AdminSchedule)
        .filter(AdminSchedule.id == request.new_schedule_id)
        .first()
    )
    if not new_slot:
        raise HTTPException(status_code=404, detail="Target slot not found")

    if new_slot.status != "available":
        raise HTTPException(status_code=400, detail="Target slot is not available")

    old_slot = (
        db.query(AdminSchedule)
        .filter(AdminSchedule.id == booking.schedule_id)
        .first()
    )

    new_start = datetime.combine(new_slot.date, new_slot.start_time)
    new_end = datetime.combine(new_slot.date, new_slot.end_time)

    # Move the Google Calendar event, if any
    if booking.google_event_id:
        host_token_row = (
            db.query(UserGoogleToken)
            .filter(UserGoogleToken.user_id == booking.admin_id)
            .first()
        )
        if host_token_row and host_token_row.refresh_token:
            try:
                reschedule_google_event(
                    event_id=booking.google_event_id,
                    new_start_datetime=new_start,
                    new_end_datetime=new_end,
                    refresh_token=host_token_row.refresh_token,
                )
                print(f"Google Calendar event {booking.google_event_id} moved.")
            except Exception as e:
                print(f"Google Calendar move error: {e}")
                raise HTTPException(status_code=500, detail=f"Google Calendar move failed: {e}")
        else:
            print(f"Host {booking.admin_id} has no Google token — skipping Google move.")

    # Free old slot, book new slot, update booking
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


# ─────────────────────────────────────────────────────────────
# POST /bookings/{booking_id}/cancel  ← NEW
# ─────────────────────────────────────────────────────────────

@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    request: CancelRequest,
    db: Session = Depends(get_db)
):
    """
    Cancel a booking, delete the Google Calendar event, and free the slot.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.booking_status != "confirmed":
        raise HTTPException(status_code=400, detail=f"Booking is already {booking.booking_status}")

    # Delete the Google Calendar event if we have an ID and the host is connected
    if booking.google_event_id:
        host_token_row = (
            db.query(UserGoogleToken)
            .filter(UserGoogleToken.user_id == booking.admin_id)
            .first()
        )
        if host_token_row and host_token_row.refresh_token:
            try:
                delete_google_event(
                    event_id=booking.google_event_id,
                    refresh_token=host_token_row.refresh_token,
                )
                print(f"Google Calendar event {booking.google_event_id} deleted.")
            except Exception as e:
                # Don't fail the cancel if Google delete fails; log it
                print(f"Google Calendar delete error (non-fatal): {e}")
        else:
            print(f"Host {booking.admin_id} has no Google token — skipping Google delete.")

    # Free the slot
    slot = (
        db.query(AdminSchedule)
        .filter(AdminSchedule.id == booking.schedule_id)
        .first()
    )
    if slot:
        slot.status = "available"

    # Mark the booking cancelled
    booking.booking_status = "cancelled"

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to cancel booking")

    return {
        "message": "Booking cancelled",
        "booking_id": booking.id,
        "reason": request.reason,
    }


# ─────────────────────────────────────────────────────────────
# POST /bookings/reschedule-date  (bulk — kept for backwards compat)
# ─────────────────────────────────────────────────────────────

@router.post("/reschedule-date")
def reschedule_date(
    request: RescheduleRequest,
    db: Session = Depends(get_db)
):
    bookings = (
        db.query(Booking)
        .join(AdminSchedule, Booking.schedule_id == AdminSchedule.id)
        .filter(
            AdminSchedule.date == request.source_date,
            Booking.booking_status == "confirmed"
        )
        .order_by(AdminSchedule.start_time)
        .all()
    )

    if not bookings:
        return {"message": "No meetings found on this date.", "rescheduled": 0}

    available_slots = (
        db.query(AdminSchedule)
        .filter(
            AdminSchedule.date == request.target_date,
            AdminSchedule.status == "available"
        )
        .order_by(AdminSchedule.start_time)
        .all()
    )

    if len(available_slots) < len(bookings):
        raise HTTPException(
            status_code=400,
            detail=f"Not enough available slots on target date. Need {len(bookings)}, only {len(available_slots)} available."
        )

    rescheduled = []

    for booking, new_slot in zip(bookings, available_slots):
        old_schedule = (
            db.query(AdminSchedule)
            .filter(AdminSchedule.id == booking.schedule_id)
            .first()
        )

        new_start_datetime = datetime.combine(new_slot.date, new_slot.start_time)
        new_end_datetime = datetime.combine(new_slot.date, new_slot.end_time)

        if booking.google_event_id:
            host_token_row = (
                db.query(UserGoogleToken)
                .filter(UserGoogleToken.user_id == booking.admin_id)
                .first()
            )
            if host_token_row and host_token_row.refresh_token:
                try:
                    reschedule_google_event(
                        event_id=booking.google_event_id,
                        new_start_datetime=new_start_datetime,
                        new_end_datetime=new_end_datetime,
                        refresh_token=host_token_row.refresh_token,
                    )
                except Exception as e:
                    print("Google Calendar reschedule error:", e)
                    raise HTTPException(status_code=500, detail="Unable to reschedule Google Calendar event.")
            else:
                print(f"Host {booking.admin_id} has no Google token — skipping Google reschedule.")

        old_schedule.status = "available"
        new_slot.status = "booked"
        booking.schedule_id = new_slot.id

        rescheduled.append({
            "booking_id": booking.id,
            "user_id": booking.user_id,
            "new_date": new_slot.date.isoformat(),
            "new_start_time": new_slot.start_time.strftime("%H:%M"),
            "new_end_time": new_slot.end_time.strftime("%H:%M"),
            "meeting_link": booking.meeting_link
        })

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to reschedule meetings.")

    from email_service import send_email

    for booking in bookings:
        user = db.query(User).filter(User.user_id == booking.user_id).first()
        if user and user.email:
            reschedule_info = next((r for r in rescheduled if r["booking_id"] == booking.id), None)
            if reschedule_info:
                try:
                    email_html = f"""
                    <h2>Meeting Rescheduled</h2>
                    <p>Dear {user.full_name},</p>
                    <p>Your meeting has been rescheduled from {request.source_date} to {reschedule_info['new_date']}.</p>
                    <p><strong>New Time:</strong> {reschedule_info['new_start_time']} - {reschedule_info['new_end_time']}</p>
                    <p><strong>Meeting Link:</strong> <a href="{reschedule_info['meeting_link']}">Join Meeting</a></p>
                    <p>Best regards,<br>Saarthi Curious Team</p>
                    """
                    send_email(
                        to_email=user.email,
                        subject="Your Meeting Has Been Rescheduled - Saarthi Curious",
                        html=email_html
                    )
                    print(f"Reschedule email sent to {user.email}")
                except Exception as e:
                    print(f"Failed to send reschedule email to {user.email}: {e}")

    return {
        "message": "Meetings rescheduled successfully.",
        "rescheduled": len(rescheduled),
        "meetings": rescheduled
    }