from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_ 
from datetime import date
from services.google_calendar import (
    create_google_meet_event,
    reschedule_google_event
)
from database import get_db
from models import AdminSchedule, Booking
from datetime import datetime, timedelta, time
import calendar
from pydantic import BaseModel


def auto_generate_schedules(db: Session, admin_id: int = 2, months_to_generate: int = 3):
    """
    Auto-generate schedules for the next N months starting from current month.
    This function is called during application startup.
    """
    today = datetime.now()
    current_month_str = today.strftime("%Y-%m")
    
    try:
        # Generate schedules for the next months
        result = generate_schedule_internal(
            current_month_str, 
            admin_id, 
            months_to_generate, 
            db
        )
        print(f"Auto-generated schedules: {result['slots_created']} slots for {result['months_generated']} months")
        return result
    except Exception as e:
        print(f"Error auto-generating schedules: {e}")
        return None


def auto_generate_schedules_wrapper():
    """
    Wrapper function for APScheduler that creates its own database session.
    This avoids database session issues during startup.
    """
    from database import SessionLocal
    db = SessionLocal()
    try:
        auto_generate_schedules(db, admin_id=2, months_to_generate=3)
    except Exception as e:
        print(f"Error in auto-generate schedules wrapper: {e}")
    finally:
        db.close()


def generate_schedule_internal(month: str, admin_id: int, months_ahead: int, db: Session):
    """
    Internal function to generate schedules without HTTP layer.
    Used by both the API endpoint and auto-generation logic.
    """
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
        # Calculate the target month and year
        target_month = month_number + offset
        target_year = year

        # Handle year rollover
        while target_month > 12:
            target_month -= 12
            target_year += 1

        total_days = calendar.monthrange(target_year, target_month)[1]

        for day in range(1, total_days + 1):

            current_date = date(target_year, target_month, day)

            # Skip Saturday & Sunday
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

class BookingRequest(BaseModel):
    schedule_id: int
    user_id: int

class RescheduleRequest(BaseModel):
    source_date: date
    target_date: date



router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


@router.get("/test")
def test_booking_route():

    return {
        "message": "Booking API is working"
    }


@router.get("/schedule")
def get_schedule(
    month: str = Query(
        ...,
        description="Month in YYYY-MM format"
    ),
    admin_id: int = Query(
        ...,
        description="Admin user ID"
    ),
    db: Session = Depends(get_db)
):

    try:

        year, month_number = map(
            int,
            month.split("-")
        )

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid month format. Use YYYY-MM."
        )

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
    .order_by(
        AdminSchedule.date,
        AdminSchedule.start_time
    )
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
@router.get("/available-slots")
def get_available_slots(
    selected_date: date,
    admin_id: int,
    db: Session = Depends(get_db)
):
    print(f"\n=== Available Slots Debug ===")
    print(f"Selected Date: {selected_date}")
    print(f"Admin ID: {admin_id}")

    # Check if admin exists
    admin_exists = db.query(AdminSchedule).filter(AdminSchedule.admin_id == admin_id).first()
    print(f"Admin ID {admin_id} exists in schedules: {admin_exists is not None}")

    # Get all unique admin_ids in the system
    all_admins = db.query(AdminSchedule.admin_id).distinct().all()
    print(f"Available admin_ids in system: {[a[0] for a in all_admins]}")

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

    print(f"Found {len(schedules)} schedules for date {selected_date} and admin {admin_id}")

    # If no schedules found for this admin, try without admin_id filter to see if schedules exist
    if len(schedules) == 0:
        all_schedules = db.query(AdminSchedule).filter(AdminSchedule.date == selected_date).all()
        print(f"Total schedules for date {selected_date} (any admin): {len(all_schedules)}")
        if all_schedules:
            print(f"Sample schedule admin_ids: {[s.admin_id for s in all_schedules[:5]]}")
            # Fallback: use the first available admin's schedules
            first_admin_id = all_schedules[0].admin_id
            print(f"Falling back to admin_id {first_admin_id}")
            schedules = all_schedules

    response = []

    for schedule in schedules:
        print(f"Schedule ID: {schedule.id}, Status: {schedule.status}, Time: {schedule.start_time}")

        booking = (
          db.query(Booking)
         .filter(
              Booking.schedule_id == schedule.id,
             Booking.booking_status == "confirmed"
            )
           .first()
        )

        is_booked = schedule.status == "booked" or booking
        print(f"  - Booking found: {booking is not None}, Is booked: {is_booked}")

        response.append(
          {
             "id": schedule.id,
             "time": f"{schedule.start_time.strftime('%I:%M %p')} - {schedule.end_time.strftime('%I:%M %p')}",
             "status": "booked" if is_booked else "available"
         }
       )

    print(f"Returning {len(response)} slots")
    print("=== End Debug ===\n")

    return response

