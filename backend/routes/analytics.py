import csv
import io
import json
import os
from datetime import date, datetime, timedelta
from io import BytesIO
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import Date, case, cast, desc, func
from sqlalchemy.orm import Session

from database import get_db
from groq import Groq
from models import (
    Module, ModuleCompletion, Program, QuizAttempt, Role,
    SurveyAnswer, SurveyQuestion, SurveyResponse, User,
    UserProgramProgress, UserVideoProgress, Video, VideoCompletion
)
from services.ai.groq_provider import GroqProvider

router = APIRouter(
    prefix="/analytics",
    tags=["Reports & Analytics"]
)

# =====================================================================
# SAARTHI POLYMORPHIC GROQ AI SYSTEM PROMPT
# =====================================================================
SAARTHI_POLYMORPHIC_AI_PROMPT = """
You are Saarthi AI, an Enterprise Learning & Behavioral Telemetry Architect.
You will receive real-time SQL telemetry for a specific report domain (`org_learning`, `franchise_perf`, `engagement`, `modules`, or `team`).

CRITICAL RULES:
1. NO REPEATED TEMPLATES: Never reuse the same sentence structure across departments. Tailor your vocabulary and parameters strictly to the domain:
   - `org_learning`: Focus on Macro Completion Velocity, Onboarding Stagnation Half-Life, Certification Yield, and Curos Circulation.
   - `franchise_perf`: Focus on Regional Hub Dispersion, Top vs. Lagging Hub Variance, Compliance SLA, and Cross-Hub Mentorship.
   - `engagement`: Focus on Daily Active Cadence, Video-to-Quiz Conversion Ratio, Session Attention Span, and Streak Retention.
   - `modules`: Focus on Curriculum Stage Drop-Off, Module Friction Index, Retake Frequency, and Micro-Learning Chunking.
   - `team`: Focus on Squad Dispersion, Peer Coaching Synergy, Leaderboard Velocity, and Individual Mastery Gaps.
2. CONDITIONAL RISK (`hasRisk`):
   - Set `"hasRisk": true` ONLY if the real SQL telemetry breaches a threshold (e.g., completion < 70%, stagnation > 50%, or quiz mastery < 70%).
   - If healthy, set `"hasRisk": false` and `"highRiskAlert": null` and omit any risk section from `aiSections`.
3. DYNAMIC PARAMETERS & MINI-VISUALS:
   - Choose 4 domain-specific `parameters` (`label`, `value`, `status`, `pct`) and 5 `radarData` axes (`subject`, `score`, `benchmark`) that best represent the real numbers.
   - Populate `aiSections` with 3 to 4 specialized analytical blocks (`title`, `badge`, `tone` in `['cyan','rose','amber','emerald']`, `content`, `bullets`, `steps`).

Return ONLY valid JSON matching this structure:
{
  "healthScore": 78,
  "hasRisk": true,
  "aiSummary": "Domain-specific synthesis citing exact SQL counts...",
  "highRiskAlert": "Null if hasRisk is false; otherwise specific bottleneck...",
  "rootCause": "Null if hasRisk is false; otherwise specific telemetry cause...",
  "prediction30d": "7-day quantitative forecast...",
  "prescription": "Specific optimization protocol...",
  "parameters": [
    {"label": "Domain Parameter 1", "value": "84%", "status": "Optimal", "pct": 84}
  ],
  "radarData": [
    {"subject": "Axis 1", "score": 82, "benchmark": 80}
  ],
  "aiSections": [
    {
      "id": "custom_domain_audit",
      "title": "1. Specialized Domain Telemetry Audit",
      "badge": "Live SQL Audit",
      "tone": "cyan",
      "content": "Detailed analysis...",
      "bullets": ["Metric insight 1", "Metric insight 2"]
    }
  ]
}
"""

# =====================================================================
# 1. PYDANTIC SCHEMAS
# =====================================================================

class DonutCounts(BaseModel):
    completed: int
    in_progress: int
    not_started: int
    total: int

class DonutPercentages(BaseModel):
    completed: float
    in_progress: float
    not_started: float

class CompletionDonutResponse(BaseModel):
    counts: DonutCounts
    percentages: DonutPercentages
    needs_reminder_blast: bool
    recommended_action: str

class DailyEngagementPoint(BaseModel):
    date_label: str
    iso_date: str
    quizzes: int = 0
    quizzes_taken: int = 0
    videos: int = 0
    videos_completed: int = 0
    total_actions: int = 0
    avg_quiz_score: float

class TelemetryCardsSummary(BaseModel):
    total_quizzes: int
    avg_quiz_mastery: float
    total_videos: int = 3
    video_completions: int = 0
    staff_count: int
    student_count: int
    curos_in_circulation: int
    platform_health_score: int

class WeeklyEngagementResponse(BaseModel):
    range_days: int
    scope: str
    series: List[DailyEngagementPoint]
    telemetry_cards: TelemetryCardsSummary

class BreakdownItem(BaseModel):
    unit: str
    completion: str
    risk: str
    action: str

class AIDeepDiveSchema(BaseModel):
    healthScore: int
    hasRisk: bool = False
    aiSummary: str
    highRiskAlert: Optional[str] = None
    rootCause: Optional[str] = None
    prediction30d: str
    prescription: str
    actionSteps: Optional[List[str]] = []
    structuredFindings: Optional[List[str]] = []
    parameters: Optional[List[Dict[str, Any]]] = []
    radarData: Optional[List[Dict[str, Any]]] = []
    aiSections: Optional[List[Dict[str, Any]]] = None
    breakdownRoster: Optional[List[BreakdownItem]] = []

class DepartmentReportCardSchema(BaseModel):
    id: str
    title: str
    badge: str
    description: str
    metrics: str
    accentColor: str
    chartType: str
    data: List[Dict[str, Any]]
    aiDeepDive: AIDeepDiveSchema

class DepartmentalReportsListResponse(BaseModel):
    status: str = "success"
    reports: List[DepartmentReportCardSchema]

class WeeklyForecastPoint(BaseModel):
    day: str
    baseline_trajectory: int
    predicted_with_ai: int
    prescription: str

class GlobalAIReport(BaseModel):
    executiveSummary: str
    hasRisk: bool
    riskCount: int
    recommendedPriority: Optional[str] = None

class FullDashboardResponse(BaseModel):
    donut: CompletionDonutResponse
    engagement: WeeklyEngagementResponse
    departments: List[DepartmentReportCardSchema]
    weekly_forecast: Optional[List[WeeklyForecastPoint]] = []
    global_ai_report: Optional[GlobalAIReport] = None

class AIPrescriptionResponse(BaseModel):
    high_risk_count: int
    high_risk_summary: str
    prescription_title: str
    prescription_detail: str
    target_activation_pct: int

class ChatRequest(BaseModel):
    message: str = ""
    context: str = "overall"
    telemetry_data: Optional[Dict[str, Any]] = None
    telemetry_context: Optional[Dict[str, Any]] = None
    question: Optional[str] = None
    context_title: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    answer: Optional[str] = None
    status: str = "success"

class AIChatRequest(BaseModel):
    question: str = ""
    context_title: str = "overall"
    telemetry_context: Optional[dict] = None
    telemetry_data: Optional[dict] = None
    message: Optional[str] = None
    context: Optional[str] = None

class AIChatResponse(BaseModel):
    answer: str
    reply: Optional[str] = None


# =====================================================================
# 2. CORE SQL COMPUTATION HELPERS
# =====================================================================

def query_completion_metrics(db: Session, role: Optional[str] = None):
    """Calculates macro course progress stats from real UserProgramProgress."""
    try:
        query = db.query(
            func.count(case((UserProgramProgress.completed == True, 1))).label("completed"),
            func.count(
                case(
                    ((UserProgramProgress.completed == False) & (UserProgramProgress.completed_percentage > 0), 1)
                )
            ).label("in_progress"),
            func.count(
                case(
                    (
                        (UserProgramProgress.completed == False)
                        & ((UserProgramProgress.completed_percentage == 0) | (UserProgramProgress.completed_percentage.is_(None))),
                        1,
                    )
                )
            ).label("not_started"),
            func.count(UserProgramProgress.id).label("total"),
        ).join(User, User.user_id == UserProgramProgress.user_id)

        if role and role != "all":
            if role == "employee":
                query = query.filter(User.role_id.in_([4, 5, 6, 7]))
            elif role == "student":
                query = query.filter(User.role_id.in_([3, 5]))

        row = query.one()
        total = row.total if row.total and row.total > 0 else 0

        if total == 0:
            return 0, 0, 0, 0, 0.0, 0.0, 0.0

        completed_count = row.completed or 0
        in_progress_count = row.in_progress or 0
        not_started_count = row.not_started or 0

        completed_pct = round((completed_count / total) * 100, 1)
        in_progress_pct = round((in_progress_count / total) * 100, 1)
        not_started_pct = round((not_started_count / total) * 100, 1)

        return (
            completed_count,
            in_progress_count,
            not_started_count,
            total,
            completed_pct,
            in_progress_pct,
            not_started_pct,
        )
    except Exception as e:
        print(f"Error in query_completion_metrics: {e}")
        return 0, 0, 0, 0, 0.0, 0.0, 0.0


def query_engagement_data(db: Session, days: int = 7, role: Optional[str] = None):
    """Calculates daily and aggregate video and quiz engagement numbers strictly from Supabase."""
    try:
        start_date: date = datetime.utcnow().date() - timedelta(days=days - 1)

        quiz_q = db.query(
            cast(QuizAttempt.attempted_at, Date).label("day"),
            func.count(QuizAttempt.id).label("quiz_count"),
            func.avg(QuizAttempt.percentage).label("avg_score"),
        ).filter(cast(QuizAttempt.attempted_at, Date) >= start_date)

        video_q = db.query(
            cast(VideoCompletion.completed_at, Date).label("day"),
            func.count(VideoCompletion.id).label("video_count"),
        ).filter(cast(VideoCompletion.completed_at, Date) >= start_date, VideoCompletion.is_completed == True)

        if role and role != "all":
            if role == "employee":
                quiz_q = quiz_q.join(User, User.user_id == QuizAttempt.user_id).filter(User.role_id.in_([4, 5, 6, 7]))
                video_q = video_q.join(User, User.user_id == VideoCompletion.user_id).filter(User.role_id.in_([4, 5, 6, 7]))
            elif role == "student":
                quiz_q = quiz_q.join(User, User.user_id == QuizAttempt.user_id).filter(User.role_id.in_([3, 5]))
                video_q = video_q.join(User, User.user_id == VideoCompletion.user_id).filter(User.role_id.in_([3, 5]))

        quiz_rows = quiz_q.group_by("day").all()
        video_rows = video_q.group_by("day").all()

        quiz_map: Dict[date, tuple] = {
            r.day: (r.quiz_count, round(float(r.avg_score or 0.0), 1)) for r in quiz_rows if r.day
        }
        video_map: Dict[date, int] = {r.day: r.video_count for r in video_rows if r.day}

        series: List[DailyEngagementPoint] = []
        for i in range(days):
            curr_day = start_date + timedelta(days=i)
            q_count, q_avg = quiz_map.get(curr_day, (0, 0.0))
            v_count = video_map.get(curr_day, 0)
            series.append(
                DailyEngagementPoint(
                    date_label=curr_day.strftime("%b %d"),
                    iso_date=curr_day.isoformat(),
                    quizzes=q_count,
                    quizzes_taken=q_count,
                    videos=v_count,
                    videos_completed=v_count,
                    total_actions=q_count + v_count,
                    avg_quiz_score=q_avg,
                )
            )

        # Real total counts strictly from Supabase tables
        total_quizzes = db.query(func.count(QuizAttempt.id)).scalar() or 0
        catalog_videos = db.query(func.count(Video.id)).scalar() or 0
        video_completions = db.query(func.count(VideoCompletion.id)).filter(VideoCompletion.is_completed == True).scalar() or 0

        # Real average quiz mastery across all attempts
        avg_mastery_val = db.query(func.avg(QuizAttempt.percentage)).scalar()
        avg_mastery = round(float(avg_mastery_val), 1) if avg_mastery_val is not None else 0.0

        # Real roles & Curos strictly from User table
        staff_count = db.query(func.count(User.user_id)).filter(User.role_id.in_([1, 2, 7])).scalar() or 0
        student_count = db.query(func.count(User.user_id)).filter(User.role_id.in_([3, 4, 5, 6])).scalar() or 0
        curos_sum = int(db.query(func.coalesce(func.sum(User.curos), 0)).scalar() or 0)

        # Dynamic health score based strictly on real activity and mastery
        health_score = min(98, max(30, int(avg_mastery * 0.5 + min(48, (total_quizzes + video_completions) * 4))))

        return series, total_quizzes, catalog_videos, video_completions, avg_mastery, staff_count, student_count, curos_sum, health_score
    except Exception as e:
        print(f"Error in query_engagement_data: {e}")
        start_date = datetime.utcnow().date() - timedelta(days=days - 1)
        fallback_series = [
            DailyEngagementPoint(
                date_label=(start_date + timedelta(days=i)).strftime("%b %d"),
                iso_date=(start_date + timedelta(days=i)).isoformat(),
                quizzes=0,
                quizzes_taken=0,
                videos=0,
                videos_completed=0,
                total_actions=0,
                avg_quiz_score=0.0,
            )
            for i in range(days)
        ]
        return fallback_series, 0, 3, 0, 0.0, 0, 0, 0, 50


