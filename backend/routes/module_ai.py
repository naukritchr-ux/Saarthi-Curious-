from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User
from agents.module_generator import generate_module_kit

router = APIRouter(prefix="/api/ai", tags=["Generative Module Studio"])


@router.post("/generate-module-kit")
async def create_module_kit(
    module_title: str = Form("New Study Module"),
    youtube_url: str = Form(""),
    raw_notes: str = Form(""),
    question_count: int = Form(5),
    force_backup: bool = Form(False),
    pdf_file: Optional[UploadFile] = File(None),
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.user_id == current_user_id).first()
    if not user or user.role_id not in (1, 2):
        raise HTTPException(
            status_code=403,
            detail="Admin or Master Admin privileges required to generate module kits.",
        )

    pdf_bytes = await pdf_file.read() if pdf_file is not None else None
    safe_count = max(1, min(10, int(question_count or 5)))

    return await generate_module_kit(
        module_title=module_title,
        youtube_url=youtube_url,
        raw_notes=raw_notes,
        pdf_bytes=pdf_bytes,
        question_count=safe_count,
        force_backup=force_backup,
    )

