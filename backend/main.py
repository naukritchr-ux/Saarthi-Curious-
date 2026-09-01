from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from routes.bookings import router as bookings_router

load_dotenv(Path(__file__).resolve().parent / ".env")

from routes.login import router as login_router
from routes.users import router as users_router
from routes.notifications_scripts import (
    router as notifications_scripts_router
)
from routes.notifications import router as notifications_router
from routes.programs import router as programs_router
from routes.roles import router as roles_router
from routes.curo import router as curo_router
from routes.learner import router as learner_router
from routes.streaks import router as streaks_router

from routes.dashboard import router as dashboard_router
from routes import badges
from routes.reports import router as reports_router
from routes.leaderboards import router as leaderboards_router

from services.notification_scheduler import (
    send_scheduled_notifications,
    send_daily_learning_reminders,
    send_retention_quiz_unlock_notifications,
    send_application_check_unlock_notifications,
)
from database import SessionLocal

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Admin-created notification scripts
    scheduler.add_job(
        send_scheduled_notifications,
        "interval",
        minutes=1,
        id="notification_scheduler",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

        # Automatic Retention Quiz unlock notification
    scheduler.add_job(
        send_retention_quiz_unlock_notifications,
        "interval",
        minutes=1,
        id="retention_quiz_unlock_notification",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    # Automatic Application Check unlock notifications
    scheduler.add_job(
        send_application_check_unlock_notifications,
        "interval",
        minutes=1,
        id="application_check_unlock_notification",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    # Automatic daily learning reminder
    scheduler.add_job(
        send_daily_learning_reminders,
        "cron",
        hour=10,
        minute=0,
        id="daily_learning_reminder",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()

    print("Notification Scheduler Started")
    print("Daily Learning Reminder Scheduler Started")
    print("Retention Quiz Unlock Notification Scheduler Started")
    print("Application Check Unlock Notification Scheduler Started")

    # Auto-generate booking schedules on startup
    from routes.bookings import auto_generate_schedules_wrapper
    try:
        auto_generate_schedules_wrapper()
    except Exception as e:
        print(f"Error during startup schedule generation: {e}")

    yield

    scheduler.shutdown()

    print("Notification Scheduler Stopped")

app = FastAPI(
    title="Saarthi Curious API",
    version="1.0.0",
    lifespan=lifespan
)

# ============================
# CORS
# ============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://saarthi-curious.vercel.app",
    ],
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
app.include_router(notifications_router)
app.include_router(reports_router, prefix="/reports", tags=["reports"])
app.include_router(bookings_router)

# ============================
# ROOT
# ============================

@app.get("/")
def root():
    return {
        "message": "Saarthi Backend Running 🚀",
        "status": "success"
    }