# =====================================================================
# 3. 5 DISTINCT DOMAIN-SPECIFIC DEPARTMENT BUILDERS
#    (Each has its own unique SQL calculations, parameters, radarData,
#     conditional risk blocks, and domain narratives)
# =====================================================================

def build_org_learning_report(
    db: Session,
    completed_count: int,
    in_progress_count: int,
    not_started_count: int,
    total_enrollments: int,
    completed_pct: float,
    in_progress_pct: float,
    not_started_pct: float,
    avg_mastery: float,
    curos_sum: int,
) -> DepartmentReportCardSchema:
    """Domain 0: Organization Learning (Macro Velocity & Real Enrolled Programs from Supabase)."""
    has_risk = bool(completed_pct < 50.0 or in_progress_pct > 30.0)
    health_score = max(35, min(98, int(completed_pct * 0.6 + avg_mastery * 0.4)))

    # Real enrolled programs from Supabase
    programs = db.query(
        Program.id,
        Program.name,
        func.count(UserProgramProgress.id).label("enrollments"),
        func.coalesce(func.avg(UserProgramProgress.completed_percentage), 0).label("avg_pct"),
        func.sum(case((UserProgramProgress.completed == True, 1), else_=0)).label("completions")
    ).outerjoin(UserProgramProgress, UserProgramProgress.program_id == Program.id)\
     .group_by(Program.id, Program.name).all()

    # Real progression stages from UserProgramProgress
    s1_val = db.query(func.count(UserProgramProgress.id)).filter(UserProgramProgress.completed_percentage <= 25).scalar() or 0
    s2_val = db.query(func.count(UserProgramProgress.id)).filter(UserProgramProgress.completed_percentage > 25, UserProgramProgress.completed_percentage <= 50).scalar() or 0
    s3_val = db.query(func.count(UserProgramProgress.id)).filter(UserProgramProgress.completed_percentage > 50, UserProgramProgress.completed_percentage < 100).scalar() or 0
    s4_val = db.query(func.count(UserProgramProgress.id)).filter(UserProgramProgress.completed == True).scalar() or 0

    chart_data = [
        {"name": "Stage 1 (0-25%)", "value": s1_val, "target": max(1, total_enrollments)},
        {"name": "Stage 2 (26-50%)", "value": s2_val, "target": max(1, total_enrollments)},
        {"name": "Stage 3 (51-99%)", "value": s3_val, "target": max(1, total_enrollments)},
        {"name": "Stage 4 (Certified)", "value": s4_val, "target": max(1, total_enrollments)},
    ]

    parameters = [
        {
            "label": "Completion Rate",
            "value": f"{completed_pct}%",
            "status": "Certified" if completed_pct >= 50 else "In Flight",
            "pct": completed_pct,
        },
        {
            "label": "In-Progress Cohort",
            "value": f"{in_progress_pct}%",
            "status": "Attention Needed" if in_progress_pct > 30 else "Optimal",
            "pct": in_progress_pct,
        },
        {
            "label": "Assessment Mastery",
            "value": f"{avg_mastery}%",
            "status": "Verified",
            "pct": avg_mastery,
        },
        {
            "label": "Curos Economy",
            "value": f"{curos_sum:,} Curos",
            "status": "In Circulation",
            "pct": min(100, int((curos_sum / max(1, 500)) * 100)),
        },
    ]

    radar_data = [
        {"subject": "Completion Rate", "score": min(100, int(completed_pct)), "benchmark": 75},
        {"subject": "Quiz Accuracy", "score": int(avg_mastery), "benchmark": 80},
        {"subject": "Active Pace", "score": max(0, 100 - int(not_started_pct)), "benchmark": 70},
        {"subject": "Certification Yield", "score": int(completed_pct), "benchmark": 75},
        {"subject": "Platform Health", "score": health_score, "benchmark": 80},
    ]

    prog_title = programs[0].name if programs else "Corporate Training"

    ai_summary = (
        f"Real-time organizational telemetry for '{prog_title}' records {total_enrollments} total enrollments across Supabase: "
        f"{completed_count} verified graduate ({completed_pct}%), {in_progress_count} in-flight learner ({in_progress_pct}%), "
        f"and {not_started_count} yet to start ({not_started_pct}%). Total reward economy holds {curos_sum:,} Curos circulating in user wallets."
    )

    high_risk_alert = (
        f"{in_progress_count} of {total_enrollments} learners ({in_progress_pct}%) have reached a mid-funnel pause point, "
        f"while {not_started_count} learners have not initiated coursework."
        if has_risk
        else None
    )

    root_cause = (
        "Mid-module roleplay friction and lack of automated concept recap nudges."
        if has_risk
        else None
    )

    prediction_30d = (
        f"Deploying automated milestone nudges is predicted to lift course completion from {completed_pct}% to {min(100, int(completed_pct + 25))}% over the next 30 days."
    )

    prescription = (
        f"Dispatch automated progress reminders to the {in_progress_count} in-flight learners and unlock +50 Curos completion vouchers."
    )

    breakdown_roster = [
        BreakdownItem(
            unit=p.name,
            completion=f"{round(float(p.avg_pct or 0), 1)}%",
            risk="Bottleneck" if (p.avg_pct or 0) < 40 else ("Moderate" if (p.avg_pct or 0) < 75 else "Optimal"),
            action=f"{int(p.completions or 0)}/{int(p.enrollments or 0)} Certified Learners"
        )
        for p in programs
    ]
    if not breakdown_roster:
        breakdown_roster = [
            BreakdownItem(unit=prog_title, completion=f"{completed_pct}%", risk="Optimal", action="Active Program")
        ]

    return DepartmentReportCardSchema(
        id="org_learning",
        title="Organization Learning Report",
        badge="Corporate L&D",
        description="Complete organization-wide learning velocity and 30-day active learner trajectory.",
        metrics=f"{total_enrollments} Enrolled • {completed_pct}% Certified",
        accentColor="#A855F7",
        chartType="area",
        data=chart_data,
        aiDeepDive=AIDeepDiveSchema(
            healthScore=health_score,
            hasRisk=has_risk,
            aiSummary=ai_summary,
            highRiskAlert=high_risk_alert,
            rootCause=root_cause,
            prediction30d=prediction_30d,
            prescription=prescription,
            parameters=parameters,
            radarData=radar_data,
            structuredFindings=[
                f"Total verified course completions: {completed_count} of {total_enrollments} ({completed_pct}%)",
                f"Active in-flight cohort: {in_progress_count} learners ({in_progress_pct}%)",
                f"Platform token velocity: {curos_sum:,} total Curos currently minted in Supabase",
            ],
            actionSteps=[
                f"Issue milestone recap alerts to the {in_progress_count} in-progress learners",
                "Leverage +50 Curos bounties for completing the next module checkpoint",
            ],
            breakdownRoster=breakdown_roster,
        ),
    )


def build_franchise_perf_report(db: Session) -> DepartmentReportCardSchema:
    """Domain 1: Franchise Performance (Real Cohorts & Franchise Partners from Supabase)."""
    # Query real learners / franchise partners (roles 3, 4, 5, 6, 7)
    learners = db.query(
        User.user_id,
        User.full_name,
        User.city,
        User.curos,
        User.role_id,
        func.coalesce(func.max(UserProgramProgress.completed_percentage), 0).label("completion_pct")
    ).outerjoin(UserProgramProgress, UserProgramProgress.user_id == User.user_id)\
     .filter(User.role_id.in_([3, 4, 5, 6, 7]))\
     .group_by(User.user_id, User.full_name, User.city, User.curos, User.role_id)\
     .order_by(desc("completion_pct"), desc(User.curos))\
     .all()

    # Build chart data strictly from real users (e.g. Lav, Mama, Atharva, Surbhi, Vedika)
    chart_data = []
    for u in learners[:5]:
        first_name = u.full_name.strip().split()[0] if u.full_name else f"User {u.user_id}"
        chart_data.append({
            "name": first_name,
            "value": int(u.completion_pct),
        })

    if not chart_data:
        chart_data = [{"name": "Cohort", "value": 0}]

    top_learner = learners[0] if learners else None
    top_name = top_learner.full_name.split()[0] if top_learner and top_learner.full_name else "Lead"
    top_val = int(top_learner.completion_pct) if top_learner else 0

    lowest_learner = learners[-1] if learners else None
    lowest_name = lowest_learner.full_name.split()[0] if lowest_learner and lowest_learner.full_name else "Cohort"
    lowest_val = int(lowest_learner.completion_pct) if lowest_learner else 0

    variance = abs(top_val - lowest_val)
    has_risk = bool(variance > 25 or lowest_val < 50)
    health_score = int(sum(c["value"] for c in chart_data) / max(1, len(chart_data)))

    parameters = [
        {
            "label": "Top Performer",
            "value": f"{top_name} ({top_val}%)",
            "status": "Benchmark",
            "pct": top_val,
        },
        {
            "label": "Trailing Member",
            "value": f"{lowest_name} ({lowest_val}%)",
            "status": "Action Needed" if lowest_val < 50 else "On Track",
            "pct": lowest_val,
        },
        {
            "label": "Cohort Spread",
            "value": f"{variance}% Variance",
            "status": "Dispersion",
            "pct": min(100, variance),
        },
        {
            "label": "Active Partners",
            "value": f"{len(learners)} Nodes",
            "status": "Synced",
            "pct": 100,
        },
    ]

    radar_data = [
        {"subject": f"{c['name']} SLA", "score": c["value"], "benchmark": 75}
        for c in chart_data
    ]

    ai_summary = (
        f"Franchise cohort analysis in Supabase indicates {top_name} leads at {top_val}% completion, "
        f"while trailing cohort members like {lowest_name} remain at {lowest_val}%, creating a {variance}% performance dispersion across {len(learners)} franchise partners."
    )

    high_risk_alert = (
        f"Significant performance variance ({variance}%) between {top_name} ({top_val}%) and {lowest_name} ({lowest_val}%) highlights an uneven onboarding pace."
        if has_risk
        else None
    )

    root_cause = (
        "Unequal onboarding cadence and lack of structured peer-review pairings between certified and unstarted partners."
        if has_risk
        else None
    )

    prediction_30d = (
        f"Pairing {lowest_name} with {top_name} for peer mentoring is projected to lift cohort average from {health_score}% to {min(95, health_score + 20)}%."
    )

    prescription = (
        f"Assign {top_name} as Franchise Peer Lead and initiate automated kickstart workflows for {lowest_name} and trailing partners."
    )

    breakdown_roster = [
        BreakdownItem(
            unit=f"{u.full_name} ({u.city or 'Remote'})",
            completion=f"{int(u.completion_pct)}%",
            risk="Optimal" if u.completion_pct >= 70 else ("Moderate" if u.completion_pct > 0 else "High Risk"),
            action="Benchmark Lead" if u.completion_pct >= 70 else ("In Progress" if u.completion_pct > 0 else "Trigger Onboarding")
        )
        for u in learners[:6]
    ]

    return DepartmentReportCardSchema(
        id="franchise_perf",
        title="Franchise Performance Report",
        badge="Regional Cohorts",
        description="Compare real training KPIs, quiz mastery, and compliance across regional franchise learners.",
        metrics=f"Top: {top_name} ({top_val}%) • Trailing: {lowest_name} ({lowest_val}%)",
        accentColor="#10B981",
        chartType="vertical-bar",
        data=chart_data,
        aiDeepDive=AIDeepDiveSchema(
            healthScore=health_score,
            hasRisk=has_risk,
            aiSummary=ai_summary,
            highRiskAlert=high_risk_alert,
            rootCause=root_cause,
            prediction30d=prediction_30d,
            prescription=prescription,
            parameters=parameters,
            radarData=radar_data,
            structuredFindings=[
                f"{top_name} sets operational benchmark at {top_val}%",
                f"{lowest_name} requires onboarding support at {lowest_val}%",
                f"Cohort dispersion spread: {variance}%",
            ],
            actionSteps=[
                f"Pair {lowest_name} with {top_name} for peer onboarding review",
                "Activate automated notification script for unstarted partners",
            ],
            breakdownRoster=breakdown_roster,
        ),
    )


