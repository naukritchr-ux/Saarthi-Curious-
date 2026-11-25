import os
import sys


if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Depends, Request
from sqlalchemy.orm import Session
from database import get_db
from routes.badges import get_user_earned_badge_ids
from fastapi.middleware.cors import CORSMiddleware
from routes.bookings import router as bookings_router
from routes.login import router as login_router
from routes.users import router as users_router
from routes.notifications_scripts import router as notifications_scripts_router
from routes.notifications import router as notifications_router
from routes.programs import router as programs_router
from routes.roles import router as roles_router
from routes.curo import router as curo_router
from routes.learner import router as learner_router
from routes.streaks import router as streaks_router
from routes.dashboard import router as dashboard_router
from routes.certificates import router as certificates_router
from routes import badges
from routes.reports import router as reports_router
from routes.leaderboards import router as leaderboards_router
from routes.ai_chat import router as ai_chat_router
from routes.google_calendar_routes import router as google_calendar_router, auth_alias_router as google_auth_alias_router
from routes.ai_schedule import router as ai_schedule_router
from database import SessionLocal
from routes.calendar_events import router as calendar_events_router
from routes.tasks import router as tasks_router
from routes.ai_assistant import router as ai_assistant_router
from routes.analytics import router as analytics_router
from routes.agent import router as agent_router
from routes.module_ai import router as module_ai_router
from routes.integrations import router as integrations_router
from database import supabase as _supabase_client
from scheduler import start_daily_scheduler


@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    sched = start_daily_scheduler(_supabase_client)
    try:
        yield
    finally:
        if sched is not None:
            try:
                sched.shutdown(wait=False)
            except Exception:
                pass


app = FastAPI(
    title="Saarthi Curious API",
    version="1.0.0",
    lifespan=lifespan,
)

# ============================
# CORS
# ============================
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",
    "ionic://localhost",
    "https://saarthi-curious.vercel.app",
]

extra_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
if extra_origins:
    for origin in extra_origins.split(","):
        origin = origin.strip()
        if origin:
            allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?|capacitor://localhost|ionic://localhost|https://.*\.vercel\.app|https?://192\.168\.\d+\.\d+(:\d+)?)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# ROUTERS
# ============================
app.include_router(login_router)
app.include_router(users_router)
app.include_router(notifications_scripts_router)
app.include_router(programs_router)
app.include_router(roles_router)
app.include_router(curo_router)
app.include_router(learner_router)
app.include_router(streaks_router)
app.include_router(dashboard_router)
app.include_router(badges.router)
app.include_router(leaderboards_router)
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
app.include_router(reports_router, prefix="/reports", tags=["reports"])
app.include_router(bookings_router)
app.include_router(certificates_router)
app.include_router(ai_chat_router)
app.include_router(google_calendar_router)
app.include_router(google_auth_alias_router)
app.include_router(ai_schedule_router)
app.include_router(calendar_events_router)
app.include_router(tasks_router)
app.include_router(ai_assistant_router)
app.include_router(analytics_router)
app.include_router(analytics_router, prefix="/api")
app.include_router(agent_router)
app.include_router(module_ai_router)
app.include_router(integrations_router)

# ============================
# DEBUG - Print all routes (fixed)
# ============================
print("\n" + "="*60)
print("📋 ALL REGISTERED ROUTES:")
print("="*60)
for route in app.routes:
    try:
        if hasattr(route, 'methods') and route.methods:
            print(f"  {route.path} - {', '.join(route.methods)}")
        elif hasattr(route, 'path'):
            print(f"  {route.path}")
        else:
            print(f"  {route.__class__.__name__} (router included)")
    except Exception as e:
        print(f"  Error printing route: {e}")
print("="*60 + "\n")

# ============================
# ROOT & ALIASES
# ============================
@app.get("/rewards")
@app.get("/api/rewards")
def get_rewards_alias(user_id: int = None, db: Session = Depends(get_db)):
    return get_user_earned_badge_ids(user_id=user_id, db=db)

@app.get("/leaderboards")
@app.get("/api/leaderboards")
def get_leaderboards_alias():
    from routes.analytics import get_analytics_leaderboards
    return get_analytics_leaderboards()

@app.get("/streaks")
@app.get("/api/streaks")
@app.get("/admin/streak-management")
def get_streaks_alias(db: Session = Depends(get_db)):
    from routes.analytics import get_analytics_streaks
    return get_analytics_streaks(db=db)