@router.post("/generate-schedule")
def generate_schedule(
    month: str,
    admin_id: int,
    months_ahead: int = 1,
    db: Session = Depends(get_db)
):
    try:
        result = generate_schedule_internal(month, admin_id, months_ahead, db)
        return {
            "message": "Schedule generated successfully",
            **result
        }
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error generating schedule: {str(e)}"
        )

@router.post("/book")
def book_slot(
    request: BookingRequest,
    db: Session = Depends(get_db)
):

    print(f"\n=== Booking Debug ===")
    print(f"Schedule ID: {request.schedule_id}")
    print(f"User ID: {request.user_id}")

    # 1. Check user ID
    if not request.user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required"
        )

    # 2. Find schedule
    schedule = (
        db.query(AdminSchedule)
        .filter(
            AdminSchedule.id == request.schedule_id
        )
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=404,
            detail="Schedule not found"
        )

    print(f"Schedule found: {schedule.id}, Date: {schedule.date}, Time: {schedule.start_time}")

    # 3. Check slot is available
    if schedule.status != "available":
        raise HTTPException(
            status_code=400,
            detail="This slot is no longer available"
        )

    # 4. Check existing booking
    existing_booking = (
        db.query(Booking)
        .filter(
            Booking.schedule_id == request.schedule_id,
            Booking.booking_status == "confirmed"
        )
        .first()
    )

    if existing_booking:
        raise HTTPException(
            status_code=400,
            detail="This slot has already been booked"
        )

    # 5. Create date + time for Google Calendar
    start_datetime = datetime.combine(
        schedule.date,
        schedule.start_time
    )

    end_datetime = datetime.combine(
        schedule.date,
        schedule.end_time
    )

    # 6. Create Google Meet (with fallback)
    meeting_link = None
    google_event_id = None

    try:
        print("Attempting to create Google Meet event...")
        google_result = create_google_meet_event(
            title="Saarthi Curious - Admin Call",
            start_datetime=start_datetime,
            end_datetime=end_datetime
        )
        meeting_link = google_result["meeting_link"]
        google_event_id = google_result["event_id"]
        print(f"Google Meet created successfully: {meeting_link}")
    except Exception as e:
        print(f"Google Calendar error (booking will proceed without Meet link): {e}")
        # Don't raise error - proceed with booking without Google Meet
        meeting_link = "Google Meet link will be provided later"
        google_event_id = None

    # 7. Create booking
    booking = Booking(
        schedule_id=request.schedule_id,
        user_id=request.user_id,
        admin_id=schedule.admin_id,
        meeting_link=meeting_link,
        google_event_id=google_event_id,
        booking_status="confirmed"
    )

    db.add(booking)

    # 8. Mark slot as booked
    schedule.status = "booked"

    # 9. Save booking
    try:

        db.commit()
        db.refresh(booking)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Unable to complete booking."
        )

    # 10. Return booking information
    print(f"Booking successful: {booking.id}")
    print("=== End Booking Debug ===\n")

    return {
        "message": "Booking successful",
        "booking_id": booking.id,
        "schedule_id": booking.schedule_id,
        "admin_id": booking.admin_id,
        "booking_status": booking.booking_status,
        "meeting_link": booking.meeting_link
    } 

