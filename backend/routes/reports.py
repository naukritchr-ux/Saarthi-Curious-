from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
from pydantic import BaseModel
from database import get_db
from models import User, Report
from services.reports import ReportService
from services.reports.storage_service import StorageService
from services.reports.report_queries import (
    get_user_learning_report,
    get_team_progress_report,
    get_franchise_performance_report,
    get_franchise_learning_report,
    get_organization_learning_report,
    get_program_performance_report,
    get_learner_engagement_report
)
from auth import get_current_user
import traceback
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter()


# =========================================================
# Pydantic models
# =========================================================
class PreviewReportRequest(BaseModel):
    report_type: str
    filters: Optional[dict] = None
    generated_for: Optional[int] = None


class GenerateReportRequest(BaseModel):
    report_type: str
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    include_ai: bool = False
    generated_for: Optional[int] = None
    filters: Optional[dict] = None


class AIInsightsRequest(BaseModel):
    """Frontend can pass either a numeric report_id OR a report_type string."""
    report_id: Optional[int] = None
    report_type: Optional[str] = None
    filters: Optional[dict] = None
    generated_for: Optional[int] = None


def get_user_from_db(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# =========================================================
# Report catalog + history
# =========================================================
@router.get("/")
def get_available_reports(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    try:
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)
        available_reports = report_service.get_available_reports(user.role_id, current_user_id)
        return {"reports": available_reports}
    except Exception as e:
        logger.error(f"Error in get_available_reports: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
def get_report_history(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    try:
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)
        history = report_service.get_report_history(current_user_id, user.role_id)
        return {"reports": history}
    except Exception as e:
        logger.error(f"Error in get_report_history: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
# Preview — data only, no PDF
# =========================================================
@router.post("/preview")
async def preview_report(
    request: PreviewReportRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    try:
        logger.info(f"Preview request: {request.report_type} for user {current_user_id}")
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)

        period_start, period_end = report_service._parse_period_filters(request.filters)
        target_user_id = request.generated_for or current_user_id
        allowed = report_service._compute_allowed_user_ids(user.role_id, current_user_id)

        preview_data = {}

        if request.report_type == "my_learning_report":
            preview_data = get_user_learning_report(db, target_user_id, period_start, period_end)

        elif request.report_type == "team_progress_report":
            preview_data = get_team_progress_report(
                db,
                target_user_id if request.generated_for else None,
                period_start,
                period_end,
                allowed,
            )

        elif request.report_type == "franchise_performance_report":
            preview_data = get_franchise_performance_report(
                db,
                target_user_id if request.generated_for else None,
                period_start,
                period_end,
                allowed,
            )

        elif request.report_type == "franchise_learning_report":
            preview_data = get_franchise_learning_report(
                db,
                target_user_id if request.generated_for else None,
                period_start,
                period_end,
                user.role_id,
                current_user_id,
            )

        elif request.report_type == "organization_learning_report":
            preview_data = get_organization_learning_report(db, period_start, period_end)

        elif request.report_type == "program_performance_report":
            program_id = request.filters.get("generated_for") if request.filters else None
            preview_data = get_program_performance_report(db, program_id, period_start, period_end)

        elif request.report_type == "learner_engagement_report":
            learner_id = request.filters.get("generated_for") if request.filters else None
            preview_data = get_learner_engagement_report(db, learner_id, period_start, period_end, allowed)

        else:
            preview_data = {"summary": {"message": "Report type not recognized"}}

        return {"data": preview_data, "report": None}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in preview_report: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error previewing report: {str(e)}")


# =========================================================
# Generate
# =========================================================
@router.post("/generate")
async def generate_report(
    request: GenerateReportRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    try:
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)

        period_start = date.fromisoformat(request.period_start) if request.period_start else None
        period_end = date.fromisoformat(request.period_end) if request.period_end else None

        report = await report_service.generate_report(
            report_type=request.report_type,
            user_id=current_user_id,
            role_id=user.role_id,
            period_start=period_start,
            period_end=period_end,
            include_ai=request.include_ai,
            generated_for=request.generated_for,
        )

        return {"report": report}

    except Exception as e:
        logger.error(f"Error in generate_report: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


# =========================================================
# AI INSIGHTS — accepts report_id (int) OR report_type (str)
# =========================================================
@router.post("/ai-insights")
async def generate_ai_insights(
    request: AIInsightsRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    Generate AI insights for either:
    - an existing report (pass report_id), or
    - a fresh report on the fly (pass report_type + optional filters)
    """
    try:
        user = get_user_from_db(db, current_user_id)
        service = ReportService(db)

        if request.report_id:
            updated_report = await service.regenerate_with_ai_insights(
                report_id=request.report_id,
                user_id=current_user_id,
                role_id=user.role_id,
            )
            return updated_report

        if request.report_type:
            period_start, period_end = service._parse_period_filters(request.filters)

            generated_for = request.generated_for
            if request.filters and "generated_for" in request.filters:
                generated_for = request.filters["generated_for"]

            report = await service.generate_report(
                report_type=request.report_type,
                user_id=current_user_id,
                role_id=user.role_id,
                period_start=period_start,
                period_end=period_end,
                include_ai=True,
                generated_for=generated_for,
            )
            return report

        raise HTTPException(
            status_code=400,
            detail="Either report_id or report_type is required."
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_ai_insights: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate AI insights: {str(e)}")


# =========================================================
# Full individual learner detail
# =========================================================
@router.get("/learner/{user_id}")
def get_learner_full_report(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Full individual learner report — profile, programs, quizzes, badges, activity."""
    try:
        from models import (
            UserProgramProgress, QuizAttempt, Quiz, Program,
            LearningStreak, UserBadge, Badge, AuditLog, Certificate, Role
        )

        requester = get_user_from_db(db, current_user_id)
        learner = db.query(User).filter(User.user_id == user_id).first()
        if not learner:
            raise HTTPException(status_code=404, detail="Learner not found")

        if requester.role_id not in (1, 2) and requester.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this learner")

        role = db.query(Role).filter(Role.id == learner.role_id).first()

        profile = {
            "user_id": learner.user_id,
            "full_name": learner.full_name,
            "email": learner.email,
            "role_id": learner.role_id,
            "role_name": role.role_name if role else "Unknown",
            "city": learner.city,
            "date_of_joining": learner.date_of_joining.isoformat() if learner.date_of_joining else None,
            "is_active": learner.is_active,
            "last_login": learner.last_login.isoformat() if learner.last_login else None,
            "curos": learner.curos or 0,
        }

        progress_rows = (
            db.query(UserProgramProgress)
            .filter(UserProgramProgress.user_id == user_id)
            .all()
        )
        programs = []
        for p in progress_rows:
            prog = db.query(Program).filter(Program.id == p.program_id).first()
            programs.append({
                "program_id": p.program_id,
                "program_name": prog.name if prog else f"Program {p.program_id}",
                "status": p.status or ("Completed" if p.completed else "In Progress"),
                "completed_percentage": p.completed_percentage or 0,
                "completed": bool(p.completed),
                "completed_at": p.completed_at.isoformat() if p.completed_at else None,
                "started_at": p.created_at.isoformat() if p.created_at else None,
            })

        quiz_attempts = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.user_id == user_id)
            .order_by(QuizAttempt.attempted_at.desc())
            .all()
        )
        quizzes = []
        for qa in quiz_attempts:
            quiz = db.query(Quiz).filter(Quiz.id == qa.quiz_id).first()
            quizzes.append({
                "quiz_id": qa.quiz_id,
                "quiz_name": quiz.title if quiz else f"Quiz {qa.quiz_id}",
                "score": float(qa.percentage) if qa.percentage else 0,
                "passed": bool(qa.passed),
                "attempt_number": qa.attempt_number,
                "attempted_at": qa.attempted_at.isoformat() if qa.attempted_at else None,
            })

        streak = db.query(LearningStreak).filter(LearningStreak.user_id == user_id).first()
        streak_data = {
            "current_streak": streak.current_streak if streak else 0,
            "longest_streak": streak.longest_streak if streak else 0,
            "total_learning_days": streak.total_learning_days if streak else 0,
            "freezes": streak.freezes if streak else 0,
            "last_activity_date": streak.last_activity_date.isoformat() if streak and streak.last_activity_date else None,
        }

        user_badges = (
            db.query(UserBadge)
            .filter(UserBadge.user_id == user_id)
            .order_by(UserBadge.earned_at.desc())
            .all()
        )
        badges = []
        for ub in user_badges:
            badge = db.query(Badge).filter(Badge.badge_id == ub.badge_id).first()
            badges.append({
                "badge_id": ub.badge_id,
                "badge_name": badge.badge_name if badge else f"Badge {ub.badge_id}",
                "tier": badge.tier if badge else "Unknown",
                "earned_at": ub.earned_at.isoformat() if ub.earned_at else None,
            })

        certs = (
            db.query(Certificate)
            .filter(Certificate.user_id == user_id)
            .order_by(Certificate.issued_at.desc())
            .all()
        )
        certificates = [
            {
                "certificate_id": c.id,
                "certificate_number": c.certificate_number,
                "program_name": c.program_name,
                "completion_date": c.completion_date.isoformat() if c.completion_date else None,
                "issued_at": c.issued_at.isoformat() if c.issued_at else None,
            }
            for c in certs
        ]

        activity = (
            db.query(AuditLog)
            .filter(AuditLog.actor_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(20)
            .all()
        )
        recent_activity = [
            {
                "action": a.action,
                "message": a.message,
                "entity_type": a.entity_type,
                "entity_id": a.entity_id,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in activity
        ]

        avg_quiz_score = sum(q["score"] for q in quizzes) / len(quizzes) if quizzes else 0

        summary = {
            "total_programs_enrolled": len(programs),
            "programs_completed": len([p for p in programs if p["completed"]]),
            "programs_in_progress": len([p for p in programs if not p["completed"]]),
            "avg_quiz_score": round(avg_quiz_score, 2),
            "total_quizzes_taken": len(quizzes),
            "total_badges": len(badges),
            "total_certificates": len(certificates),
            "current_streak": streak_data["current_streak"],
            "total_curos": learner.curos or 0,
        }

        return {
            "profile": profile,
            "summary": summary,
            "programs": programs,
            "quizzes": quizzes,
            "streak": streak_data,
            "badges": badges,
            "certificates": certificates,
            "recent_activity": recent_activity,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_learner_full_report: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error loading learner report: {str(e)}")


# =========================================================
# Get report by id + download
# =========================================================
@router.get("/{report_id}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    try:
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)

        report = report_service.get_report_by_id(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        report_model = db.query(Report).filter(Report.id == report_id).first()
        if not report_service.can_access_report_row(current_user_id, user.role_id, report_model):
            raise HTTPException(status_code=403, detail="You do not have access to this report")

        return {"report": report}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_report: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    try:
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)

        report = report_service.get_report_by_id(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        report_model = db.query(Report).filter(Report.id == report_id).first()
        if not report_service.can_access_report_row(current_user_id, user.role_id, report_model):
            raise HTTPException(status_code=403, detail="You do not have access to this report")

        download_url = report_service.get_report_download_url(report_id)

        if download_url.startswith("file://"):
            storage_service = StorageService()
            local_path = storage_service._get_local_path(report_model.storage_path)
            if not os.path.exists(local_path):
                raise HTTPException(status_code=404, detail="PDF file not found")
            return FileResponse(
                local_path,
                media_type="application/pdf",
                filename=f"report_{report_id}.pdf",
            )

        return {"download_url": download_url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in download_report: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating download URL: {str(e)}")


# =========================================================
# Regenerate with AI (legacy — kept for compatibility)
# =========================================================
@router.post("/{report_id}/ai-insights")
async def regenerate_with_ai_insights(
    report_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    try:
        user = get_user_from_db(db, current_user_id)
        service = ReportService(db)

        updated_report = await service.regenerate_with_ai_insights(
            report_id=report_id,
            user_id=current_user_id,
            role_id=user.role_id,
        )
        return updated_report

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in regenerate_with_ai_insights: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to regenerate report: {str(e)}")


@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    try:
        user = get_user_from_db(db, current_user_id)
        service = ReportService(db)

        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        if not service.can_access_report_row(current_user_id, user.role_id, report):
            raise HTTPException(status_code=403, detail="Not authorized to delete this report")

        if report.storage_path:
            storage_service = StorageService()
            storage_service.delete_report_pdf(report.storage_path)

        db.delete(report)
        db.commit()
        return {"message": "Report deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_report: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))