@app.get("/admin/certificates")
@app.get("/api/admin/certificates")
def get_admin_certificates_alias(db: Session = Depends(get_db)):
    from routes.certificates import get_admin_certificates
    return get_admin_certificates(db=db)

@app.post("/admin/certificates/issue")
@app.post("/api/admin/certificates/issue")
@app.post("/admin/certificates/{identifier}/issue")
@app.post("/api/admin/certificates/{identifier}/issue")
def issue_certificate_alias(identifier: Optional[str] = None, db: Session = Depends(get_db)):
    from routes.certificates import admin_issue_certificate
    return admin_issue_certificate(identifier=identifier, db=db)

@app.post("/admin/certificates/reject")
@app.post("/api/admin/certificates/reject")
@app.post("/admin/certificates/{identifier}/reject")
@app.post("/api/admin/certificates/{identifier}/reject")
def reject_certificate_alias(identifier: Optional[str] = None, db: Session = Depends(get_db)):
    from routes.certificates import admin_reject_certificate
    return admin_reject_certificate(identifier=identifier, db=db)

@app.get("/admin/certificates/{identifier}/download")
@app.get("/api/admin/certificates/{identifier}/download")
def download_certificate_alias(identifier: str, db: Session = Depends(get_db)):
    from routes.certificates import download_certificate_file
    return download_certificate_file(certificate_id=identifier, db=db)


# =========================================================
# APPLICATION CHECK SUBMISSIONS & AUTOMATION ALIASES
# =========================================================
@app.get("/application-check-submissions")
@app.get("/admin/application-check-submissions")
@app.get("/api/application-check-submissions")
@app.get("/api/admin/application-check-submissions")
def get_app_check_submissions_alias(db: Session = Depends(get_db)):
    from routes.programs import get_application_check_submissions
    return get_application_check_submissions(db=db)


@app.get("/application-check-submissions/{attempt_id}")
@app.get("/admin/application-check-submissions/{attempt_id}")
@app.get("/api/application-check-submissions/{attempt_id}")
@app.get("/api/admin/application-check-submissions/{attempt_id}")
def get_app_check_submission_detail_alias(attempt_id: int, db: Session = Depends(get_db)):
    from routes.programs import get_application_check_submission_detail
    return get_application_check_submission_detail(attempt_id=attempt_id, db=db)


@app.put("/application-check-submissions/{attempt_id}/review")
@app.put("/admin/application-check-submissions/{attempt_id}/review")
@app.post("/admin/application-check-submissions/{attempt_id}/approve")
@app.post("/admin/application-check-submissions/{attempt_id}/reject")
def review_app_check_submission_alias(
    attempt_id: int,
    request: Request,
    payload: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    from routes.programs import review_application_check_submission, ApplicationCheckReviewRequest
    path = request.url.path
    status = "Approved" if "approve" in path else "Rejected"
    comment = None
    if payload:
        status = payload.get("status", status).capitalize()
        comment = payload.get("review_comment") or payload.get("feedback")
    
    review_req = ApplicationCheckReviewRequest(status=status, review_comment=comment)
    return review_application_check_submission(attempt_id=attempt_id, payload=review_req, db=db)


@app.get("/application-check-automation")
@app.get("/admin/application-check-automation")
@app.get("/api/application-check-automation")
@app.get("/api/admin/application-check-automation")
def get_app_check_automation_alias(db: Session = Depends(get_db)):
    from routes.programs import get_application_check_automation
    return get_application_check_automation(db=db)


@app.put("/application-check-automation")
@app.put("/admin/application-check-automation")
@app.post("/admin/application-check-settings")
@app.post("/api/admin/application-check-settings")
def update_app_check_automation_alias(
    payload: dict,
    db: Session = Depends(get_db)
):
    from routes.programs import update_application_check_automation, ApplicationCheckAutomationRequest
    is_enabled = bool(payload.get("is_enabled", payload.get("automate_application_checks", False)))
    auto_req = ApplicationCheckAutomationRequest(is_enabled=is_enabled)
    return update_application_check_automation(payload=auto_req, db=db)




@app.get("/")
def root():
    return {
        "message": "Saarthi Backend Running 🚀",
        "status": "success"
    }