@router.post("/reschedule-date")
def reschedule_date(
    request: RescheduleRequest,
    db: Session = Depends(get_db)
):

    # ---------------------------------
    # 1. Find all confirmed bookings
    #    on source date
    # ---------------------------------

    bookings = (
        db.query(Booking)
        .join(
            AdminSchedule,
            Booking.schedule_id == AdminSchedule.id
        )
        .filter(
            AdminSchedule.date == request.source_date,
            Booking.booking_status == "confirmed"
        )
        .order_by(AdminSchedule.start_time)
        .all()
    )

    if not bookings:
        return {
            "message": "No meetings found on this date.",
            "rescheduled": 0
        }

    # ---------------------------------
    # 2. Find available slots on target date
    # ---------------------------------

    available_slots = (
        db.query(AdminSchedule)
        .filter(
            AdminSchedule.date == request.target_date,
            AdminSchedule.status == "available"
        )
        .order_by(AdminSchedule.start_time)
        .all()
    )

    # ---------------------------------
    # 3. Check enough slots
    # ---------------------------------

    if len(available_slots) < len(bookings):

        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough available slots on target date. "
                f"Need {len(bookings)}, "
                f"but only {len(available_slots)} available."
            )
        )

    rescheduled = []

    # ---------------------------------
    # 4. Move each booking
    # ---------------------------------

    for booking, new_slot in zip(
        bookings,
        available_slots
    ):

        old_schedule = (
            db.query(AdminSchedule)
            .filter(
                AdminSchedule.id == booking.schedule_id
            )
            .first()
        )

        # New date/time
        new_start_datetime = datetime.combine(
            new_slot.date,
            new_slot.start_time
        )

        new_end_datetime = datetime.combine(
            new_slot.date,
            new_slot.end_time
        )

        # ---------------------------------
        # 5. Update Google Calendar event
        # ---------------------------------

        if booking.google_event_id:

            try:

                google_result = reschedule_google_event(
                    event_id=booking.google_event_id,
                    new_start_datetime=new_start_datetime,
                    new_end_datetime=new_end_datetime
                )

            except Exception as e:

                print(
                    "Google Calendar reschedule error:",
                    e
                )

                raise HTTPException(
                    status_code=500,
                    detail="Unable to reschedule Google Calendar event."
                )

        # ---------------------------------
        # 6. Free old slot
        # ---------------------------------

        old_schedule.status = "available"

        # ---------------------------------
        # 7. Book new slot
        # ---------------------------------

        new_slot.status = "booked"

        # ---------------------------------
        # 8. Update booking
        # ---------------------------------

        booking.schedule_id = new_slot.id

        rescheduled.append({
            "booking_id": booking.id,
            "user_id": booking.user_id,
            "new_date": new_slot.date.isoformat(),
            "new_start_time": new_slot.start_time.strftime("%H:%M"),
            "new_end_time": new_slot.end_time.strftime("%H:%M"),
            "meeting_link": booking.meeting_link
        })

    # ---------------------------------
    # 9. Save changes
    # ---------------------------------

    try:

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Unable to reschedule meetings."
        )

    # ---------------------------------
    # 10. Send reschedule emails
    # ---------------------------------

    from email_service import send_email
    from models import User

    for booking in bookings:
        user = db.query(User).filter(User.user_id == booking.user_id).first()
        if user and user.email:
            reschedule_info = next(
                (r for r in rescheduled if r["booking_id"] == booking.id),
                None
            )
            if reschedule_info:
                try:
                    email_html = f"""
                    <h2>Meeting Rescheduled</h2>
                    <p>Dear {user.full_name},</p>
                    <p>Your meeting has been rescheduled from {request.source_date} to {reschedule_info['new_date']}.</p>
                    <p><strong>New Time:</strong> {reschedule_info['new_start_time']} - {reschedule_info['new_end_time']}</p>
                    <p><strong>Meeting Link:</strong> <a href="{reschedule_info['meeting_link']}">Join Meeting</a></p>
                    <p>Please make sure to attend at the new scheduled time.</p>
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