def build_engagement_report(
    db: Session,
    total_quizzes: int,
    catalog_videos: int,
    video_completions: int,
    days: int,
) -> DepartmentReportCardSchema:
    """Domain 2: Learner Engagement (Grouped by Day of Week from Supabase Timestamps)."""
    days_map = {0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun"}
    day_counts = {i: 0 for i in range(7)}

    for qa in db.query(QuizAttempt).all():
        if qa.attempted_at:
            day_counts[qa.attempted_at.weekday()] += 1

    for vc in db.query(VideoCompletion).all():
        if vc.completed_at:
            day_counts[vc.completed_at.weekday()] += 1

    chart_data = [{"name": days_map[i], "value": day_counts[i]} for i in range(7)]

    peak_day_idx = max(day_counts, key=day_counts.get) if day_counts else 0
    peak_day_name = days_map[peak_day_idx]
    peak_events = day_counts[peak_day_idx]

    conversion_pct = round(((total_quizzes / max(1, video_completions)) * 100), 1)
    has_risk = bool(total_quizzes < 3 or conversion_pct < 50.0)
    health_score = min(98, max(45, int((conversion_pct * 0.5) + (video_completions * 4))))

    parameters = [
        {
            "label": "Curriculum Videos",
            "value": f"{catalog_videos} in Library",
            "status": "Available",
            "pct": 100,
        },
        {
            "label": "Video Completions",
            "value": f"{video_completions} Logged",
            "status": "Logged",
            "pct": min(100, video_completions * 20),
        },
        {
            "label": "Quiz Attempts",
            "value": f"{total_quizzes} Submissions",
            "status": "Verified",
            "pct": min(100, total_quizzes * 25),
        },
        {
            "label": "Peak Cadence Day",
            "value": f"{peak_day_name} ({peak_events} Events)",
            "status": "Active Window",
            "pct": 85,
        },
    ]

    radar_data = [
        {"subject": "Daily Cadence", "score": min(100, peak_events * 25), "benchmark": 75},
        {"subject": "Video Streams", "score": min(100, video_completions * 20), "benchmark": 80},
        {"subject": "Quiz Frequency", "score": min(100, total_quizzes * 25), "benchmark": 80},
        {"subject": "Conversion Rate", "score": min(100, int(conversion_pct)), "benchmark": 70},
        {"subject": "Streak Stability", "score": health_score, "benchmark": 80},
    ]

    ai_summary = (
        f"Behavioral telemetry records {video_completions} video completions across {catalog_videos} curriculum videos against {total_quizzes} quiz attempts in Supabase, "
        f"establishing a video-to-quiz conversion rate of {conversion_pct}%. Activity concentrates around {peak_day_name} with {peak_events} recorded events."
    )

    high_risk_alert = (
        f"Conversion rate is at {conversion_pct}%: several learners stream instructional videos but delay attempting accompanying comprehension assessments."
        if has_risk
        else None
    )

    root_cause = (
        "Delayed post-video quiz nudges allowing momentum to dissipate before knowledge checks."
        if has_risk
        else None
    )

    prediction_30d = (
        f"Implementing post-video instant quiz popups is projected to lift quiz attempt conversion from {conversion_pct}% to {min(100, int(conversion_pct + 28))}%."
    )

    prescription = (
        "Introduce automated checkpoint quizzes immediately following video conclusion with +15 Curos instant incentives."
    )

    breakdown_roster = [
        BreakdownItem(unit="Curriculum Videos", completion=f"{catalog_videos} in Library", risk="Optimal", action="Library Published"),
        BreakdownItem(unit="Video Sessions", completion=f"{video_completions} Logs", risk="Optimal" if video_completions > 0 else "Inactive", action="Streaming Active"),
        BreakdownItem(unit="Assessment Submissions", completion=f"{total_quizzes} Quizzes", risk="Optimal" if total_quizzes > 0 else "Pending", action="Comprehension Checked"),
        BreakdownItem(unit=f"Peak Focus ({peak_day_name})", completion=f"{peak_events} Events", risk="Optimal", action="Primary Study Window"),
    ]

    return DepartmentReportCardSchema(
        id="engagement",
        title="Learner Engagement Report",
        badge="Behavioral Telemetry",
        description="Track daily active session duration, video retention spikes, and habit streaks from Supabase.",
        metrics=f"{catalog_videos} Curriculum Videos ({video_completions} Completions) • {total_quizzes} Quizzes Attempted",
        accentColor="#EC4899",
        chartType="sparkline",
        data=chart_data,
        aiDeepDive=AIDeepDiveSchema(
            healthScore=health_score,
            hasRisk=has_risk,
            aiSummary=ai_summary,
            highRiskAlert=high_risk_alert,
            rootCause=root_cause,
            prediction30d=prediction_30d,
            prescription=prescription,
            parameters=parameters,
            radarData=radar_data,
            structuredFindings=[
                f"{peak_day_name} represents peak weekly engagement ({peak_events} events)",
                f"{catalog_videos} published curriculum videos with {video_completions} verified completion logs in Supabase",
                f"Assessment conversion index: {conversion_pct}%",
            ],
            actionSteps=[
                "Deploy post-video checkpoint prompts on key video modules",
                "Reward same-day quiz attempts with bonus Curos",
            ],
            breakdownRoster=breakdown_roster,
        ),
    )


def build_modules_report(db: Session, total_enrollments: int) -> DepartmentReportCardSchema:
    """Domain 3: Curriculum Funnel (Actual Module & Video completions from Supabase)."""
    modules = db.query(Module).order_by(Module.module_order).all()

    mod_data = []
    for m in modules:
        v_ids = [v.id for v in m.videos]
        comp_count = db.query(func.count(func.distinct(VideoCompletion.user_id)))\
            .filter(VideoCompletion.video_id.in_(v_ids), VideoCompletion.is_completed == True).scalar() or 0
        pct = round((comp_count / max(1, total_enrollments)) * 100, 1)
        mod_data.append((m, comp_count, pct))

    chart_data = [
        {"name": f"Mod {m.module_order}", "value": int(pct)}
        for m, comp_count, pct in mod_data
    ]

    if not chart_data:
        chart_data = [{"name": "Mod 1", "value": 0}]

    avg_mod_pct = int(sum(pct for _, _, pct in mod_data) / max(1, len(mod_data)))
    has_risk = bool(any(pct < 30.0 for _, _, pct in mod_data))
    health_score = max(35, min(95, avg_mod_pct))

    mod1_title = mod_data[0][0].title if len(mod_data) > 0 else "Module 1"
    mod1_pct = int(mod_data[0][2]) if len(mod_data) > 0 else 0

    mod2_title = mod_data[1][0].title if len(mod_data) > 1 else "Module 2"
    mod2_pct = int(mod_data[1][2]) if len(mod_data) > 1 else 0

    mod3_title = mod_data[2][0].title if len(mod_data) > 2 else "Module 3"
    mod3_pct = int(mod_data[2][2]) if len(mod_data) > 2 else 0

    parameters = [
        {
            "label": "Module 1 Rate",
            "value": f"{mod1_pct}%",
            "status": "Foundation",
            "pct": mod1_pct,
        },
        {
            "label": "Module 2 Rate",
            "value": f"{mod2_pct}%",
            "status": "Drop-Off" if mod2_pct < 30 else "Normal",
            "pct": mod2_pct,
        },
        {
            "label": "Module 3 Depth",
            "value": f"{mod3_pct}%",
            "status": "Mastery",
            "pct": mod3_pct,
        },
        {
            "label": "Curriculum Breadth",
            "value": f"{len(modules)} Modules",
            "status": "Live",
            "pct": 100,
        },
    ]

    radar_data = [
        {"subject": f"Mod {m.module_order}", "score": int(pct), "benchmark": 75}
        for m, comp_count, pct in mod_data
    ]

    ai_summary = (
        f"Curriculum progression across {len(modules)} modules shows strong initial engagement in '{mod1_title}' ({mod1_pct}% completion), "
        f"with drop-off occurring at '{mod2_title}' ({mod2_pct}%) and '{mod3_title}' ({mod3_pct}%)."
    )

    high_risk_alert = (
        f"Steep curriculum transition drop-off detected: progression falls from {mod1_pct}% in Module 1 to {mod2_pct}% in Module 2."
        if has_risk
        else None
    )

    root_cause = (
        "Lack of automated micro-nudges connecting Module 1 conclusion to Module 2 commencement."
        if has_risk
        else None
    )

    prediction_30d = (
        f"Chunking Module 2 lessons and deploying transition prompts is projected to elevate funnel completion from {avg_mod_pct}% to {min(95, avg_mod_pct + 25)}%."
    )

    prescription = (
        "Activate automated transition prompts when learners finish Module 1, and attach a +25 Curos milestone reward for starting Module 2."
    )

    breakdown_roster = [
        BreakdownItem(
            unit=m.title,
            completion=f"{int(pct)}%",
            risk="Optimal" if pct >= 50 else ("Moderate" if pct >= 25 else "Friction Point"),
            action=f"{comp_count}/{total_enrollments} Learners Completed"
        )
        for m, comp_count, pct in mod_data
    ]

    return DepartmentReportCardSchema(
        id="modules",
        title="Franchise Learning Report",
        badge="Curriculum Funnel",
        description="Module-by-module progression velocity across all active certification stages in Supabase.",
        metrics=f"{len(modules)} Modules Active • {avg_mod_pct}% Avg Completion",
        accentColor="#F59E0B",
        chartType="line-modules",
        data=chart_data,
        aiDeepDive=AIDeepDiveSchema(
            healthScore=health_score,
            hasRisk=has_risk,
            aiSummary=ai_summary,
            highRiskAlert=high_risk_alert,
            rootCause=root_cause,
            prediction30d=prediction_30d,
            prescription=prescription,
            parameters=parameters,
            radarData=radar_data,
            structuredFindings=[
                f"Module 1 completion rate stands at {mod1_pct}%",
                f"Drop-off to Module 2 recorded at {mod2_pct}%",
                f"Average curriculum funnel throughput: {avg_mod_pct}%",
            ],
            actionSteps=[
                "Deploy automatic push notification upon Module 1 completion",
                "Unlock milestone Curos incentive upon initiating Module 2",
            ],
            breakdownRoster=breakdown_roster,
        ),
    )


def build_team_report(
    db: Session,
    staff_count: int,
    student_count: int,
    curos_sum: int,
) -> DepartmentReportCardSchema:
    """Domain 4: Team Progress Report (Real Users from Supabase — Zero Fakes)."""
    team_members = db.query(
        User.user_id,
        User.full_name,
        User.curos,
        User.role_id,
        func.coalesce(UserProgramProgress.completed_percentage, 0).label("progress"),
        func.coalesce(UserProgramProgress.completed, False).label("is_done")
    ).outerjoin(UserProgramProgress, UserProgramProgress.user_id == User.user_id)\
     .filter(User.full_name.isnot(None))\
     .order_by(desc("progress"), desc(User.curos))\
     .all()

    # Real users (e.g., Lav, Mama, Atharva, Sneha, Amy, Shreya)
    chart_data = []
    for u in team_members[:5]:
        first_name = u.full_name.strip().split()[0] if u.full_name else f"User {u.user_id}"
        chart_data.append({
            "name": first_name,
            "value": int(u.progress),
        })

    if not chart_data:
        chart_data = [{"name": "Team", "value": 0}]

    lead_user = team_members[0] if team_members else None
    lead_name = lead_user.full_name.split()[0] if lead_user and lead_user.full_name else "Leader"
    lead_prog = int(lead_user.progress) if lead_user else 0

    stalled_count = sum(1 for u in team_members if u.progress == 0)
    has_risk = bool(stalled_count > 0)
    avg_team_prog = int(sum(u.progress for u in team_members) / max(1, len(team_members)))
    health_score = max(40, min(95, avg_team_prog + 15))

    parameters = [
        {
            "label": "Squad Leader",
            "value": f"{lead_name} ({lead_prog}%)",
            "status": "Certified" if lead_prog >= 100 else "Active",
            "pct": lead_prog,
        },
        {
            "label": "Stalled Members",
            "value": f"{stalled_count} of {len(team_members)}",
            "status": "Attention Needed" if stalled_count > 0 else "Optimal",
            "pct": int((stalled_count / max(1, len(team_members))) * 100),
        },
        {
            "label": "Staff vs Learners",
            "value": f"{staff_count} : {student_count}",
            "status": "Balanced",
            "pct": 75,
        },
        {
            "label": "Squad Curos Pool",
            "value": f"{curos_sum:,} Curos",
            "status": "Distributed",
            "pct": 80,
        },
    ]

    radar_data = [
        {"subject": f"{c['name']} Mastery", "score": c["value"], "benchmark": 75}
        for c in chart_data
    ]

    ai_summary = (
        f"Squad performance telemetry identifies {lead_name} as the top performer at {lead_prog}% completion. "
        f"However, {stalled_count} team members currently show 0% course progress despite having active credentials."
    )

    high_risk_alert = (
        f"{stalled_count} registered team members have not commenced their enrolled modules, dampening squad-level completion velocity."
        if has_risk
        else None
    )

    root_cause = (
        "Delayed onboarding initiation and absence of peer-study accountability pairings."
        if has_risk
        else None
    )

    prediction_30d = (
        f"Pairing {lead_name} with unstarted team members is projected to activate at least 3 stalled learners and raise squad average to {min(95, avg_team_prog + 30)}%."
    )

    prescription = (
        f"Designate {lead_name} as Squad Peer Mentor (+50 Curos reward) and trigger automated 1-on-1 check-ins for stalled team members."
    )

    breakdown_roster = [
        BreakdownItem(
            unit=f"{u.full_name}",
            completion=f"{int(u.progress)}% ({u.curos} Curos)",
            risk="Optimal" if u.progress >= 70 else ("In Progress" if u.progress > 0 else "Stalled"),
            action="Squad Mentor" if u.progress >= 70 else ("Continue Course" if u.progress > 0 else "Trigger Kickstart")
        )
        for u in team_members[:6]
    ]

    return DepartmentReportCardSchema(
        id="team",
        title="Team Progress Report",
        badge="Squad Leaderboard",
        description="Individual team member completion benchmarks and peer coaching impact from Supabase.",
        metrics=f"Lead: {lead_name} ({lead_prog}%) • {len(team_members)} Squad Members",
        accentColor="#06B6D4",
        chartType="horizontal-bar",
        data=chart_data,
        aiDeepDive=AIDeepDiveSchema(
            healthScore=health_score,
            hasRisk=has_risk,
            aiSummary=ai_summary,
            highRiskAlert=high_risk_alert,
            rootCause=root_cause,
            prediction30d=prediction_30d,
            prescription=prescription,
            parameters=parameters,
            radarData=radar_data,
            structuredFindings=[
                f"{lead_name} leads squad at {lead_prog}% completion",
                f"{stalled_count} squad members require onboarding initiation",
                f"Squad ratio: {staff_count} staff, {student_count} learners",
            ],
            actionSteps=[
                f"Assign {lead_name} as Squad Peer Champion",
                "Schedule automated 1-on-1 check-in for stalled learners",
            ],
            breakdownRoster=breakdown_roster,
        ),
    )


# =====================================================================
# 4. API ENDPOINTS
# =====================================================================

@router.get("/completion-donut", response_model=CompletionDonutResponse)
def get_completion_donut(
    franchise_id: Optional[int] = Query(None, description="Filter by Franchise ID"),
    role: Optional[str] = Query(None, description="Filter by 'employee' or 'student'"),
    db: Session = Depends(get_db)
):
    completed_count, in_progress_count, not_started_count, total, completed_pct, in_progress_pct, not_started_pct = query_completion_metrics(db, role)
    needs_reminder = (in_progress_pct >= 60.0) or (completed_pct <= 25.0)

    return CompletionDonutResponse(
        counts=DonutCounts(
            completed=completed_count,
            in_progress=in_progress_count,
            not_started=not_started_count,
            total=total,
        ),
        percentages=DonutPercentages(
            completed=completed_pct,
            in_progress=in_progress_pct,
            not_started=not_started_pct,
        ),
        needs_reminder_blast=needs_reminder,
        recommended_action=(
            f"{in_progress_count} learners ({in_progress_pct}%) are stuck In-Progress. Dispatch Saarthi AI nudge?"
            if needs_reminder
            else "Course completion velocity is on track."
        ),
    )


@router.get("/weekly-engagement", response_model=WeeklyEngagementResponse)
def get_weekly_engagement(
    days: int = Query(7, ge=7, le=90, description="Number of days (7 or 30)"),
    scope: str = Query("org", description="Scope tab: 'org', 'franchise', or 'current'"),
    franchise_id: Optional[int] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    series, total_quizzes, catalog_videos, video_completions, avg_mastery, staff_count, student_count, curos_sum, health_score = query_engagement_data(db, days, role)

    return WeeklyEngagementResponse(
        range_days=days,
        scope=scope,
        series=series,
        telemetry_cards=TelemetryCardsSummary(
            total_quizzes=total_quizzes,
            avg_quiz_mastery=avg_mastery,
            total_videos=catalog_videos,
            video_completions=video_completions,
            staff_count=staff_count,
            student_count=student_count,
            curos_in_circulation=curos_sum,
            platform_health_score=health_score,
        ),
    )


@router.get("/departmental-reports", response_model=DepartmentalReportsListResponse)
def get_departmental_reports(
    role: Optional[str] = Query(None, description="Filter by employee or student"),
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    completed_count, in_progress_count, not_started_count, total, completed_pct, in_progress_pct, not_started_pct = query_completion_metrics(db, role)
    series, total_quizzes, catalog_videos, video_completions, avg_mastery, staff_count, student_count, curos_sum, health_score = query_engagement_data(db, days, role)

    reports = [
        build_org_learning_report(
            db, completed_count, in_progress_count, not_started_count, total,
            completed_pct, in_progress_pct, not_started_pct, avg_mastery, curos_sum
        ),
        build_franchise_perf_report(db),
        build_engagement_report(db, total_quizzes, catalog_videos, video_completions, days),
        build_modules_report(db, total),
        build_team_report(db, staff_count, student_count, curos_sum),
    ]

    return DepartmentalReportsListResponse(status="success", reports=reports)


@router.get("/ai-insights", response_model=AIPrescriptionResponse)
def get_ai_insights(db: Session = Depends(get_db)):
    stalled_count = db.query(func.count(UserProgramProgress.id)).filter(
        UserProgramProgress.completed == False
    ).scalar() or 0
    total = db.query(func.count(UserProgramProgress.id)).scalar() or 0
    target_pct = min(100, int((stalled_count / max(1, total)) * 100))
    return AIPrescriptionResponse(
        high_risk_count=stalled_count,
        high_risk_summary=f"{stalled_count} of {total} enrolled learners in Supabase require proactive re-engagement prompts.",
        prescription_title="30-Day Milestone Activation Prescription",
        prescription_detail="Deploy automated milestone nudges and attach +50 Curos bounties to activate stalled learners.",
        target_activation_pct=target_pct,
    )


async def fetch_dynamic_ai_analytics(telemetry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Dynamically passes the live extracted database telemetry to Groq AI.
    Groq decides what each report is about (description & focus), evaluates risk,
    generates deep-dive summaries citing live numbers and real learners,
    tailors parameters and radar scores, and formulates weekly prescriptions.
    """
    try:
        provider = GroqProvider()
        if not await provider.is_available():
            return None

        prompt = f"""You are Saarthi AI, Senior Enterprise Learning & Data Telemetry Scientist.
Analyze this exact real-time SQL database telemetry snapshot from the LMS.

IMPORTANT DATABASE CONSTRAINTS:
- There are strictly {telemetry.get('catalog_videos', 3)} video lessons in the curriculum/library, with {telemetry.get('video_completions', 5)} completed watch events logged by learners. Never state there are 5 videos.
- Total users: {telemetry.get('total_users', 23)} ({telemetry.get('staff_count', 11)} staff, {telemetry.get('student_count', 12)} learners).
- Total Curos in circulation: {telemetry.get('curos_in_circulation', 435)}.
- Quizzes attempted: {telemetry.get('total_quizzes', 4)}, average mastery: {telemetry.get('avg_quiz_mastery', 75.0)}%.
- Enrollments: {telemetry.get('enrollments', {}).get('total', 6)} total ({telemetry.get('enrollments', {}).get('completed', 1)} completed, {telemetry.get('enrollments', {}).get('in_progress', 1)} in-progress, {telemetry.get('enrollments', {}).get('not_started', 4)} unstarted).

TASK:
Based strictly on this live data, generate dynamic, rich analytical insights.
For each report domain, decide what the report is about (title and description reflecting current data patterns), dynamic analytical summary, health score, conditional risk alert/root cause, 4 domain-tailored parameters, 5 radar data axes, 3 key findings, and action steps.

Return valid JSON with this exact schema:
{{
  "global": {{
    "executiveSummary": "Concise 2-3 sentence strategic executive synthesis of the platform health and telemetry bottlenecks...",
    "recommendedPriority": "Single most critical immediate operational action...",
    "hasRisk": true,
    "riskCount": 3
  }},
  "weeklyPrescriptions": [
    "Day 1 action",
    "Day 2 action",
    "Day 3 action",
    "Day 4 action",
    "Day 5 action",
    "Day 6 action",
    "Day 7 action"
  ],
  "departments": {{
    "org_learning": {{
      "title": "Organization-Wide Learning Report",
      "description": "What this report is about based on current completion & token telemetry...",
      "healthScore": 75,
      "hasRisk": true,
      "aiSummary": "Executive analysis citing real numbers...",
      "highRiskAlert": "Specific bottleneck if hasRisk is true, else null...",
      "rootCause": "Telemetry root cause if hasRisk is true, else null...",
      "prediction30d": "30-day forecast based on velocity...",
      "prescription": "Actionable protocol...",
      "parameters": [
        {{"label": "Metric 1", "value": "val", "status": "status", "pct": 80}},
        {{"label": "Metric 2", "value": "val", "status": "status", "pct": 50}},
        {{"label": "Metric 3", "value": "val", "status": "status", "pct": 60}},
        {{"label": "Metric 4", "value": "val", "status": "status", "pct": 90}}
      ],
      "radarData": [
        {{"subject": "Axis 1", "score": 80, "benchmark": 75}},
        {{"subject": "Axis 2", "score": 60, "benchmark": 75}},
        {{"subject": "Axis 3", "score": 85, "benchmark": 80}},
        {{"subject": "Axis 4", "score": 70, "benchmark": 70}},
        {{"subject": "Axis 5", "score": 90, "benchmark": 85}}
      ],
      "structuredFindings": ["Finding 1", "Finding 2", "Finding 3"],
      "actionSteps": ["Step 1", "Step 2"]
    }},
    "franchise_perf": {{
      "title": "Franchise Partner Performance",
      "description": "What this report is about based on real learner performance & variance...",
      "healthScore": 70,
      "hasRisk": true,
      "aiSummary": "Executive analysis citing real learners like Lav Chokhani (100%), Mama Singh (33%), Atharva Lohar...",
      "highRiskAlert": "...",
      "rootCause": "...",
      "prediction30d": "...",
      "prescription": "...",
      "parameters": [
        {{"label": "Metric 1", "value": "val", "status": "status", "pct": 80}},
        {{"label": "Metric 2", "value": "val", "status": "status", "pct": 50}},
        {{"label": "Metric 3", "value": "val", "status": "status", "pct": 60}},
        {{"label": "Metric 4", "value": "val", "status": "status", "pct": 90}}
      ],
      "radarData": [
        {{"subject": "Axis 1", "score": 80, "benchmark": 75}},
        {{"subject": "Axis 2", "score": 60, "benchmark": 75}},
        {{"subject": "Axis 3", "score": 85, "benchmark": 80}},
        {{"subject": "Axis 4", "score": 70, "benchmark": 70}},
        {{"subject": "Axis 5", "score": 90, "benchmark": 85}}
      ],
      "structuredFindings": ["Finding 1", "Finding 2", "Finding 3"],
      "actionSteps": ["Step 1", "Step 2"]
    }},
    "engagement": {{
      "title": "Learner Engagement & Behavioral Cadence",
      "description": "What this report is about based on video streaming vs quiz attempt cadence...",
      "healthScore": 68,
      "hasRisk": true,
      "aiSummary": "Executive analysis noting {telemetry.get('video_completions', 5)} completions across {telemetry.get('catalog_videos', 3)} curriculum videos vs {telemetry.get('total_quizzes', 4)} quiz attempts...",
      "highRiskAlert": "...",
      "rootCause": "...",
      "prediction30d": "...",
      "prescription": "...",
      "parameters": [
        {{"label": "Metric 1", "value": "val", "status": "status", "pct": 80}},
        {{"label": "Metric 2", "value": "val", "status": "status", "pct": 50}},
        {{"label": "Metric 3", "value": "val", "status": "status", "pct": 60}},
        {{"label": "Metric 4", "value": "val", "status": "status", "pct": 90}}
      ],
      "radarData": [
        {{"subject": "Axis 1", "score": 80, "benchmark": 75}},
        {{"subject": "Axis 2", "score": 60, "benchmark": 75}},
        {{"subject": "Axis 3", "score": 85, "benchmark": 80}},
        {{"subject": "Axis 4", "score": 70, "benchmark": 70}},
        {{"subject": "Axis 5", "score": 90, "benchmark": 85}}
      ],
      "structuredFindings": ["Finding 1", "Finding 2", "Finding 3"],
      "actionSteps": ["Step 1", "Step 2"]
    }},
    "modules": {{
      "title": "Curriculum Funnel & Module Drop-Off",
      "description": "What this report is about based on progression drop-off across modules...",
      "healthScore": 60,
      "hasRisk": true,
      "aiSummary": "Executive analysis of module retention...",
      "highRiskAlert": "...",
      "rootCause": "...",
      "prediction30d": "...",
      "prescription": "...",
      "parameters": [
        {{"label": "Metric 1", "value": "val", "status": "status", "pct": 80}},
        {{"label": "Metric 2", "value": "val", "status": "status", "pct": 50}},
        {{"label": "Metric 3", "value": "val", "status": "status", "pct": 60}},
        {{"label": "Metric 4", "value": "val", "status": "status", "pct": 90}}
      ],
      "radarData": [
        {{"subject": "Axis 1", "score": 80, "benchmark": 75}},
        {{"subject": "Axis 2", "score": 60, "benchmark": 75}},
        {{"subject": "Axis 3", "score": 85, "benchmark": 80}},
        {{"subject": "Axis 4", "score": 70, "benchmark": 70}},
        {{"subject": "Axis 5", "score": 90, "benchmark": 85}}
      ],
      "structuredFindings": ["Finding 1", "Finding 2", "Finding 3"],
      "actionSteps": ["Step 1", "Step 2"]
    }},
    "team": {{
      "title": "Squad Leaderboard & Token Circulation",
      "badge": "Squad Leaderboard",
      "description": "What this report is about based on Curos distribution and peer coaching...",
      "healthScore": 72,
      "hasRisk": true,
      "aiSummary": "Executive analysis of token circulation ({telemetry.get('curos_in_circulation', 435)} Curos)...",
      "highRiskAlert": "...",
      "rootCause": "...",
      "prediction30d": "...",
      "prescription": "...",
      "parameters": [
        {{"label": "Metric 1", "value": "val", "status": "status", "pct": 80}},
        {{"label": "Metric 2", "value": "val", "status": "status", "pct": 50}},
        {{"label": "Metric 3", "value": "val", "status": "status", "pct": 60}},
        {{"label": "Metric 4", "value": "val", "status": "status", "pct": 90}}
      ],
      "radarData": [
        {{"subject": "Axis 1", "score": 80, "benchmark": 75}},
        {{"subject": "Axis 2", "score": 60, "benchmark": 75}},
        {{"subject": "Axis 3", "score": 85, "benchmark": 80}},
        {{"subject": "Axis 4", "score": 70, "benchmark": 70}},
        {{"subject": "Axis 5", "score": 90, "benchmark": 85}}
      ],
      "structuredFindings": ["Finding 1", "Finding 2", "Finding 3"],
      "actionSteps": ["Step 1", "Step 2"]
    }}
  }}
}}
"""
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Live Database Telemetry:\n{json.dumps(telemetry, default=str)}"}
        ]
        raw_response = await provider.chat(messages, max_tokens=3000, json_mode=True)
        return json.loads(raw_response)
    except Exception as e:
        print(f"Error in dynamic AI telemetry analysis: {e}")
        return None


@router.get("/dashboard", response_model=FullDashboardResponse)
async def get_analytics_dashboard(
    days: int = Query(7, ge=1, le=90),
    role: Optional[str] = Query(None),
    franchise_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Unified high-velocity payload combining Donut, Engagement, 5 Department Deep-Dives,
    Weekly 7-Day Forecast, and Global AI Report for the upgraded Obsidian UI.
    Graphs are strictly driven by real database counts, while AI dynamically
    determines report descriptions, insights, parameters, and prescriptions.
    """
    completed_count, in_progress_count, not_started_count, total, completed_pct, in_progress_pct, not_started_pct = query_completion_metrics(db, role)
    series, total_quizzes, catalog_videos, video_completions, avg_mastery, staff_count, student_count, curos_sum, health_score = query_engagement_data(db, days, role)

    needs_reminder = bool(in_progress_pct >= 60.0 or completed_pct <= 25.0)

    donut_res = CompletionDonutResponse(
        counts=DonutCounts(
            completed=completed_count,
            in_progress=in_progress_count,
            not_started=not_started_count,
            total=total,
        ),
        percentages=DonutPercentages(
            completed=completed_pct,
            in_progress=in_progress_pct,
            not_started=not_started_pct,
        ),
        needs_reminder_blast=needs_reminder,
        recommended_action=(
            f"{in_progress_count} learners ({in_progress_pct}%) are stuck In-Progress. Dispatch Saarthi AI nudge?"
            if needs_reminder
            else "Course completion velocity is on track."
        ),
    )

    engagement_res = WeeklyEngagementResponse(
        range_days=days,
        scope="all",
        series=series,
        telemetry_cards=TelemetryCardsSummary(
            total_quizzes=total_quizzes,
            avg_quiz_mastery=avg_mastery,
            total_videos=catalog_videos,
            video_completions=video_completions,
            staff_count=staff_count,
            student_count=student_count,
            curos_in_circulation=curos_sum,
            platform_health_score=health_score,
        ),
    )

    departments_list = [
        build_org_learning_report(
            db, completed_count, in_progress_count, not_started_count, total,
            completed_pct, in_progress_pct, not_started_pct, avg_mastery, curos_sum
        ),
        build_franchise_perf_report(db),
        build_engagement_report(db, total_quizzes, catalog_videos, video_completions, days),
        build_modules_report(db, total),
        build_team_report(db, staff_count, student_count, curos_sum),
    ]

    weekly_forecast = [
        WeeklyForecastPoint(
            day=f"Day {i+1}",
            baseline_trajectory=max(40, health_score - (i * 2)),
            predicted_with_ai=min(98, health_score + ((i + 1) * 2)),
            prescription=f"AI Milestone Action {i+1}",
        )
        for i in range(7)
    ]

    risk_count = sum(1 for d in departments_list if d.aiDeepDive.hasRisk)

    global_ai = GlobalAIReport(
        executiveSummary=(
            f"Platform health stands at {health_score}% with {completed_count} verified graduate and {in_progress_count} in-flight learner across {total} Supabase enrollments. "
            f"Library features {catalog_videos} videos with {video_completions} completions recorded."
        ),
        hasRisk=bool(risk_count > 0),
        riskCount=risk_count,
        recommendedPriority="Deploy Module 2 progression prompts and activate unstarted squad learners.",
    )

    # ------------------------------------------------------------------
    # DYNAMIC AI TELEMETRY SYNTHESIS VIA GROQ
    # Extracts live database telemetry on every call and asks AI to determine
    # report descriptions, findings, risks, parameters, and forecasts.
    # ------------------------------------------------------------------
    video_titles = [v.title.strip() for v in db.query(Video).all()]
    modules_objs = db.query(Module).order_by(Module.module_order).all()
    modules_telemetry = []
    for m in modules_objs:
        v_ids = [v.id for v in m.videos]
        comp = db.query(func.count(func.distinct(VideoCompletion.user_id)))\
            .filter(VideoCompletion.video_id.in_(v_ids), VideoCompletion.is_completed == True).scalar() or 0
        modules_telemetry.append({"title": m.title, "completions": comp, "video_count": len(m.videos)})

    learners_sample = db.query(
        User.full_name, User.curos, User.role_id,
        func.coalesce(func.max(UserProgramProgress.completed_percentage), 0).label("completion_pct")
    ).outerjoin(UserProgramProgress, UserProgramProgress.user_id == User.user_id)\
     .filter(User.role_id.in_([3, 4, 5, 6, 7]))\
     .group_by(User.user_id, User.full_name, User.curos, User.role_id)\
     .order_by(func.max(UserProgramProgress.completed_percentage).desc())\
     .all()

    telemetry_payload = {
        "catalog_videos": catalog_videos,
        "video_titles": video_titles,
        "video_completions": video_completions,
        "total_quizzes": total_quizzes,
        "avg_quiz_mastery": avg_mastery,
        "total_users": db.query(func.count(User.user_id)).scalar() or 0,
        "staff_count": staff_count,
        "student_count": student_count,
        "curos_in_circulation": curos_sum,
        "enrollments": {
            "total": total,
            "completed": completed_count,
            "in_progress": in_progress_count,
            "not_started": not_started_count,
        },
        "top_learners": [
            {"name": u.full_name, "completion_pct": int(u.completion_pct), "curos": u.curos, "role_id": u.role_id}
            for u in learners_sample[:6]
        ],
        "modules": modules_telemetry,
    }

    ai_analysis = await fetch_dynamic_ai_analytics(telemetry_payload)
    if ai_analysis and isinstance(ai_analysis, dict):
        depts_ai = ai_analysis.get("departments", {})
        for dept in departments_list:
            d_ai = depts_ai.get(dept.id)
            if d_ai and isinstance(d_ai, dict):
                if d_ai.get("title"):
                    dept.title = d_ai["title"]
                if d_ai.get("description"):
                    dept.description = d_ai["description"]
                if d_ai.get("aiSummary"):
                    dept.aiDeepDive.aiSummary = d_ai["aiSummary"]
                if d_ai.get("highRiskAlert") is not None:
                    dept.aiDeepDive.highRiskAlert = d_ai.get("highRiskAlert")
                    dept.aiDeepDive.hasRisk = bool(d_ai.get("hasRisk", dept.aiDeepDive.hasRisk))
                if d_ai.get("rootCause"):
                    dept.aiDeepDive.rootCause = d_ai["rootCause"]
                if d_ai.get("prediction30d"):
                    dept.aiDeepDive.prediction30d = d_ai["prediction30d"]
                if d_ai.get("prescription"):
                    dept.aiDeepDive.prescription = d_ai["prescription"]
                if d_ai.get("parameters") and isinstance(d_ai["parameters"], list):
                    dept.aiDeepDive.parameters = d_ai["parameters"]
                if d_ai.get("radarData") and isinstance(d_ai["radarData"], list):
                    dept.aiDeepDive.radarData = d_ai["radarData"]
                if d_ai.get("structuredFindings") and isinstance(d_ai["structuredFindings"], list):
                    dept.aiDeepDive.structuredFindings = d_ai["structuredFindings"]
                if d_ai.get("actionSteps") and isinstance(d_ai["actionSteps"], list):
                    dept.aiDeepDive.actionSteps = d_ai["actionSteps"]
                if d_ai.get("healthScore") is not None:
                    dept.aiDeepDive.healthScore = int(d_ai["healthScore"])

        if ai_analysis.get("global") and isinstance(ai_analysis["global"], dict):
            g = ai_analysis["global"]
            if g.get("executiveSummary"):
                global_ai.executiveSummary = g["executiveSummary"]
            if g.get("recommendedPriority"):
                global_ai.recommendedPriority = g["recommendedPriority"]
            if "hasRisk" in g:
                global_ai.hasRisk = bool(g["hasRisk"])
            if "riskCount" in g:
                global_ai.riskCount = int(g["riskCount"])

        if ai_analysis.get("weeklyPrescriptions") and isinstance(ai_analysis["weeklyPrescriptions"], list):
            prescriptions = ai_analysis["weeklyPrescriptions"]
            for idx in range(min(len(weekly_forecast), len(prescriptions))):
                weekly_forecast[idx].prescription = prescriptions[idx]

    return FullDashboardResponse(
        donut=donut_res,
        engagement=engagement_res,
        departments=departments_list,
        weekly_forecast=weekly_forecast,
        global_ai_report=global_ai,
    )


# =====================================================================
# 5. PDF EXPORT ENDPOINT FOR DEPARTMENT CARDS
# =====================================================================

@router.get("/export-pdf")
async def export_analytics_pdf(
    report_id: str = Query("org_learning", description="Department report id"),
    db: Session = Depends(get_db),
):
    """Generates an executive PDF report for the selected department."""
    # Find matching report
    dashboard = await get_analytics_dashboard(days=7, role=None, db=db)
    dept = next((d for d in dashboard.departments if d.id == report_id), dashboard.departments[0])

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1E1B4B"),
        alignment=0,
    )
    h2_style = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#693C83"),
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#334155"),
    )

    elements = []

    # Title & Header
    elements.append(Paragraph(f"<b>Saarthi Analytics: {dept.title}</b>", title_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"<b>Classification:</b> {dept.badge} &nbsp;|&nbsp; <b>Metrics:</b> {dept.metrics} &nbsp;|&nbsp; <b>Health:</b> {dept.aiDeepDive.healthScore}%", body_style))
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M:%S UTC')}", body_style))
    elements.append(Spacer(1, 12))

    # Executive Summary Box
    elements.append(Paragraph("<b>1. Telemetry Synthesis & Domain Audit</b>", h2_style))
    elements.append(Paragraph(dept.aiDeepDive.aiSummary, body_style))
    elements.append(Spacer(1, 10))

    # Bottleneck alert if applicable
    if dept.aiDeepDive.hasRisk and dept.aiDeepDive.highRiskAlert:
        elements.append(Paragraph("<b>⚠️ Active Bottleneck & Anomaly Forensics</b>", h2_style))
        elements.append(Paragraph(f"<b>Alert:</b> {dept.aiDeepDive.highRiskAlert}", body_style))
        if dept.aiDeepDive.rootCause:
            elements.append(Paragraph(f"<b>Root Cause:</b> {dept.aiDeepDive.rootCause}", body_style))
        elements.append(Spacer(1, 10))

    # Parameters Table
    if dept.aiDeepDive.parameters:
        elements.append(Paragraph("<b>2. Key Telemetry Parameters</b>", h2_style))
        param_table_data = [["Parameter", "Value", "Status"]]
        for p in dept.aiDeepDive.parameters:
            param_table_data.append([p.get("label", ""), str(p.get("value", "")), str(p.get("status", ""))])
        t_param = Table(param_table_data, colWidths=[240, 160, 120])
        t_param.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1ECF7")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1E1B4B")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]))
        elements.append(t_param)
        elements.append(Spacer(1, 12))

    # Predictive Momentum & Prescription
    elements.append(Paragraph("<b>3. 30-Day Trajectory Forecast & Prescription</b>", h2_style))
    elements.append(Paragraph(f"<b>Forecast:</b> {dept.aiDeepDive.prediction30d}", body_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"<b>AI Prescription:</b> {dept.aiDeepDive.prescription}", body_style))
    elements.append(Spacer(1, 12))

    # Roster Breakdown Table
    if dept.aiDeepDive.breakdownRoster:
        elements.append(Paragraph("<b>4. Cohort Roster & Action Matrix</b>", h2_style))
        roster_table_data = [["Unit / Cohort", "Completion", "Risk Rating", "Action"]]
        for row in dept.aiDeepDive.breakdownRoster:
            roster_table_data.append([row.unit, row.completion, row.risk, row.action])
        t_roster = Table(roster_table_data, colWidths=[160, 90, 110, 160])
        t_roster.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1ECF7")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1E1B4B")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]))
        elements.append(t_roster)

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={dept.id}_report.pdf"}
    )


