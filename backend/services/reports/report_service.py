from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from models import Report, User
from .report_queries import (
    get_user_learning_report,
    get_team_progress_report,
    get_franchise_performance_report,
    get_organization_learning_report,
    get_program_performance_report,
    get_learner_engagement_report
)
from .query_builder import QueryBuilder
from .computation_engine import ComputationEngine
from .pdf_generator import PDFGenerator
from .storage_service import StorageService
from services.ai.gemini_provider import GeminiProvider
from services.ai.groq_provider import GroqProvider


class ReportService:
    """Orchestration layer for report generation"""
    
    # Canonical report catalog (A-G) with exact role visibility matrix
    REPORT_CATALOG = {
        "A": {
            "id": "my_learning_report",
            "title": "My Learning Report",
            "subtitle": "Personal Learning Progress",
            "description": "Personal learning progress and achievements",
            "roles": [3, 4, 5, 6, 7],
            "filter_schema": {
                "scope": {"type": "fixed", "value": "self"},
                "time_range": {
                    "type": "select",
                    "options": ["today", "last_month", "all_time"],
                    "default": "all_time"
                },
                "custom_range": {"type": "date_range", "enabled": False}
            }
        },
        "B": {
            "id": "team_progress_report",
            "title": "Team Progress Report",
            "subtitle": "Team Learning Overview",
            "description": "Overview of team learning progress",
            "roles": [1, 2, 3, 6],
            "filter_schema": {
                "scope": {
                    "type": "user_select",
                    "role_filter": "team_leader",
                    "default": "self"
                },
                "time_range": {
                    "type": "select",
                    "options": ["today", "last_month", "all_time", "custom"],
                    "default": "all_time"
                },
                "custom_range": {"type": "date_range", "enabled": True}
            }
        },
        "C": {
            "id": "franchise_performance_report",
            "title": "Franchise Performance Report",
            "subtitle": "Franchise Performance Metrics",
            "description": "Aggregate performance metrics",
            "roles": [1, 2, 3, 4, 6],
            "filter_schema": {
                "scope": {
                    "type": "user_select",
                    "role_filter": "franchise_user",
                    "default": "self"
                },
                "time_range": {
                    "type": "select",
                    "options": ["today", "last_month", "all_time", "custom"],
                    "default": "all_time"
                },
                "custom_range": {"type": "date_range", "enabled": True}
            }
        },
        "E": {
            "id": "organization_learning_report",
            "title": "Organization Learning Report",
            "subtitle": "Organization Learning Analytics",
            "description": "Detailed organization analytics",
            "roles": [1, 2],
            "filter_schema": {
                "scope": {"type": "fixed", "value": "organization"},
                "time_range": {
                    "type": "select",
                    "options": ["today", "last_month", "all_time", "custom"],
                    "default": "all_time"
                },
                "custom_range": {"type": "date_range", "enabled": True}
            }
        },
        "F": {
            "id": "program_performance_report",
            "title": "Program Performance Report",
            "subtitle": "Program Performance Metrics",
            "description": "Program completion and performance",
            "roles": [1, 2],
            "filter_schema": {
                "scope": {
                    "type": "user_select",
                    "role_filter": "program",
                    "default": "all"
                },
                "time_range": {
                    "type": "select",
                    "options": ["today", "last_month", "all_time", "custom"],
                    "default": "all_time"
                },
                "custom_range": {"type": "date_range", "enabled": True}
            }
        },
        "G": {
            "id": "learner_engagement_report",
            "title": "Learner Engagement Report",
            "subtitle": "Learner Engagement Metrics",
            "description": "Engagement metrics and activity",
            "roles": [1, 2, 3, 4, 6],
            "filter_schema": {
                "scope": {
                    "type": "user_select",
                    "role_filter": "learner",
                    "default": "all"
                },
                "time_range": {
                    "type": "select",
                    "options": ["today", "last_month", "all_time", "custom"],
                    "default": "all_time"
                },
                "custom_range": {"type": "date_range", "enabled": True}
            }
        }
    }

    REPORT_TYPES = {catalog["id"]: catalog for catalog in REPORT_CATALOG.values()}
    
    def __init__(self, db: Session):
        self.db = db
        self.pdf_generator = PDFGenerator()
        self.storage_service = StorageService()
        self._gemini_provider = None
        self._groq_provider = None
        self.query_builder = QueryBuilder(db)
        self.computation_engine = ComputationEngine(db)
    
    def _get_gemini_provider(self) -> Optional[GeminiProvider]:
        """Lazy load Gemini provider"""
        if self._gemini_provider is None:
            try:
                self._gemini_provider = GeminiProvider()
            except Exception as e:
                print(f"Error initializing Gemini: {e}")
                self._gemini_provider = None
        return self._gemini_provider
    
    def _get_groq_provider(self) -> Optional[GroqProvider]:
        """Lazy load Groq provider"""
        if self._groq_provider is None:
            try:
                self._groq_provider = GroqProvider()
            except Exception as e:
                print(f"Error initializing Groq: {e}")
                self._groq_provider = None
        return self._groq_provider
    
    async def _generate_ai_insights_with_fallback(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate AI insights using Gemini as primary and Groq as fallback.
        """
        gemini = self._get_gemini_provider()
        groq = self._get_groq_provider()
        
        errors = []

        if gemini and getattr(gemini, "api_key", None) == "g_987key":
            errors.append("Gemini API key is placeholder-only; AI summary disabled")
        if groq and getattr(groq, "api_key", None) == "g_123key":
            errors.append("Groq API key is placeholder-only; AI summary disabled")

        # Try Gemini first
        if gemini and await gemini.is_available():
            try:
                print("Attempting to generate AI insights with Gemini...")
                result = await gemini.generate_insights(data)
                print("Gemini generation successful")
                return result
            except Exception as e:
                error_msg = f"Gemini failed: {str(e)}"
                print(error_msg)
                errors.append(error_msg)
        else:
            if gemini:
                errors.append(f"Gemini not available: {gemini.get_error_message() if hasattr(gemini, 'get_error_message') else 'Unknown error'}")
            else:
                errors.append("Gemini provider not initialized")
        
        # Fallback to Groq
        if groq and await groq.is_available():
            try:
                print("Attempting to generate AI insights with Groq...")
                result = await groq.generate_insights(data)
                print("Groq generation successful")
                return result
            except Exception as e:
                error_msg = f"Groq failed: {str(e)}"
                print(error_msg)
                errors.append(error_msg)
        else:
            if groq:
                errors.append(f"Groq not available: {groq.get_error_message() if hasattr(groq, 'get_error_message') else 'Unknown error'}")
            else:
                errors.append("Groq provider not initialized")

        if all(getattr(provider, "api_key", None) in {"g_987key", "g_123key"} for provider in [gemini, groq] if provider is not None):
            return {
                "executive_summary": "AI summary unavailable because placeholder API keys are currently configured.",
                "key_insights": ["Add a real Gemini or Groq key to enable AI-generated report insights."],
                "strengths": ["The report data is available and structured for review."],
                "areas_needing_attention": ["Configure a live AI key to unlock automated insights."],
                "recommendations": ["Replace placeholder keys with valid provider credentials in the backend environment."],
                "next_suggested_actions": ["Update GEMINI_API_KEY and GROQ_API_KEY before generating AI-enhanced reports."],
                "trends": [],
                "notable_achievements": [],
                "risks_or_concerns": []
            }
        
        # Both providers failed
        error_summary = "; ".join(errors)
        raise Exception(f"Both AI providers failed: {error_summary}")

    # ==========================================
    # Report Availability and History Methods
    # ==========================================

    def get_available_reports(self, role_id: int, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get report types available for a role with filter schema and scoped selector options.
        """
        # Get user's date of joining for dynamic time filters
        user = None
        date_of_joining = None
        if user_id:
            user = self.db.query(User).filter(User.user_id == user_id).first()
            if user:
                date_of_joining = user.date_of_joining

        available = []
        for report_key, catalog_entry in self.REPORT_CATALOG.items():
            if role_id in catalog_entry["roles"]:
                report_def = {
                    "id": catalog_entry["id"],
                    "title": catalog_entry["title"],
                    "description": catalog_entry["description"],
                    "filter_schema": self._get_dynamic_filter_schema(catalog_entry["filter_schema"], role_id, date_of_joining),
                    "icon": self._get_icon_for_report(catalog_entry["id"])
                }

                # Add scoped selector options for reports B, C, F, G
                if catalog_entry["id"] == "team_progress_report" and user_id:
                    report_def["selector_options"] = self._get_team_leader_options(role_id, user_id)
                elif catalog_entry["id"] == "franchise_performance_report" and user_id:
                    report_def["selector_options"] = self._get_franchise_user_options(role_id, user_id)
                elif catalog_entry["id"] == "program_performance_report" and user_id:
                    report_def["selector_options"] = self._get_program_options(role_id)
                elif catalog_entry["id"] == "learner_engagement_report" and user_id:
                    report_def["selector_options"] = self._get_learner_options(role_id, user_id)

                available.append(report_def)
        return available

    def get_report_history(self, user_id: int, role_id: int) -> List[Dict[str, Any]]:
        """
        Get report generation history for a user based on their scope.
        """
        # Get user for hierarchy context
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return []

        # Base query for user's own reports
        query = self.db.query(Report).filter(Report.generated_by == user_id)

        # If admin, also show reports they have access to via hierarchy
        if role_id in [1, 2]:
            # Admins see all reports
            pass
        elif role_id == 3:
            # Team leaders see their own reports + reports for their team members
            team_member_ids = self.db.query(User.user_id).filter(
                User.Team_Leader_id == user_id
            ).all()
            team_member_ids = [id[0] for id in team_member_ids]
            query = query.filter(
                or_(
                    Report.generated_by == user_id,
                    Report.generated_for.in_(team_member_ids)
                )
            )
        elif role_id in [4, 6]:
            # Franchise users see their own reports + reports for their franchise employees
            franchise_employee_ids = self.db.query(User.user_id).filter(
                User.Team_Leader_id == user_id,
                User.role_id == 5
            ).all()
            franchise_employee_ids = [id[0] for id in franchise_employee_ids]
            query = query.filter(
                or_(
                    Report.generated_by == user_id,
                    Report.generated_for.in_(franchise_employee_ids)
                )
            )
        # Role 5 (Franchise Employee) and 7 (Head Office Staff) only see their own reports

        reports = query.order_by(Report.generated_at.desc()).limit(50).all()

        return [
            {
                "id": report.id,
                "title": report.title,
                "report_type": report.report_type,
                "generated_at": report.generated_at.isoformat() if report.generated_at else None,
                "period_start": report.period_start.isoformat() if report.period_start else None,
                "period_end": report.period_end.isoformat() if report.period_end else None,
                "status": report.status,
                "generated_for": report.generated_for,
                "ai_summary": report.ai_summary
            }
            for report in reports
        ]

    def _get_dynamic_filter_schema(self, filter_schema: Dict[str, Any], role_id: int, date_of_joining: Optional[date]) -> Dict[str, Any]:
        """Get dynamic filter schema based on user's role and date of joining."""
        from datetime import datetime, timedelta

        dynamic_schema = filter_schema.copy()
        time_range = dynamic_schema.get("time_range", {}).copy()

        # Base options always available
        base_options = ["today", "all_time"]
        conditional_options = []

        if date_of_joining:
            today = datetime.now().date()
            one_year_ago = today - timedelta(days=365)
            one_month_ago = today - timedelta(days=30)
            one_week_ago = today - timedelta(days=7)

            if date_of_joining <= one_year_ago:
                conditional_options.append("last_year")
            if date_of_joining <= one_month_ago:
                conditional_options.append("last_month")
            if date_of_joining <= one_week_ago:
                conditional_options.append("last_week")

        all_options = base_options + conditional_options

        if role_id in [1, 2, 3]:
            all_options.append("custom")
            dynamic_schema["custom_range"] = {"type": "date_range", "enabled": True}
        else:
            dynamic_schema["custom_range"] = {"type": "date_range", "enabled": False}

        time_range["options"] = all_options
        dynamic_schema["time_range"] = time_range

        return dynamic_schema

    def _get_team_leader_options(self, role_id: int, user_id: int) -> List[Dict[str, Any]]:
        """Get team leader selector options based on role."""
        if role_id in [1, 2]:
            team_leaders = self.db.query(User).filter(User.role_id == 3).all()
            return [{"id": tl.user_id, "name": tl.full_name} for tl in team_leaders]
        elif role_id == 3:
            return []
        elif role_id == 6:
            return []
        return []

    def _get_franchise_user_options(self, role_id: int, user_id: int) -> List[Dict[str, Any]]:
        """Get franchise user selector options based on role."""
        if role_id in [1, 2]:
            franchise_partners = self.db.query(User).filter(User.role_id == 4).all()
            return [{"id": fp.user_id, "name": fp.full_name} for fp in franchise_partners]
        elif role_id == 3:
            franchise_partners = self.db.query(User).filter(
                User.Team_Leader_id == user_id,
                User.role_id == 4
            ).all()
            return [{"id": fp.user_id, "name": fp.full_name} for fp in franchise_partners]
        elif role_id == 6:
            franchise_partners = self.db.query(User).filter(User.role_id == 4).all()
            return [{"id": fp.user_id, "name": fp.full_name} for fp in franchise_partners]
        elif role_id == 4:
            return []
        return []

    def _get_program_options(self, role_id: int) -> List[Dict[str, Any]]:
        """Get program selector options based on role."""
        if role_id in [1, 2]:
            from models import Program
            programs = self.db.query(Program).filter(Program.status == "Published").all()
            options = [{"id": None, "name": "(all programs)"}]
            options.extend([{"id": p.id, "name": p.name} for p in programs])
            return options
        return []

    def _get_learner_options(self, role_id: int, user_id: int) -> List[Dict[str, Any]]:
        """Get learner selector options based on role."""
        if role_id in [1, 2]:
            learners = self.db.query(User).filter(User.role_id.in_([3, 4, 5, 6, 7])).all()
            options = [{"id": None, "name": "(all learners)"}]
            options.extend([{"id": l.user_id, "name": l.full_name} for l in learners])
            return options
        elif role_id == 3:
            learners = self.db.query(User).filter(
                User.Team_Leader_id == user_id,
                User.role_id.in_([4, 5])
            ).all()
            options = [{"id": None, "name": "(all learners)"}]
            options.extend([{"id": l.user_id, "name": l.full_name} for l in learners])
            return options
        elif role_id == 6:
            learners = self.db.query(User).filter(User.role_id.in_([4, 5])).all()
            options = [{"id": None, "name": "(all learners)"}]
            options.extend([{"id": l.user_id, "name": l.full_name} for l in learners])
            return options
        elif role_id == 4:
            learners = self.db.query(User).filter(
                User.Team_Leader_id == user_id,
                User.role_id == 5
            ).all()
            options = [{"id": None, "name": "(all learners)"}]
            options.extend([{"id": l.user_id, "name": l.full_name} for l in learners])
            return options
        return []

    def _get_icon_for_report(self, report_type: str) -> str:
        """Get icon name for report type."""
        icon_map = {
            "my_learning_report": "User",
            "team_progress_report": "Users",
            "franchise_performance_report": "Building",
            "organization_learning_report": "BarChart",
            "program_performance_report": "BookOpen",
            "learner_engagement_report": "TrendingUp"
        }
        return icon_map.get(report_type, "FileText")

    def _get_report_data(
        self,
        report_type: str,
        target_user_id: Optional[int],
        period_start: Optional[date],
        period_end: Optional[date]
    ) -> Dict[str, Any]:
        """Get report data based on report type."""
        if report_type == "my_learning_report":
            return get_user_learning_report(self.db, target_user_id, period_start, period_end)
        elif report_type == "team_progress_report":
            return get_team_progress_report(self.db, target_user_id, period_start, period_end)
        elif report_type == "franchise_performance_report":
            return get_franchise_performance_report(self.db, target_user_id, period_start, period_end)
        elif report_type == "organization_learning_report":
            return get_organization_learning_report(self.db, period_start, period_end)
        elif report_type == "program_performance_report":
            return get_program_performance_report(self.db, target_user_id, period_start, period_end)
        elif report_type == "learner_engagement_report":
            return get_learner_engagement_report(self.db, target_user_id, period_start, period_end)
        else:
            raise ValueError(f"Unknown report type: {report_type}")

    def _parse_period_filters(self, filters: Optional[Dict[str, Any]]) -> tuple:
        """Parse period filters to extract start and end dates."""
        if not filters:
            return None, None

        period_start = None
        period_end = None

        time_range = filters.get("time_range")
        custom_start = filters.get("custom_start")
        custom_end = filters.get("custom_end")

        if time_range == "custom" and custom_start and custom_end:
            try:
                period_start = date.fromisoformat(custom_start)
                period_end = date.fromisoformat(custom_end)
            except ValueError:
                raise ValueError("Invalid custom date format. Use YYYY-MM-DD")
        elif time_range == "today":
            today = date.today()
            period_start = today
            period_end = today
        elif time_range == "last_month":
            from datetime import timedelta
            today = date.today()
            first_day = today.replace(day=1)
            last_month = first_day - timedelta(days=1)
            period_start = last_month.replace(day=1)
            period_end = last_month

        return period_start, period_end

    # ==========================================
    # Authorization Helper Methods
    # ==========================================

    def can_access_report_type(self, role_id: int, report_type: str) -> bool:
        """Check if a role is authorized to access a report type."""
        if report_type not in self.REPORT_TYPES:
            return False
        return role_id in self.REPORT_TYPES[report_type]["roles"]

    def can_access_report_row(self, user_id: int, role_id: int, report: Report) -> bool:
        """Check if a user can access a specific report row."""
        if report.generated_by == user_id:
            return True

        if role_id in [1, 2]:
            return True

        if role_id == 3:
            if report.generated_for:
                team_member = self.db.query(User).filter(
                    User.user_id == report.generated_for,
                    User.Team_Leader_id == user_id
                ).first()
                return team_member is not None

        return False

    def can_generate_for_target(self, requester_role_id: int, requester_user_id: int, 
                                 target_user_id: int, report_type: str) -> bool:
        """Check if a user can generate a report for a specific target user."""
        if requester_user_id == target_user_id:
            return self.can_access_report_type(requester_role_id, report_type)

        target_user = self.db.query(User).filter(User.user_id == target_user_id).first()
        if not target_user:
            return False

        target_role_id = target_user.role_id

        if report_type == "team_progress_report":
            if requester_role_id in [1, 2]:
                return target_role_id == 3
            elif requester_role_id in [3, 6]:
                return False
            return False

        if report_type == "franchise_performance_report":
            if requester_role_id in [1, 2]:
                return target_role_id == 4
            elif requester_role_id in [3, 6]:
                franchise_user = self.db.query(User).filter(
                    User.user_id == target_user_id,
                    User.Team_Leader_id == requester_user_id,
                    User.role_id == 4
                ).first()
                return franchise_user is not None
            elif requester_role_id == 4:
                return False
            return False

        if report_type == "program_performance_report":
            return True

        if report_type == "learner_engagement_report":
            if requester_role_id in [1, 2]:
                return target_role_id in [3, 4, 5, 6, 7]
            elif requester_role_id == 3:
                learner = self.db.query(User).filter(
                    User.user_id == target_user_id,
                    User.Team_Leader_id == requester_user_id,
                    User.role_id.in_([4, 5])
                ).first()
                return learner is not None
            elif requester_role_id == 4:
                learner = self.db.query(User).filter(
                    User.user_id == target_user_id,
                    User.Team_Leader_id == requester_user_id,
                    User.role_id == 5
                ).first()
                return learner is not None
            elif requester_role_id == 6:
                learner = self.db.query(User).filter(
                    User.user_id == target_user_id,
                    User.role_id.in_([4, 5])
                ).first()
                return learner is not None
            return False

        return False

    # ==========================================
    # Report Generation Methods
    # ==========================================

    def get_report_by_id(self, report_id: int) -> Dict[str, Any]:
        """Get report metadata by ID."""
        report = self.db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return None

        return {
            "id": report.id,
            "title": report.title,
            "report_type": report.report_type,
            "generated_by": report.generated_by,
            "generated_for": report.generated_for,
            "role_id": report.role_id,
            "storage_path": report.storage_path,
            "generated_at": report.generated_at.strftime("%Y-%m-%d %H:%M:%S"),
            "period_start": report.period_start.strftime("%Y-%m-%d") if report.period_start else None,
            "period_end": report.period_end.strftime("%Y-%m-%d") if report.period_end else None,
            "status": report.status,
            "ai_summary": report.ai_summary
        }

    def get_report_download_url(self, report_id: int) -> str:
        """Get download URL for a report."""
        report = self.db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise ValueError(f"Report {report_id} not found")
        
        return self.storage_service.get_report_download_url(report.storage_path)

    async def generate_report(
        self,
        report_type: str,
        user_id: int,
        role_id: int,
        period_start: Optional[date] = None,
        period_end: Optional[date] = None,
        include_ai: bool = False,
        generated_for: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate a complete report with PDF."""
        if report_type not in self.REPORT_TYPES:
            raise ValueError(f"Invalid report type: {report_type}")
        
        if role_id not in self.REPORT_TYPES[report_type]["roles"]:
            raise ValueError(f"Role {role_id} not authorized for report type {report_type}")

        target_user_id = generated_for or user_id
        data = self._get_report_data(report_type, target_user_id, period_start, period_end)
        
        # Generate AI insights if requested
        ai_summary = None
        if include_ai:
            try:
                ai_summary = await self._generate_ai_insights_with_fallback(data)
            except Exception as e:
                print(f"AI generation failed: {e}")
        
        # Generate PDF
        pdf_bytes = self.pdf_generator.generate_pdf(
            report_type=report_type,
            data=data,
            title=self.REPORT_TYPES[report_type]["title"],
            subtitle=self.REPORT_TYPES[report_type]["subtitle"],
            period_start=period_start.strftime("%Y-%m-%d") if period_start else None,
            period_end=period_end.strftime("%Y-%m-%d") if period_end else None,
            ai_summary=ai_summary
        )
        
        # Save report
        report = Report(
            title=self.REPORT_TYPES[report_type]["title"],
            report_type=report_type,
            generated_by=user_id,
            generated_for=generated_for,
            role_id=role_id,
            storage_path="",
            period_start=period_start,
            period_end=period_end,
            status="completed",
            ai_summary=ai_summary
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        
        # Upload PDF
        storage_path = self.storage_service.upload_report_pdf(
            user_id=user_id,
            report_id=report.id,
            pdf_bytes=pdf_bytes,
            period_start=period_start.strftime("%Y-%m-%d") if period_start else None
        )
        
        report.storage_path = storage_path
        self.db.commit()
        self.db.refresh(report)

        return self.get_report_by_id(report.id)

    async def regenerate_with_ai_insights(self, report_id: int, user_id: int, role_id: int) -> Dict[str, Any]:
        """Regenerate a report with AI insights included."""
        report = self.db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise ValueError(f"Report {report_id} not found")
        
        if not self.can_access_report_row(user_id, role_id, report):
            raise ValueError(f"Not authorized to access report {report_id}")
        
        data = self._get_report_data(
            report_type=report.report_type,
            target_user_id=report.generated_for,
            period_start=report.period_start,
            period_end=report.period_end
        )
        
        try:
            ai_summary = await self._generate_ai_insights_with_fallback(data)
        except Exception as e:
            print(f"AI generation failed: {e}")
            raise ValueError("AI provider not available")
        
        pdf_bytes = self.pdf_generator.generate_pdf(
            report_type=report.report_type,
            data=data,
            title=report.title,
            subtitle=self.REPORT_TYPES[report.report_type]["subtitle"],
            period_start=report.period_start.strftime("%Y-%m-%d") if report.period_start else None,
            period_end=report.period_end.strftime("%Y-%m-%d") if report.period_end else None,
            ai_summary=ai_summary
        )
        
        storage_path = self.storage_service.upload_report_pdf(
            user_id=user_id,
            report_id=report.id,
            pdf_bytes=pdf_bytes,
            period_start=report.period_start.strftime("%Y-%m-%d") if report.period_start else None
        )
        
        report.storage_path = storage_path
        report.ai_summary = ai_summary
        report.generated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(report)
        
        return self.get_report_by_id(report.id)

    def delete_report(self, report_id: int) -> bool:
        """Delete a report."""
        report = self.db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return False
        
        self.storage_service.delete_report_pdf(report.storage_path)
        self.db.delete(report)
        self.db.commit()
        
        return True