"""
Authentication & Google OAuth routes for Saarthi Curious.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from routes.google_calendar_routes import handle_callback_flow, handle_connect_flow

router = APIRouter(prefix="/auth", tags=["Auth"])
google_auth_router = APIRouter(prefix="/auth/google", tags=["Google OAuth"])

@router.get("/google/callback")
@google_auth_router.get("/callback")
def google_callback(
    code: str = Query(...),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return handle_callback_flow(code=code, state=state, db=db)


@router.get("/google/login")
@google_auth_router.get("/login")
def google_login(
    user_id: Optional[int] = Query(None),
    is_personal: bool = Query(False),
    device_id: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
):
    return handle_connect_flow(user_id=user_id, is_personal=is_personal, device_id=device_id, state=state)
