from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
from database import get_db
from models import User, Report
from services.reports import ReportService
from services.reports.storage_service import StorageService
from services.reports.report_queries import (
    get_user_learning_report,
    get_team_progress_report,
    get_franchise_performance_report,
    get_organization_learning_report,
    get_program_performance_report,
    get_learner_engagement_report
)
from auth import get_current_user
import traceback
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# Pydantic models
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


def get_user_from_db(db: Session, user_id: int) -> User:
    """Get user from database"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/")
def get_available_reports(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Get report types available for the user's role."""
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
    """Get user's report generation history."""
    try:
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)
        
        history = report_service.get_report_history(current_user_id, user.role_id)
        return {"reports": history}
    except Exception as e:
        logger.error(f"Error in get_report_history: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/preview")
async def preview_report(
    request: PreviewReportRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    Preview report data without PDF generation.
    """
    try:
        logger.info(f"Preview request: {request.report_type} for user {current_user_id}")
        
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)

        # Parse period dates
        period_start, period_end = report_service._parse_period_filters(request.filters)

        # Determine target user
        target_user_id = request.generated_for or current_user_id

        # Get the preview data
        preview_data = {}
        
        if request.report_type == "my_learning_report":
            preview_data = get_user_learning_report(db, target_user_id, period_start, period_end)
        elif request.report_type == "team_progress_report":
            preview_data = get_team_progress_report(db, target_user_id if request.generated_for else None, period_start, period_end)
        elif request.report_type == "franchise_performance_report":
            preview_data = get_franchise_performance_report(db, target_user_id if request.generated_for else None, period_start, period_end)
        elif request.report_type == "organization_learning_report":
            preview_data = get_organization_learning_report(db, period_start, period_end)
        elif request.report_type == "program_performance_report":
            program_id = request.filters.get("generated_for") if request.filters else None
            preview_data = get_program_performance_report(db, program_id, period_start, period_end)
        elif request.report_type == "learner_engagement_report":
            learner_id = request.filters.get("generated_for") if request.filters else None
            preview_data = get_learner_engagement_report(db, learner_id, period_start, period_end)
        else:
            preview_data = {"summary": {"message": "Report type not recognized"}}

        # Return preview data
        return {"data": preview_data, "report": None}
        
    except Exception as e:
        logger.error(f"Error in preview_report: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error previewing report: {str(e)}")


@router.post("/generate")
async def generate_report(
    request: GenerateReportRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Generate report with PDF."""
    try:
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)

        # Parse dates
        period_start = None
        period_end = None
        if request.period_start:
            period_start = date.fromisoformat(request.period_start)
        if request.period_end:
            period_end = date.fromisoformat(request.period_end)

        # Generate the report
        report = await report_service.generate_report(
            report_type=request.report_type,
            user_id=current_user_id,
            role_id=user.role_id,
            period_start=period_start,
            period_end=period_end,
            include_ai=request.include_ai,
            generated_for=request.generated_for
        )

        return {"report": report}
        
    except Exception as e:
        logger.error(f"Error in generate_report: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@router.get("/{report_id}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Get report metadata by ID."""
    try:
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)
        
        report = report_service.get_report_by_id(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Check access
        report_model = db.query(Report).filter(Report.id == report_id).first()
        if not report_service.can_access_report_row(current_user_id, user.role_id, report_model):
            raise HTTPException(status_code=403, detail="You do not have access to this report")
        
        return {"report": report}
        
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
    """Download report PDF."""
    try:
        user = get_user_from_db(db, current_user_id)
        report_service = ReportService(db)
        
        report = report_service.get_report_by_id(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Check access
        report_model = db.query(Report).filter(Report.id == report_id).first()
        if not report_service.can_access_report_row(current_user_id, user.role_id, report_model):
            raise HTTPException(status_code=403, detail="You do not have access to this report")
        
        # Get download URL
        download_url = report_service.get_report_download_url(report_id)
        return {"download_url": download_url}
        
    except Exception as e:
        logger.error(f"Error in download_report: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating download URL: {str(e)}")


@router.post("/{report_id}/ai-insights")
async def regenerate_with_ai_insights(
    report_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Regenerate a report with AI insights."""
    try:
        user = get_user_from_db(db, current_user_id)
        service = ReportService(db)

        updated_report = await service.regenerate_with_ai_insights(
            report_id=report_id,
            user_id=current_user_id,
            role_id=user.role_id
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
    """Delete a report."""
    try:
        user = get_user_from_db(db, current_user_id)
        service = ReportService(db)
        
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if not service.can_access_report_row(current_user_id, user.role_id, report):
            raise HTTPException(status_code=403, detail="Not authorized to delete this report")
        
        # Delete from storage
        if report.storage_path:
            storage_service = StorageService()
            storage_service.delete_report_pdf(report.storage_path)
        
        db.delete(report)
        db.commit()
        
        return {"message": "Report deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error in delete_report: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))