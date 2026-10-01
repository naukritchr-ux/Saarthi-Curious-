import copy
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, List
from models import Report, User
from .report_queries import (
    get_user_learning_report,
    get_team_progress_report,
    get_franchise_performance_report,
    get_franchise_learning_report,
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

    # ----------------------------------------------------------
    # Report catalog — 6 reports matching the RBAC matrix
    # ----------------------------------------------------------
    REPORT_CATALOG = {
        "org_learning": {
            "id": "organization_learning_report",
            "title": "Organization Learning Report",
            "subtitle": "Organization-wide Learning Analytics",
            "description": "Complete organization-wide learning metrics",
            "roles": [1, 2],
            "filter_schema": {
                "scope": {"type": "fixed", "value": "organization"},
                "time_range": {"type": "select",
                               "options": ["today", "last_month", "all_time", "custom"],
                               "default": "all_time"},
                "custom_range": {"type": "date_range", "enabled": True},
            },
        },
        "franchise_performance": {
            "id": "franchise_performance_report",
            "title": "Franchise Performance Report",
            "subtitle": "Franchise Performance Metrics",
            "description": "Compare performance across franchises and their employees",
            "roles": [1, 2, 4, 6],
            "filter_schema": {
                "scope": {"type": "franchise_select", "default": "all", "allow_all": True},
                "time_range": {"type": "select",
                               "options": ["today", "last_month", "all_time", "custom"],
                               "default": "all_time"},
                "custom_range": {"type": "date_range", "enabled": True},
            },
        },
        "learner_engagement": {
            "id": "learner_engagement_report",
            "title": "Learner Engagement Report",
            "subtitle": "Individual Learner Engagement",
            "description": "Track engagement for individual learners",
            "roles": [1, 2, 3, 4],
            "filter_schema": {
                "scope": {"type": "learner_select", "default": "all", "allow_all": True},
                "time_range": {"type": "select",
                               "options": ["today", "last_month", "all_time", "custom"],
                               "default": "all_time"},
                "custom_range": {"type": "date_range", "enabled": True},
            },
        },
        "my_learning": {
            "id": "my_learning_report",
            "title": "My Learning Report",
            "subtitle": "Personal Learning Progress",
            "description": "Your personal learning progress and achievements",
            "roles": [3, 4, 5, 6, 7],
            "filter_schema": {
                "scope": {"type": "fixed", "value": "self"},
                "time_range": {"type": "select",
                               "options": ["today", "last_month", "all_time"],
                               "default": "all_time"},
                "custom_range": {"type": "date_range", "enabled": False},
            },
        },
        "franchise_learning": {
            "id": "franchise_learning_report",
            "title": "Franchise Learning Report",
            "subtitle": "Learners Under Your Franchise",
            "description": "Learning progress of learners within your franchise",
            "roles": [1, 2, 4, 6],
            "filter_schema": {
                "scope": {"type": "franchise_select", "default": "self", "allow_all": True},
                "time_range": {"type": "select",
                               "options": ["today", "last_month", "all_time", "custom"],
                               "default": "all_time"},
                "custom_range": {"type": "date_range", "enabled": True},
            },
        },
        "team_progress": {
            "id": "team_progress_report",
            "title": "Team Progress Report",
            "subtitle": "Team Learning Overview",
            "description": "Overview of your team's learning progress",
            "roles": [1, 2, 3, 6],
            "filter_schema": {
                "scope": {"type": "team_leader_select", "default": "self", "allow_all": False},
                "time_range": {"type": "select",
                               "options": ["today", "last_month", "all_time", "custom"],
                               "default": "all_time"},
                "custom_range": {"type": "date_range", "enabled": True},
            },
        },
    }

    REPORT_TYPES = {c["id"]: c for c in REPORT_CATALOG.values()}

    def __init__(self, db: Session):
        self.db = db
        self.pdf_generator = PDFGenerator()
        self.storage_service = StorageService()
        self._gemini_provider = None
        self._groq_provider = None
        self.query_builder = QueryBuilder(db)
        self.computation_engine = ComputationEngine(db)

    # ==========================================
    # AI providers
    # ==========================================

    def _get_gemini_provider(self) -> Optional[GeminiProvider]:
        if self._gemini_provider is None:
            try:
                self._gemini_provider = GeminiProvider()
            except Exception as e:
                print(f"Error initializing Gemini: {e}")
                self._gemini_provider = None
        return self._gemini_provider

    def _get_groq_provider(self) -> Optional[GroqProvider]:
        if self._groq_provider is None:
            try:
                self._groq_provider = GroqProvider()
            except Exception as e:
                print(f"Error initializing Groq: {e}")
                self._groq_provider = None
        return self._groq_provider

    async def _generate_ai_insights_with_fallback(self, data: Dict[str, Any]) -> Dict[str, Any]:
        gemini = self._get_gemini_provider()
        groq = self._get_groq_provider()
        errors = []

        # Try Gemini first
        if gemini and await gemini.is_available():
            try:
                print("Attempting to generate AI insights with Gemini...")
                result = await gemini.generate_insights(data)
                print("Gemini generation successful")
                return result
            except Exception as e:
                errors.append(f"Gemini failed: {e}")
        elif gemini:
            errors.append("Gemini not available")
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
                errors.append(f"Groq failed: {e}")
        elif groq:
            errors.append("Groq not available")
        else:
            errors.append("Groq provider not initialized")

        providers = [p for p in (gemini, groq) if p is not None]
        if providers and all(getattr(p, "api_key", None) in {"g_987key", "g_123key"}
                             for p in providers):
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

        raise Exception(f"Both AI providers failed: {'; '.join(errors)}")

    # ==========================================
    # Report availability and history
    # ==========================================

    def get_available_reports(self, role_id: int, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        user = None
        date_of_joining = None
        if user_id:
            user = self.db.query(User).filter(User.user_id == user_id).first()
            if user:
                date_of_joining = user.date_of_joining

        available = []
        for _, catalog_entry in self.REPORT_CATALOG.items():
            if role_id not in catalog_entry["roles"]:
                continue

            report_def = {
                "id": catalog_entry["id"],
                "title": catalog_entry["title"],
                "description": catalog_entry["description"],
                "filter_schema": self._get_dynamic_filter_schema(
                    catalog_entry["filter_schema"], role_id, date_of_joining
                ),
                "icon": self._get_icon_for_report(catalog_entry["id"]),
            }

            if not user_id:
                available.append(report_def)
                continue

            rt = catalog_entry["id"]
            if rt == "team_progress_report":
                report_def["selector_options"] = self._get_team_leader_options(role_id, user_id)
            elif rt in ("franchise_performance_report", "franchise_learning_report"):
                report_def["selector_options"] = self._get_franchise_user_options(role_id, user_id)
            elif rt == "program_performance_report":
                report_def["selector_options"] = self._get_program_options(role_id)
            elif rt == "learner_engagement_report":
                report_def["selector_options"] = self._get_learner_options(role_id, user_id)

            available.append(report_def)
        return available

    def get_report_history(self, user_id: int, role_id: int) -> List[Dict[str, Any]]:
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return []

        query = self.db.query(Report).filter(Report.generated_by == user_id)

        if role_id in [1, 2]:
            pass
        elif role_id in [3, 6]:
            team_member_ids = [id[0] for id in self.db.query(User.user_id).filter(
                User.Team_Leader_id == user_id
            ).all()]
            query = query.filter(or_(
                Report.generated_by == user_id,
                Report.generated_for.in_(team_member_ids) if team_member_ids else False
            ))
        elif role_id == 4:
            employee_ids = [id[0] for id in self.db.query(User.user_id).filter(
                User.Team_Leader_id == user_id, User.role_id == 5
            ).all()]
            query = query.filter(or_(
                Report.generated_by == user_id,
                Report.generated_for.in_(employee_ids) if employee_ids else False
            ))

        reports = query.order_by(Report.generated_at.desc()).limit(50).all()

        return [
            {
                "id": r.id,
                "title": r.title,
                "report_type": r.report_type,
                "generated_at": r.generated_at.isoformat() if r.generated_at else None,
                "period_start": r.period_start.isoformat() if r.period_start else None,
                "period_end": r.period_end.isoformat() if r.period_end else None,
                "status": r.status,
                "generated_for": r.generated_for,
                "ai_summary": r.ai_summary
            }
            for r in reports
        ]

    # ==========================================
    # Dynamic filter schemas + selector options
    # ==========================================

    def _get_dynamic_filter_schema(self, filter_schema: Dict[str, Any],
                                   role_id: int,
                                   date_of_joining: Optional[date]) -> Dict[str, Any]:
        dynamic_schema = copy.deepcopy(filter_schema)
        time_range = dynamic_schema.setdefault("time_range", {})

        base_options = ["today", "all_time"]
        conditional = []
        if date_of_joining:
            today = datetime.now().date()
            if date_of_joining <= today - timedelta(days=365):
                conditional.append("last_year")
            if date_of_joining <= today - timedelta(days=30):
                conditional.append("last_month")
            if date_of_joining <= today - timedelta(days=7):
                conditional.append("last_week")

        options = base_options + conditional
        if role_id in (1, 2, 3, 6):
            options.append("custom")
            dynamic_schema["custom_range"] = {"type": "date_range", "enabled": True}
        else:
            dynamic_schema["custom_range"] = {"type": "date_range", "enabled": False}

        time_range["options"] = options
        return dynamic_schema

    def _get_team_leader_options(self, role_id: int, user_id: int) -> List[Dict[str, Any]]:
        """
        Options for Team Progress Report — pick a team leader (role 3).

        - Admin/Master (1,2): every team leader.
        - Team Leader (3): themselves only.
        - Franchise Developer (6): themselves as the team anchor.
        """
        if role_id in (1, 2):
            leaders = (
                self.db.query(User)
                .filter(User.role_id == 3)
                .order_by(User.full_name)
                .all()
            )
            return [{"id": None, "name": "(all team leaders)"}] + [
                {"id": l.user_id, "name": l.full_name} for l in leaders
            ]

        if role_id in (3, 6):
            me = self.db.query(User).filter(User.user_id == user_id).first()
            return [{"id": me.user_id, "name": me.full_name}] if me else []

        return []

    def _get_franchise_user_options(self, role_id: int, user_id: int) -> List[Dict[str, Any]]:
        """
        Options for Franchise Performance & Franchise Learning reports —
        pick a franchise (proxied by the Franchise Partner's user_id, role 4).

        - Admin/Master (1,2): every franchise partner.
        - Franchise Developer (6): their franchise partners only.
        - Franchise Partner (4): themselves only.
        """
        if role_id in (1, 2):
            partners = (
                self.db.query(User)
                .filter(User.role_id == 4)
                .order_by(User.full_name)
                .all()
            )
        elif role_id == 6:
            partners = (
                self.db.query(User)
                .filter(User.Team_Leader_id == user_id, User.role_id == 4)
                .order_by(User.full_name)
                .all()
            )
        elif role_id == 4:
            partners = (
                self.db.query(User)
                .filter(User.user_id == user_id)
                .all()
            )
        else:
            partners = []

        return [{"id": None, "name": "(all franchises)"}] + [
            {"id": p.user_id, "name": p.full_name} for p in partners
        ]


    def _get_program_options(self, role_id: int) -> List[Dict[str, Any]]:
        if role_id in (1, 2):
            from models import Program
            programs = self.db.query(Program).filter(Program.status == "Published").all()
            return [{"id": None, "name": "(all programs)"}] + \
                   [{"id": p.id, "name": p.name} for p in programs]
        return []

    def _get_learner_options(self, role_id: int, user_id: int) -> List[Dict[str, Any]]:
        """
        Options for Learner Engagement Report — pick any individual user.

        - Admin/Master (1,2): every user in the system.
        - Team Leader (3): self + direct reports + their reports.
        - Franchise Developer (6): self + their partners + their partners' employees.
        - Franchise Partner (4): self + their employees.
        """
        if role_id in (1, 2):
            learners = self.db.query(User).order_by(User.full_name).all()

        elif role_id == 3:
            direct = [
                d[0] for d in self.db.query(User.user_id)
                .filter(User.Team_Leader_id == user_id).all()
            ]
            ids = {user_id, *direct}
            if direct:
                emps = [
                    e[0] for e in self.db.query(User.user_id)
                    .filter(User.Team_Leader_id.in_(direct)).all()
                ]
                ids.update(emps)
            learners = (
                self.db.query(User)
                .filter(User.user_id.in_(ids))
                .order_by(User.full_name)
                .all()
            )

        elif role_id == 6:
            partners = [
                p[0] for p in self.db.query(User.user_id)
                .filter(User.Team_Leader_id == user_id, User.role_id == 4).all()
            ]
            ids = {user_id, *partners}
            if partners:
                emps = [
                    e[0] for e in self.db.query(User.user_id)
                    .filter(User.Team_Leader_id.in_(partners), User.role_id == 5).all()
                ]
                ids.update(emps)
            learners = (
                self.db.query(User)
                .filter(User.user_id.in_(ids))
                .order_by(User.full_name)
                .all()
            )

        elif role_id == 4:
            emps = [
                e[0] for e in self.db.query(User.user_id)
                .filter(User.Team_Leader_id == user_id, User.role_id == 5).all()
            ]
            ids = {user_id, *emps}
            learners = (
                self.db.query(User)
                .filter(User.user_id.in_(ids))
                .order_by(User.full_name)
                .all()
            )

        else:
            learners = []

        return [{"id": None, "name": "(all users)"}] + [
            {"id": l.user_id, "name": l.full_name} for l in learners
        ]

    def _get_icon_for_report(self, report_type: str) -> str:
        return {
            "my_learning_report": "User",
            "team_progress_report": "Users",
            "franchise_performance_report": "Building",
            "franchise_learning_report": "Building2",
            "organization_learning_report": "BarChart",
            "program_performance_report": "BookOpen",
            "learner_engagement_report": "TrendingUp",
        }.get(report_type, "FileText")

    # ==========================================
    # Scope resolution
    # ==========================================

    def _compute_allowed_user_ids(self, role_id: int, user_id: int) -> Optional[List[int]]:
        """
        Return the list of user_ids this requester may see, or None for 'all'.
        """
        if role_id in (1, 2):
            return None

        allowed = {user_id}

        if role_id == 3:  # Team Leader
            direct = [d[0] for d in self.db.query(User.user_id).filter(
                User.Team_Leader_id == user_id
            ).all()]
            allowed.update(direct)
            if direct:
                emps = [e[0] for e in self.db.query(User.user_id).filter(
                    User.Team_Leader_id.in_(direct)
                ).all()]
                allowed.update(emps)

        elif role_id == 4:  # Franchise Partner
            emps = [e[0] for e in self.db.query(User.user_id).filter(
                User.Team_Leader_id == user_id, User.role_id == 5
            ).all()]
            allowed.update(emps)

        elif role_id == 6:  # Franchise Developer
            partners = [p[0] for p in self.db.query(User.user_id).filter(
                User.Team_Leader_id == user_id, User.role_id == 4
            ).all()]
            allowed.update(partners)
            if partners:
                emps = [e[0] for e in self.db.query(User.user_id).filter(
                    User.Team_Leader_id.in_(partners), User.role_id == 5
                ).all()]
                allowed.update(emps)

        # Roles 5, 7: self only
        return list(allowed)

    # ==========================================
    # Report data dispatch
    # ==========================================

    def _get_report_data(
        self,
        report_type: str,
        requester_user_id: int,
        requester_role_id: int,
        generated_for: Optional[int],
        period_start: Optional[date],
        period_end: Optional[date],
    ) -> Dict[str, Any]:
        allowed = self._compute_allowed_user_ids(requester_role_id, requester_user_id)

        if report_type == "my_learning_report":
            return get_user_learning_report(
                self.db, requester_user_id, period_start, period_end
            )

        if report_type == "team_progress_report":
            if requester_role_id in (1, 2):
                team_leader_id = generated_for  # None = all teams
            else:
                team_leader_id = requester_user_id
            return get_team_progress_report(
                self.db, team_leader_id, period_start, period_end, allowed
            )

        if report_type == "franchise_performance_report":
            return get_franchise_performance_report(
                self.db, generated_for, period_start, period_end, allowed
            )

        if report_type == "franchise_learning_report":
            return get_franchise_learning_report(
                self.db, generated_for, period_start, period_end,
                requester_role_id, requester_user_id
            )

        if report_type == "organization_learning_report":
            return get_organization_learning_report(self.db, period_start, period_end)

        if report_type == "program_performance_report":
            return get_program_performance_report(self.db, None, period_start, period_end)

        if report_type == "learner_engagement_report":
            return get_learner_engagement_report(
                self.db, generated_for, period_start, period_end, allowed
            )

        raise ValueError(f"Unknown report type: {report_type}")

    def _parse_period_filters(self, filters: Optional[Dict[str, Any]]):
        if not filters:
            return None, None

        tr = filters.get("time_range")
        cs, ce = filters.get("custom_start"), filters.get("custom_end")
        today = date.today()

        if tr == "custom" and cs and ce:
            try:
                return date.fromisoformat(cs), date.fromisoformat(ce)
            except ValueError:
                raise ValueError("Invalid custom date format. Use YYYY-MM-DD")
        if tr == "today":
            return today, today
        if tr == "last_week":
            return today - timedelta(days=7), today
        if tr == "last_month":
            first = today.replace(day=1)
            last_month_end = first - timedelta(days=1)
            return last_month_end.replace(day=1), last_month_end
        if tr == "last_year":
            return today - timedelta(days=365), today
        return None, None

    # ==========================================
    # Authorization helpers
    # ==========================================

    def can_access_report_type(self, role_id: int, report_type: str) -> bool:
        if report_type not in self.REPORT_TYPES:
            return False
        return role_id in self.REPORT_TYPES[report_type]["roles"]

    def can_access_report_row(self, user_id: int, role_id: int, report: Report) -> bool:
        if report.generated_by == user_id:
            return True
        if role_id in [1, 2]:
            return True
        if role_id in [3, 6]:
            if report.generated_for:
                member = self.db.query(User).filter(
                    User.user_id == report.generated_for,
                    User.Team_Leader_id == user_id
                ).first()
                return member is not None
        if role_id == 4:
            if report.generated_for:
                member = self.db.query(User).filter(
                    User.user_id == report.generated_for,
                    User.Team_Leader_id == user_id,
                    User.role_id == 5
                ).first()
                return member is not None
        return False

    # ==========================================
    # Report lookup / download
    # ==========================================

    def get_report_by_id(self, report_id: int) -> Optional[Dict[str, Any]]:
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
            "generated_at": report.generated_at.strftime("%Y-%m-%d %H:%M:%S") if report.generated_at else None,
            "period_start": report.period_start.strftime("%Y-%m-%d") if report.period_start else None,
            "period_end": report.period_end.strftime("%Y-%m-%d") if report.period_end else None,
            "status": report.status,
            "ai_summary": report.ai_summary
        }

    def get_report_download_url(self, report_id: int) -> str:
        report = self.db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise ValueError(f"Report {report_id} not found")
        return self.storage_service.get_report_download_url(report.storage_path)

    # ==========================================
    # Generation
    # ==========================================

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
        if report_type not in self.REPORT_TYPES:
            raise ValueError(f"Invalid report type: {report_type}")

        if role_id not in self.REPORT_TYPES[report_type]["roles"]:
            raise ValueError(f"Role {role_id} not authorized for report type {report_type}")

        # my_learning is always for self
        if report_type == "my_learning_report":
            generated_for = None

        data = self._get_report_data(
            report_type=report_type,
            requester_user_id=user_id,
            requester_role_id=role_id,
            generated_for=generated_for,
            period_start=period_start,
            period_end=period_end,
        )

        ai_summary = None
        if include_ai:
            try:
                ai_summary = await self._generate_ai_insights_with_fallback(data)
            except Exception as e:
                print(f"AI generation failed: {e}")

        pdf_bytes = self.pdf_generator.generate_pdf(
            report_type=report_type,
            data=data,
            title=self.REPORT_TYPES[report_type]["title"],
            subtitle=self.REPORT_TYPES[report_type]["subtitle"],
            period_start=period_start.strftime("%Y-%m-%d") if period_start else None,
            period_end=period_end.strftime("%Y-%m-%d") if period_end else None,
            ai_summary=ai_summary
        )

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
        report = self.db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise ValueError(f"Report {report_id} not found")

        if not self.can_access_report_row(user_id, role_id, report):
            raise ValueError(f"Not authorized to access report {report_id}")

        data = self._get_report_data(
            report_type=report.report_type,
            requester_user_id=user_id,
            requester_role_id=role_id,
            generated_for=report.generated_for,
            period_start=report.period_start,
            period_end=report.period_end,
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
        report = self.db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return False
        self.storage_service.delete_report_pdf(report.storage_path)
        self.db.delete(report)
        self.db.commit()
        return True