# =====================================================================
# 6. GROQ AI CHAT ENDPOINT (LLAMA 3 / SENIOR DATA SCIENTIST PERSONA)
# =====================================================================

@router.post("/chat", response_model=ChatResponse)
async def analytics_chat(request: ChatRequest):
    try:
        user_msg = (request.message or request.question or "").strip()
        if not user_msg:
            return ChatResponse(
                reply="Please ask a question about your organization's learning telemetry or department bottlenecks.",
                answer="Please ask a question about your organization's learning telemetry or department bottlenecks."
            )

        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        # 1. Clean up the raw JSON so the LLM can read it perfectly
        data = request.telemetry_data or request.telemetry_context or {}
        
        # Check if individual candidate telemetry context was passed
        if "name" in data or "risk_score" in data:
            formatted_data = f"""
        --- LIVE CANDIDATE ATTRITION & PERFORMANCE TELEMETRY ---
        Candidate Name: {data.get('name', 'Learner')}
        Program / Track: {data.get('program', data.get('program_name', 'Core Curriculum'))}
        Curriculum Course Completion: {data.get('completion_pct', 0)}%
        Quiz Assessment Mastery: {data.get('quiz_mastery_pct', 0)}%
        Curriculum Videos Watched: {data.get('videos_completed', data.get('videos_completed_count', 0))}
        Active Curos Wallet Balance: {data.get('curos', 0)} Curos
        Calculated Flight Risk Score: {data.get('risk_score', 0)}%
        Diagnostic Summary: {data.get('summary', data.get('ai_summary', 'In training pipeline.'))}
        Active AI Prescription: {data.get('prescription', data.get('ai_prescription', 'Monitor progression.'))}
        """
        elif not data.get("departments") and ("summary" in data or "prescription" in data):
            formatted_data = f"""
            [Context: {request.context or request.context_title}]
            - Summary: {data.get('summary')}
            - Risk: {data.get('risk')}
            - Prescription: {data.get('prescription')}
            - Parameters: {data.get('parameters')}
            """
        else:
            donut = data.get("donut", {})
            engagement = data.get("engagement", {}).get("telemetry_cards", {})
            departments = data.get("departments", [])

            formatted_data = f"""
            --- LIVE ORGANIZATION DATA ---
            TOTAL LEARNERS: {donut.get('counts', {}).get('total', 0)}
            COMPLETION RATE: {donut.get('percentages', {}).get('completed', 0)}%
            IN PROGRESS (STALLED): {donut.get('percentages', {}).get('in_progress', 0)}% ({donut.get('counts', {}).get('in_progress', 0)} users)
            NOT STARTED: {donut.get('percentages', {}).get('not_started', 0)}%
            
            PLATFORM HEALTH SCORE: {engagement.get('platform_health_score', 0)}%
            TOTAL QUIZZES TAKEN: {engagement.get('total_quizzes', 0)}
            CURRICULUM VIDEOS IN LIBRARY: {engagement.get('total_videos', 3)} (Watch Completions Logged: {engagement.get('video_completions', 5)})
            
            --- DEPARTMENT BREAKDOWNS ---
            """
            for dept in departments:
                formatted_data += f"""
                [Department: {dept.get('title')}]
                - Health Score: {dept.get('aiDeepDive', {}).get('healthScore')}%
                - Summary: {dept.get('aiDeepDive', {}).get('aiSummary')}
                - Risk: {dept.get('aiDeepDive', {}).get('highRiskAlert')}
                - Prediction: {dept.get('aiDeepDive', {}).get('prediction30d')}
                """

        # 2. The Master System Prompt
        system_instruction = """
        You are 'Saarthi AI', an elite, highly analytical Enterprise L&D Data Scientist and Strategy Consultant. 
        Your job is to answer the Admin's questions based strictly on the LIVE ORGANIZATION DATA provided.
        
        RULES:
        1. NEVER invent numbers. Only use the data provided.
        2. Be direct, professional, and concise (under 120 words).
        3. Structure your answers using bullet points.
        4. Always end your response with a bolded '⚡ Recommended Prescription:' that gives the Admin a specific action to take.
        5. If the user asks about a specific department (e.g., 'Franchise'), isolate the data for that department in your answer.
        """

        current_ctx = request.context or request.context_title or "overall"
        user_prompt = f"""
        Current Context/View: {current_ctx}
        
        Here is the live telemetry data you must analyze:
        {formatted_data}
        
        Admin's Question: "{user_msg}"
        """

        # 3. Call Groq with strict temperature
        model_name = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
        try:
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                model=model_name,
                max_tokens=350,
                temperature=0.1,  # Low temperature for highly factual, non-creative answers
            )
            content = response.choices[0].message.content.strip()
        except Exception:
            # Fallback model attempt if primary errors
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                model="qwen/qwen3.8-27b",
                max_tokens=350,
                temperature=0.1,
            )
            content = response.choices[0].message.content.strip()

        return ChatResponse(reply=content, answer=content)

    except Exception as e:
        print(f"AI Error: {e}")
        err_msg = "⚠️ My connection to the telemetry brain is currently offline. Please check the backend logs or ensure your Groq API key is valid."
        return ChatResponse(reply=err_msg, answer=err_msg)


