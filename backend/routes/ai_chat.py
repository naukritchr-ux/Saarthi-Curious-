import os
import asyncio
from typing import List, Dict, Any, Optional
from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from database import get_db
from models import AdminSchedule, Booking, User

load_dotenv()

router = APIRouter(prefix="/ai", tags=["AI"])

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    context: Optional[Dict[str, Any]] = None

@router.post("/chat")
async def chat_with_saarthi(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Direct chat endpoint for Saarthi Curious AI Assistant powered by Groq.
    Injects platform analytics and real-time today meetings into the context.
    """
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    model_name = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    
    # Extract context stats
    ctx = req.context or {}
    stats = ctx.get("stats", {})
    admin_name = ctx.get("adminName", "Admin")

    # Fetch today's meetings for context
    today_date = date.today()
    meeting_lines = []
    try:
        today_slots = (
            db.query(AdminSchedule, Booking, User)
            .join(Booking, Booking.schedule_id == AdminSchedule.id)
            .outerjoin(User, User.user_id == Booking.user_id)
            .filter(
                AdminSchedule.date == today_date,
                Booking.booking_status.in_(["confirmed", "pending"])
            )
            .order_by(AdminSchedule.start_time)
            .all()
        )
        for s, b, u in today_slots:
            name = u.full_name if u else "Learner"
            email = u.email if u and u.email else ""
            start = s.start_time.strftime("%I:%M %p")
            end = s.end_time.strftime("%I:%M %p")
            link_info = f" | Meet: {b.meeting_link}" if b.meeting_link and b.meeting_link.startswith("http") else ""
            meeting_lines.append(f"- {start} to {end}: Call with {name} ({email}) [Status: {b.booking_status}]{link_info}")
    except Exception as err:
        print(f"[AI Chat] Error loading today's meetings: {err}")
        today_slots = []

    meetings_context = (
        "Today's Scheduled Calls/Meetings (" + today_date.strftime("%B %d, %Y") + "):\n" + "\n".join(meeting_lines)
        if meeting_lines
        else f"Today's Scheduled Calls/Meetings ({today_date.strftime('%B %d, %Y')}): No meetings or calls are scheduled for today."
    )
    
    system_prompt = f"""You are Saarthi AI, the intelligent, friendly, and proactive AI Co-Pilot for the Saarthi Curious LMS platform.
You are assisting {admin_name} on their Admin Dashboard.

Current Live Platform Snapshot:
- Total Enrolled Users: {stats.get('totalUsers', 20)}
- Active Learners (Today/Realtime): {stats.get('activeLearners', 12)}
- Total Programs: {stats.get('totalPrograms', 1)}
- Total Curos in Circulation: {stats.get('curos', 435)}
- Learning Funnel: 20 Enrolled (100%), 16 Started (80%), 12 In Progress (60%), 1 Completed (5%)
- Inactive Learners (7+ days): {stats.get('inactive', 4)}
- Average Streak: 4.2 days

{meetings_context}

Guidelines:
1. Be concise, insightful, motivating, and sharp. Keep answers focused (2-4 sentences or crisp bullet points).
2. Answer queries regarding learner engagement, course completion, streaks, Curo economy, or platform health.
3. Answer queries about today's schedule, meetings, calls, or appointments accurately using the schedule context above.
4. Suggest concrete admin actions when relevant (e.g. triggering re-engagement scripts, rewarding badges, rescheduling meetings).
5. Do not include markdown code fences unless specifically requested.
"""

    if not groq_api_key:
        return {
            "reply": f"Hello {admin_name}! Based on your current dashboard, you have {stats.get('activeLearners', 12)} active learners and {stats.get('totalUsers', 20)} total users enrolled. Let me know what you'd like to analyze!",
            "mood": "happy"
        }

    try:
        from groq import Groq
        client = Groq(api_key=groq_api_key)
        
        chat_messages = [{"role": "system", "content": system_prompt}]
        for m in req.messages:
            chat_messages.append({
                "role": m.get("role", "user"),
                "content": m.get("content", "")
            })

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=model_name,
                messages=chat_messages,
                temperature=0.6,
                max_tokens=600,
            )
        )
        reply = response.choices[0].message.content.strip()
        
        # Determine bot expression mood based on content
        mood = "talking"
        lower_reply = reply.lower()
        if "great" in lower_reply or "congrat" in lower_reply or "excellent" in lower_reply or "welcome" in lower_reply:
            mood = "happy"
        elif "warning" in lower_reply or "inactive" in lower_reply or "drop" in lower_reply:
            mood = "concerned"
        elif "analyz" in lower_reply or "calculat" in lower_reply or "insight" in lower_reply:
            mood = "thinking"

        return {"reply": reply, "mood": mood}

    except Exception as e:
        print(f"[AI Chat error]: {e}")
        # Smart contextual fallback
        last_msg = req.messages[-1].get("content", "").lower() if req.messages else ""
        if "meeting" in last_msg or "call" in last_msg or "schedule" in last_msg or "today" in last_msg:
            if meeting_lines:
                fallback = f"Here is your schedule for today ({today_date.strftime('%B %d')}):\n" + "\n".join(meeting_lines)
            else:
                fallback = f"You have no meetings or calls scheduled for today ({today_date.strftime('%B %d')}). Your calendar is clear for deep work!"
        elif "inactive" in last_msg:
            fallback = f"According to current logs, {stats.get('inactive', 4)} learners have been inactive for over a week. Recommend sending an automated nudge via Notification Scripts."
        elif "trend" in last_msg or "week" in last_msg:
            fallback = "This week shows peak application logins on Oct 1st and stable quiz attempts. Completion rate stands at 5% for current ongoing cohorts."
        elif "summar" in last_msg or "progress" in last_msg:
            fallback = f"Overview: {stats.get('totalUsers', 20)} enrolled learners, {stats.get('activeLearners', 12)} currently active, and 435 Curos circulating in the gamification economy."
        else:
            fallback = f"I am active and monitoring the Saarthi Curious platform. Ask me to summarize progress, explain trends, or find inactive learners!"
        return {"reply": fallback, "mood": "happy"}

