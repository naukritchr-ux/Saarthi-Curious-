"""
Natural-language scheduling assistant for Saarthi.
Admin writes an instruction; Groq parses it into a structured action.
Frontend then calls /bookings/reschedule-date or /bookings/{id}/reschedule.
"""

import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Booking, AdminSchedule
from services.ai.groq_provider import GroqProvider


router = APIRouter(prefix="/ai", tags=["AI Schedule"])

_groq = None


def get_groq():
    global _groq
    if _groq is None:
        _groq = GroqProvider()
    return _groq


class ScheduleAskRequest(BaseModel):
    message: str
    admin_id: int
    today: str | None = None


SYSTEM_PROMPT = """You are Saarthi's scheduling assistant for an LMS.
Parse the admin's natural-language instruction into a structured JSON action.

Return ONLY valid JSON:
{
  "intent": "reschedule_date" | "reschedule_booking" | "cancel_booking" | "query" | "unknown",
  "reply": "one-sentence human-readable reply",
  "params": {
    "source_date": "YYYY-MM-DD" | null,
    "target_date": "YYYY-MM-DD" | null,
    "time_range": "morning" | "afternoon" | "evening" | "all_day" | null,
    "booking_id": integer | null
  }
}

Rules:
- "I'm busy tomorrow afternoon" -> intent=reschedule_date, source_date=tomorrow, 
  target_date=null, time_range=afternoon
- "Move all Friday meetings to Monday" -> intent=reschedule_date, source_date=friday, 
  target_date=monday, time_range=all_day
- Never invent dates. If vague, use intent=query and ask a clarifying question in reply.
"""


@router.post("/schedule")
async def schedule_ask(payload: ScheduleAskRequest, db: Session = Depends(get_db)):
    groq = get_groq()
    if not await groq.is_available():
        raise HTTPException(status_code=503, detail="AI provider not available")

    today_iso = payload.today or date.today().isoformat()

    upcoming = (
        db.query(Booking, AdminSchedule)
        .join(AdminSchedule, Booking.schedule_id == AdminSchedule.id)
        .filter(
            Booking.admin_id == payload.admin_id,
            Booking.booking_status.in_(["confirmed", "pending"]),
            AdminSchedule.date >= date.fromisoformat(today_iso),
        )
        .order_by(AdminSchedule.date, AdminSchedule.start_time)
        .limit(15)
        .all()
    )

    context_lines = [
        f"{s.date.isoformat()} {s.start_time.strftime('%H:%M')} booking#{b.id} "
        f"user#{b.user_id} status={b.booking_status}"
        for b, s in upcoming
    ]
    context = "Upcoming bookings:\n" + ("\n".join(context_lines) if context_lines else "(none)")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Today is {today_iso}.\n\n{context}\n\nAdmin says: {payload.message}"},
    ]

    try:
        content = await groq.chat(messages, temperature=0.3, max_tokens=400, json_mode=True)
        parsed = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {e}")

    return parsed