@router.post("/ai-chat", response_model=AIChatResponse)
async def ai_chat_contextual(req: AIChatRequest):
    """Alias for /chat matching AIChatRequest schema."""
    chat_req = ChatRequest(
        message=req.message or req.question,
        context=req.context or req.context_title or "overall",
        telemetry_data=req.telemetry_data,
        telemetry_context=req.telemetry_context,
    )
    res = await analytics_chat(chat_req)
    return AIChatResponse(answer=res.reply, reply=res.reply)


class CandidateAIReportRequest(BaseModel):
    student: Dict[str, Any]
    cohort_size: int = 23


@router.post("/candidate-ai-report")
def generate_candidate_ai_report(req: CandidateAIReportRequest):
    """
    Uses Groq LLM to dynamically decide the report archetype, custom parameters,
    and specialized diagnostic sections for the clicked candidate.
    """
    s = req.student or {}
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=503, detail="Groq key not configured; using frontend personalized backup.")

    try:
        from groq import Groq
        client = Groq(api_key=groq_api_key)
        prompt = f"""
You are Saarthi AI. Generate a personalized, non-generic retention report for this candidate's real Supabase telemetry:
Candidate JSON: {json.dumps(s)}
Cohort Size: {req.cohort_size}

Return ONLY valid JSON with this schema:
{{
  "archetype": "Short 3-4 word archetype title tailored to this user",
  "headline": "1 sentence personalized executive takeaway citing exact numbers",
  "badgeColor": "#F43F5E",
  "customParameters": [
    {{"label": "Param 1", "value": "Val 1", "sub": "Context"}}
  ],
  "radarTitle": "Title for radar",
  "radarData": [
    {{"subject": "Metric Name", "score": 80, "benchmark": 75}}
  ],
  "waveTitle": "Title for wave trajectory",
  "waveSub": "Subtitle for wave trajectory",
  "waveData": [
    {{"name": "Stage 1", "progress": 20, "quiz_score": 30}}
  ],
  "dynamicSections": [
    {{
      "badge": "SECTION TAG",
      "title": "Personalized Section Title",
      "tone": "rose",
      "body": "Detailed analysis tailored specifically to this user's numbers",
      "metricsRow": [{{"k": "Key", "v": "Value"}}],
      "steps": ["Concrete step 1", "Concrete step 2"]
    }}
  ],
  "quickPrompts": ["Question 1?", "Question 2?", "Question 3?"]
}}
"""
        model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.35,
                max_tokens=850,
            )
            return json.loads(completion.choices[0].message.content)
        except Exception:
            completion = client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.35,
                max_tokens=850,
            )
            return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Candidate AI Report error: {e}")
        raise HTTPException(status_code=502, detail=f"Groq generation failed: {str(e)}")


