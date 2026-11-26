import os
import asyncio
from typing import List, Dict, Any, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from auth import ALGORITHM, SECRET_KEY
from database import get_db, supabase as supabase_client
from models import AdminSchedule, Booking, User
from agents.core import execute_hybrid_command
from agents.gate import SafetyGate

load_dotenv()

router = APIRouter(prefix="/ai", tags=["AI"])
_opt_bearer = HTTPBearer(auto_error=False)


class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    context: Optional[Dict[str, Any]] = None
    confirm_action_id: Optional[str] = None
    reject_action_id: Optional[str] = None


def _get_verified_user(
    credentials: Optional[HTTPAuthorizationCredentials], db: Session
) -> Optional[User]:
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("user_id")
        if uid is None:
            return None
        return db.query(User).filter(User.user_id == int(uid)).first()
    except JWTError:
        return None


@router.post("/chat")
async def chat_with_saarthi(
    req: ChatRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_opt_bearer),
    db: Session = Depends(get_db),
):
    """
    Dashboard AI Co-Pilot (Agentic + Scoped):
    - Executes Dashboard workflows (nudges/notifications, user approvals) with final Admin permission.
    - Detects specialized domain prompts (Calendar booking, Personal Quiz Vault) and redirects cleanly.
    """
    auth_user = _get_verified_user(credentials, db)

    if req.confirm_action_id or req.reject_action_id:
        if not auth_user or auth_user.role_id not in (1, 2):
            raise HTTPException(
                status_code=403,
                detail="Admin or Master Admin privileges required to execute agentic workflows.",
            )
        gate = SafetyGate(supabase=supabase_client, db=db)
        aid = req.confirm_action_id or req.reject_action_id
        dec = "approve" if req.confirm_action_id else "reject"
        role_name = "Master Admin" if auth_user.role_id == 1 else "Admin"
        updated = gate.decide_action(
            action_id=aid,
            decision=dec,
            reviewer_id=str(auth_user.user_id),
            reviewer_role=role_name,
        )
        return {
            "reply": (
                f"Executed: {updated.get('summary') or 'Workflow complete.'}"
                if dec == "approve"
                else "Cancelled queued workflow."
            ),
            "mood": "happy" if dec == "approve" else "thinking",
            "action": updated,
        }

    last_user_msg = (req.messages[-1].get("content", "") if req.messages else "").strip()
    low_msg = last_user_msg.lower()

    # Tab-Domain Redirect Guardrail for specialized Calendar or Personal Quiz workflows
    if any(k in low_msg for k in ("book a meeting", "book meeting", "schedule meeting", "schedule a call", "reschedule")):
        return {
            "reply": "Calendar scheduling & Google Meet invites belong to the **Calendar Scheduler AI**. Click below to jump directly there.",
            "mood": "thinking",
            "out_of_scope": True,
            "redirect_to": "/admin/schedule",
            "redirect_label": "Open Calendar Scheduler AI →",
        }
    if any(k in low_msg for k in ("manual hard quiz", "personal quiz", "program vault", "give a quiz", "assign quiz")):
        return {
            "reply": "Personalized quiz generation & Personal Program Vault delivery belong to the **Programs & Vault AI**. Click below to open it.",
            "mood": "thinking",
            "out_of_scope": True,
            "redirect_to": "/programs",
            "redirect_label": "Open Programs & Personal Vault →",
        }

    # Agentic Action Workflows (requires authenticated Admin role_id in (1, 2))
    is_workflow_intent = any(
        k in low_msg
        for k in ("nudge", "send notification", "approve user", "approve pending", "change role", "revive dormant")
    )
    if is_workflow_intent:
        if not auth_user or auth_user.role_id not in (1, 2):
            return {
                "reply": "Only verified Admins or Master Admins can trigger live notifications or user approval workflows.",
                "mood": "concerned",
            }
        role_name = "Master Admin" if auth_user.role_id == 1 else "Admin"
        res = await execute_hybrid_command(
            prompt=last_user_msg,
            supabase=supabase_client,
            db=db,
            actor_id=str(auth_user.user_id),
            actor_role=role_name,
            tab_scope="dashboard",
        )
        qa = res.get("queued_action")
        return {
            "reply": res.get("answer", "Workflow processed."),
            "mood": "happy",
            "needs_consent": bool(qa),
            "action_id": qa["id"] if qa else None,
            "queued_action": qa,
            "ui_action": res.get("ui_action"),
        }
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

