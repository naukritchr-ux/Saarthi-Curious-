import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.bookings import router as bookings_router


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

from database import SessionLocal

app = FastAPI(
    title="Saarthi Curious API",
    version="1.0.0"
)

@app.middleware("http")
async def strip_api_prefix(request, call_next):
    if request.scope["path"].startswith("/api"):
        request.scope["path"] = request.scope["path"][4:] or "/"

    response = await call_next(request)
    return response

# ============================
# CORS
# ============================
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
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
    allow_origin_regex=r"https://.*\.vercel\.app$|http://localhost:\d+$|http://127\.0\.0\.1:\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# ROUTERS
# ============================

app.include_router(login_router, prefix="/auth")
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