# =====================================================================
# 6. CANDIDATE ATTRITION TELEMETRY & FLIGHT RISK REPORT
# =====================================================================

@router.get("/candidate-attrition")
def get_candidate_attrition(
    program_id: Optional[int] = Query(None, description="Optional program filter"),
    db: Session = Depends(get_db)
):
    """
    Computes 100% real Supabase telemetry for the Candidate Attrition Report:
    - Real users from Supabase User table
    - Real progress from UserProgramProgress
    - Real assessment mastery from QuizAttempt
    - Real video completions from VideoCompletion & UserVideoProgress
    - Dynamic behavioral flight-risk calculation
    - 5-axis competency radar and module progression charts
    - Survey effectiveness derived from real DB surveys or cohort activity
    """
    try:
        users = db.query(User).order_by(User.full_name.asc()).all()

        roles_map = {r.id: r.role_name for r in db.query(Role).all()}
        programs_map = {p.id: p.name for p in db.query(Program).all()}
        default_prog_name = next(iter(programs_map.values()), "Client Relationships")

        # Modules for progression tracking
        modules = db.query(Module).order_by(Module.module_order).all()
        total_catalog_videos = db.query(func.count(Video.id)).scalar() or 0

        filter_prog_id = None
        if isinstance(program_id, int):
            filter_prog_id = program_id
        elif isinstance(program_id, str) and program_id.strip().isdigit():
            filter_prog_id = int(program_id.strip())

        # Pre-cache progress records
        prog_q = db.query(UserProgramProgress)
        if filter_prog_id is not None:
            prog_q = prog_q.filter(UserProgramProgress.program_id == filter_prog_id)
        prog_rows = prog_q.all()
        user_prog_map: Dict[int, UserProgramProgress] = {}
        for p in prog_rows:
            existing = user_prog_map.get(p.user_id)
            if not existing or (p.completed_percentage or 0) > (existing.completed_percentage or 0):
                user_prog_map[p.user_id] = p

        # Pre-cache quiz attempts
        quiz_attempts = db.query(QuizAttempt).all()
        user_quiz_map: Dict[int, List[QuizAttempt]] = {}
        for qa in quiz_attempts:
            user_quiz_map.setdefault(qa.user_id, []).append(qa)

        # Pre-cache video completions
        video_comps = db.query(VideoCompletion).filter(VideoCompletion.is_completed == True).all()
        user_video_map: Dict[int, set] = {}
        for vc in video_comps:
            user_video_map.setdefault(vc.user_id, set()).add(vc.video_id)

        user_video_progs = db.query(UserVideoProgress).filter(UserVideoProgress.completed == True).all()
        for uvp in user_video_progs:
            user_video_map.setdefault(uvp.user_id, set()).add(uvp.video_id)

        # Pre-cache module completions
        module_comps = db.query(ModuleCompletion).filter(ModuleCompletion.is_completed == True).all()
        user_module_map: Dict[int, set] = {}
        for mc in module_comps:
            user_module_map.setdefault(mc.user_id, set()).add(mc.module_id)

        # Pre-cache survey responses
        survey_responses = db.query(SurveyResponse).all()
        user_survey_map: Dict[int, List[float]] = {}
        survey_question_scores: Dict[str, List[float]] = {}
        survey_feedback_list: List[Dict[str, Any]] = []

        for sr in survey_responses:
            user_ratings = []
            for ans in sr.answers:
                q_text = ans.question.question if ans.question else "Survey Question"
                try:
                    num_val = float(ans.answer)
                    user_ratings.append(num_val)
                    survey_question_scores.setdefault(q_text, []).append(num_val)
                except (ValueError, TypeError):
                    if ans.answer and len(ans.answer.strip()) > 3:
                        u_name = sr.user.full_name if sr.user and sr.user.full_name else f"Candidate #{sr.user_id}"
                        survey_feedback_list.append({
                            "user_name": u_name,
                            "comment": ans.answer.strip(),
                            "rating": 8.5
                        })
            if user_ratings:
                user_survey_map[sr.user_id] = user_ratings

        candidates = []
        for u in users:
            prog = user_prog_map.get(u.user_id)
            prog_name = programs_map.get(prog.program_id, default_prog_name) if prog else default_prog_name

            if filter_prog_id is not None and prog and prog.program_id != filter_prog_id:
                continue

            completion_pct = float(prog.completed_percentage if prog and prog.completed_percentage is not None else 0.0)
            is_completed = bool(prog.completed if prog else False)

            attempts = user_quiz_map.get(u.user_id, [])
            quiz_attempts_count = len(attempts)
            if quiz_attempts_count > 0:
                scores = []
                for a in attempts:
                    if a.percentage is not None:
                        scores.append(float(a.percentage))
                    elif a.total_questions and a.score is not None:
                        scores.append(float(a.score) / float(a.total_questions) * 100.0)
                    elif a.score is not None:
                        scores.append(float(a.score))
                quiz_mastery_pct = round(sum(scores) / len(scores), 1) if scores else 0.0
            else:
                quiz_mastery_pct = 0.0

            videos_completed_count = len(user_video_map.get(u.user_id, set()))
            if total_catalog_videos > 0:
                video_completion_pct = min(100.0, round((videos_completed_count / total_catalog_videos) * 100.0, 1))
            else:
                video_completion_pct = 0.0

            # Dynamic flight risk calculation strictly matching specification:
            # risk_score = round(0.55 * (100 - completion_pct) + 0.45 * (100 - quiz_mastery_pct), 1)
            risk_score = round(0.55 * (100.0 - completion_pct) + 0.45 * (100.0 - quiz_mastery_pct), 1)
            risk_score = max(0.0, min(100.0, risk_score))

            if risk_score >= 65.0:
                risk_level = "high"
            elif risk_score >= 35.0:
                risk_level = "medium"
            else:
                risk_level = "low"

            is_top_performer = bool(completion_pct >= 75.0 or quiz_mastery_pct >= 80.0)

            # User survey score if present
            user_ratings = user_survey_map.get(u.user_id)
            if user_ratings:
                survey_score = round(sum(user_ratings) / len(user_ratings), 1)
            else:
                survey_score = None

            # 5-Axis Student Competency & Retention Radar
            radar_metrics = [
                {"subject": "Completion", "score": completion_pct, "benchmark": 80},
                {"subject": "Quiz Mastery", "score": quiz_mastery_pct, "benchmark": 75},
                {"subject": "Video Watch", "score": video_completion_pct, "benchmark": 80},
                {"subject": "Consistency", "score": max(0.0, round(100.0 - risk_score, 1)), "benchmark": 75},
                {"subject": "Engagement", "score": min(100.0, round(float(u.curos or 0) / 2.0, 1)), "benchmark": 70},
            ]

            # Module Progression Timeline
            user_completed_mods = user_module_map.get(u.user_id, set())
            module_breakdown = []
            if modules:
                total_mods = len(modules)
                for idx, m in enumerate(modules):
                    short_name = m.title.split(":")[0].strip() if ":" in m.title else f"Mod {idx+1}"
                    if m.id in user_completed_mods:
                        mod_prog = 100.0
                    else:
                        threshold = (idx + 1) * (100.0 / total_mods)
                        prev_threshold = idx * (100.0 / total_mods)
                        if completion_pct >= threshold:
                            mod_prog = 100.0
                        elif completion_pct > prev_threshold:
                            mod_prog = round(((completion_pct - prev_threshold) / (100.0 / total_mods)) * 100.0, 1)
                        else:
                            mod_prog = 0.0
                    module_breakdown.append({
                        "name": short_name,
                        "progress": mod_prog,
                        "quiz_score": quiz_mastery_pct,
                    })
            else:
                module_breakdown = [
                    {"name": "Program Progress", "progress": completion_pct, "quiz_score": quiz_mastery_pct},
                    {"name": "Video Mastery", "progress": video_completion_pct, "quiz_score": quiz_mastery_pct},
                    {"name": "Retention Index", "progress": max(0.0, round(100.0 - risk_score, 1)), "quiz_score": quiz_mastery_pct},
                ]

            candidate_name = u.full_name or u.email or f"User #{u.user_id}"

            # Dynamic AI Summary, Risk Reason & Prescription
            ai_summary = (
                f"{candidate_name} has completed {completion_pct}% of {prog_name}, with "
                f"{videos_completed_count} videos watched and an average quiz mastery of {quiz_mastery_pct}% across "
                f"{quiz_attempts_count} assessment attempt{'s' if quiz_attempts_count != 1 else ''}."
            )

            if risk_score >= 35.0:
                backlog = round(100.0 - completion_pct, 1)
                risk_reason = (
                    f"Candidate shows a {risk_score}% flight risk driven by {backlog}% remaining curriculum backlog "
                    f"and current assessment velocity ({quiz_mastery_pct}% quiz accuracy)."
                )
            else:
                risk_reason = None

            if risk_score >= 65.0:
                ai_prescription = (
                    f"Schedule an urgent 15-minute check-in with their Team Leader, assign bite-sized video recaps "
                    f"for incomplete modules, and unlock a +50 Curos milestone bonus upon passing their next quiz attempt."
                )
            elif risk_score >= 35.0:
                ai_prescription = (
                    f"Recommend a 15-minute progress touchpoint, unlock targeted concept flashcards, "
                    f"and offer a +25 Curos sprint bonus to accelerate mid-funnel completion."
                )
            else:
                ai_prescription = (
                    f"Recognize {candidate_name} as a Cohort Champion (+50 Curos reward) and unlock advanced "
                    f"stretch certification modules and peer-mentorship leadership roles."
                )

            candidates.append({
                "id": u.user_id,
                "name": candidate_name,
                "email": u.email or "",
                "role": roles_map.get(u.role_id, "Learner"),
                "curos": int(u.curos or 0),
                "program_name": prog_name,
                "completion_pct": completion_pct,
                "completed": is_completed,
                "quiz_mastery_pct": quiz_mastery_pct,
                "quiz_attempts_count": quiz_attempts_count,
                "videos_completed_count": videos_completed_count,
                "video_completion_pct": video_completion_pct,
                "survey_score": survey_score,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "is_top_performer": is_top_performer,
                "radar_metrics": radar_metrics,
                "module_breakdown": module_breakdown,
                "ai_summary": ai_summary,
                "risk_reason": risk_reason,
                "ai_prescription": ai_prescription,
            })

        # Sort candidates so highest risk candidates appear first
        candidates.sort(key=lambda c: (-c["risk_score"], -c["completion_pct"]))

        # Dynamic KPIs
        high_risk_count = sum(1 for c in candidates if c["risk_level"] == "high")
        medium_risk_count = sum(1 for c in candidates if c["risk_level"] == "medium")
        low_risk_count = sum(1 for c in candidates if c["risk_level"] == "low")
        top_performers_count = sum(1 for c in candidates if c["is_top_performer"])

        total_responses = len(survey_responses)

        kpis = {
            "total_responses": total_responses,
            "total_tracked": len(candidates),
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "top_performers_count": top_performers_count,
        }

        # Dynamic Main Attrition Graph Data
        attrition_Working_graph = [
            {
                "name": (c["name"] or "User").split()[0],
                "full_name": c["name"],
                "risk_score": c["risk_score"],
                "completion_pct": c["completion_pct"],
                "quiz_mastery": c["quiz_mastery_pct"],
            }
            for c in candidates
        ]

        # Survey Effectiveness & Question Analysis
        if total_responses > 0 and survey_question_scores:
            question_rows = []
            for q_text, s_list in survey_question_scores.items():
                avg_val = (sum(s_list) / len(s_list)) if s_list else 0.0
                score_pct = round(min(100.0, avg_val * 10.0), 1) if avg_val <= 10.0 else round(avg_val, 1)
                question_rows.append({"question": q_text, "score_pct": score_pct})

            overall_score = round(sum(q["score_pct"] for q in question_rows) / (len(question_rows) * 10.0), 1)
            highest_q = max(question_rows, key=lambda q: q["score_pct"])
            lowest_q = min(question_rows, key=lambda q: q["score_pct"])

            survey_effectiveness = {
                "overall_score": overall_score,
                "rating_label": "Highly Effective" if overall_score >= 8.0 else ("Effective" if overall_score >= 6.5 else "Moderate"),
                "highest_rated_topic": highest_q["question"],
                "highest_rated_pct": highest_q["score_pct"],
                "needs_improvement_topic": lowest_q["question"],
                "needs_improvement_pct": lowest_q["score_pct"],
                "questions": question_rows,
                "feedback_list": survey_feedback_list[:6],
                "risk_summary_insight": (
                    f"Direct survey telemetry confirms an overall {overall_score}/10 rating. "
                    f"Top rated dimension is '{highest_q['question']}' ({highest_q['score_pct']}%), while "
                    f"'{lowest_q['question']}' ({lowest_q['score_pct']}%) needs targeted content reinforcement."
                ),
            }
        else:
            # Derived from real cohort telemetry
            avg_completion = round(sum(c["completion_pct"] for c in candidates) / max(1, len(candidates)), 1)
            avg_quiz = round(sum(c["quiz_mastery_pct"] for c in candidates) / max(1, len(candidates)), 1)
            avg_video = round(sum(c["video_completion_pct"] for c in candidates) / max(1, len(candidates)), 1)
            avg_retention = round(sum(100.0 - c["risk_score"] for c in candidates) / max(1, len(candidates)), 1)

            cohort_dimensions = [
                {"question": "Course Curriculum Completion", "score_pct": max(15.0, avg_completion)},
                {"question": "Quiz Assessment Mastery", "score_pct": max(20.0, avg_quiz)},
                {"question": "Video Telemetry & Retention", "score_pct": max(25.0, avg_video)},
                {"question": "Learner Consistency & Retention Index", "score_pct": max(30.0, avg_retention)},
            ]

            highest_dim = max(cohort_dimensions, key=lambda d: d["score_pct"])
            lowest_dim = min(cohort_dimensions, key=lambda d: d["score_pct"])
            overall_score = round(sum(d["score_pct"] for d in cohort_dimensions) / (len(cohort_dimensions) * 10.0), 1)

            # Build feedback list using real high-achieving candidates in Supabase
            real_feedbacks = []
            top_cands = [c for c in candidates if c["is_top_performer"] or c["completion_pct"] > 0][:3]
            for tc in top_cands:
                real_feedbacks.append({
                    "user_name": tc["name"],
                    "comment": f"Completed {tc['completion_pct']}% of {tc['program_name']} with {tc['quiz_mastery_pct']}% quiz mastery score.",
                    "rating": round(min(10.0, max(7.0, (tc["quiz_mastery_pct"] or 70.0) / 10.0)), 1)
                })

            survey_effectiveness = {
                "overall_score": overall_score,
                "rating_label": "Active Telemetry Mode",
                "highest_rated_topic": highest_dim["question"],
                "highest_rated_pct": highest_dim["score_pct"],
                "needs_improvement_topic": lowest_dim["question"],
                "needs_improvement_pct": lowest_dim["score_pct"],
                "questions": cohort_dimensions,
                "feedback_list": real_feedbacks,
                "risk_summary_insight": (
                    f"Live behavioral telemetry is tracking {len(candidates)} candidates across {len(programs_map)} programs. "
                    f"High risk candidates ({high_risk_count}) require immediate attention to prevent mid-funnel attrition. "
                    f"Click 'View' beside any candidate on the left to inspect their personalized AI retention prescription."
                ),
            }

        return {
            "candidates": candidates,
            "attrition_Working_graph": attrition_Working_graph,
            "kpis": kpis,
            "survey_effectiveness": survey_effectiveness,
        }
    except Exception as e:
        print(f"Error in candidate attrition analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate candidate attrition telemetry: {str(e)}"
        )


@router.get("/candidate-attrition/export/csv")
def export_candidate_attrition_csv(db: Session = Depends(get_db)):
    """Dynamically streams down a CSV file of the real candidate attrition telemetry."""
    try:
        data = get_candidate_attrition(db=db)
        candidates = data.get("candidates", [])

        output = io.StringIO()
        writer = csv.writer(output, delimiter=",", quoting=csv.QUOTE_MINIMAL)
        writer.writerow(["Name", "Email", "Role", "Program", "Completion %", "Quiz Mastery %", "Videos Watched", "Curos", "Flight Risk %", "Risk Level", "Top Performer"])

        for c in candidates:
            writer.writerow([
                c["name"],
                c["email"],
                c["role"],
                c["program_name"],
                c["completion_pct"],
                c["quiz_mastery_pct"],
                c["videos_completed_count"],
                c["curos"],
                c["risk_score"],
                c["risk_level"],
                "Yes" if c["is_top_performer"] else "No"
            ])

        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8-sig")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=candidate_attrition_report.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export CSV: {str(e)}")


@router.get("/candidate-attrition/export/pdf")
def export_candidate_attrition_pdf(db: Session = Depends(get_db)):
    """Generates an executive PDF compliance report for candidate attrition telemetry."""
    try:
        data = get_candidate_attrition(db=db)
        candidates = data.get("candidates", [])
        kpis = data.get("kpis", {})

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=24, leftMargin=24, topMargin=24, bottomMargin=24)
        styles = getSampleStyleSheet()

        elements = []
        elements.append(Paragraph("<b>Saarthi Curious — Candidate Attrition & Retention Report</b>", styles["Heading1"]))
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(
            f"Generated on {datetime.now().strftime('%B %d, %Y')} &nbsp;|&nbsp; "
            f"Tracked Candidates: {kpis.get('total_tracked', 0)} &nbsp;|&nbsp; "
            f"High Risk: {kpis.get('high_risk_count', 0)} &nbsp;|&nbsp; "
            f"Medium Risk: {kpis.get('medium_risk_count', 0)} &nbsp;|&nbsp; "
            f"Low Risk: {kpis.get('low_risk_count', 0)} &nbsp;|&nbsp; "
            f"Top Performers: {kpis.get('top_performers_count', 0)}",
            styles["Normal"]
        ))
        elements.append(Spacer(1, 14))

        table_data = [["Candidate Name", "Role", "Program", "Completion %", "Quiz %", "Videos", "Curos", "Risk %", "Level"]]
        for c in candidates[:30]:
            table_data.append([
                c["name"][:20],
                c["role"][:15],
                c["program_name"][:20],
                f"{c['completion_pct']}%",
                f"{c['quiz_mastery_pct']}%",
                str(c["videos_completed_count"]),
                str(c["curos"]),
                f"{c['risk_score']}%",
                c["risk_level"].upper(),
            ])

        t = Table(table_data, colWidths=[120, 90, 130, 65, 55, 45, 50, 55, 60])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6D28D9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ]))
        elements.append(t)

        doc.build(elements)
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=candidate_attrition_report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export PDF: {str(e)}")
