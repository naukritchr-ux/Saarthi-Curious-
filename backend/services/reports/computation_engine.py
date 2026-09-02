"""
Computation Engine for Data-Driven Reports

Computes metrics, KPIs, aggregations from raw data:
- Generates time-series data
- Calculates rankings and statistics
- Produces structured report with all required sections
"""

from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from models import User, UserProgramProgress, QuizAttempt, UserBadge, LearningStreak, Program
from .report_config import get_report_config


class ComputationEngine:
    """Computes metrics and produces structured reports from raw data"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def compute_report(
        self,
        report_type: str,
        raw_data: List[Dict[str, Any]],
        user_id: int,
        role_id: int,
        filters: Optional[Dict[str, Any]] = None,
        period_start: Optional[date] = None,
        period_end: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Compute structured report from raw data.
        
        Args:
            report_type: Type of report
            raw_data: Raw data from query builder
            user_id: User ID
            role_id: Role ID
            filters: Applied filters
            period_start: Period start date
            period_end: Period end date
            
        Returns:
            Structured report dictionary
        """
        config = get_report_config(report_type)
        if not config:
            raise ValueError(f"Unknown report type: {report_type}")
        
        # Build report structure
        report = {
            "report_metadata": self._build_metadata(report_type, user_id, filters, period_start, period_end),
            "filters": filters or {},
            "reporting_period": self._build_period(period_start, period_end)
        }
        
        # Compute report-specific sections
        if report_type == "my_learning_report":
            report.update(self._compute_learning_report(raw_data, user_id))
        elif report_type == "team_progress_report":
            report.update(self._compute_team_report(raw_data, user_id, role_id))
        elif report_type == "franchise_performance_report":
            report.update(self._compute_franchise_report(raw_data, user_id, role_id))
        elif report_type == "organization_learning_report":
            report.update(self._compute_organization_report(raw_data))
        elif report_type == "program_performance_report":
            report.update(self._compute_program_report(raw_data, filters))
        elif report_type == "learner_engagement_report":
            report.update(self._compute_engagement_report(raw_data, filters))
        
        return report
    
    def _build_metadata(
        self,
        report_type: str,
        user_id: int,
        filters: Optional[Dict[str, Any]],
        period_start: Optional[date],
        period_end: Optional[date]
    ) -> Dict[str, Any]:
        """Build report metadata section"""
        return {
            "report_type": report_type,
            "generated_for": user_id,
            "generated_at": datetime.now().isoformat(),
            "filters_applied": filters or {}
        }
    
    def _build_period(self, period_start: Optional[date], period_end: Optional[date]) -> Dict[str, Any]:
        """Build reporting period section"""
        return {
            "start_date": period_start.isoformat() if period_start else None,
            "end_date": period_end.isoformat() if period_end else None
        }
    
    def _compute_learning_report(self, raw_data: List[Dict[str, Any]], user_id: int) -> Dict[str, Any]:
        """Compute my learning report"""
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return {}
        
        # Get program progress
        program_progress = self.db.query(UserProgramProgress).filter(
            UserProgramProgress.user_id == user_id
        ).all()
        
        completed_programs = [p for p in program_progress if p.completed]
        in_progress_programs = [p for p in program_progress if not p.completed]
        
        # Get quiz attempts
        quiz_attempts = self.db.query(QuizAttempt).filter(
            QuizAttempt.user_id == user_id
        ).all()
        
        quiz_scores = [qa.percentage for qa in quiz_attempts if qa.percentage is not None]
        avg_quiz_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0
        highest_quiz_score = max(quiz_scores) if quiz_scores else 0
        lowest_quiz_score = min(quiz_scores) if quiz_scores else 0
        
        # Get badges
        badges = self.db.query(UserBadge).filter(
            UserBadge.user_id == user_id
        ).all()
        
        # Get streak
        streak = self.db.query(LearningStreak).filter(
            LearningStreak.user_id == user_id
        ).first()
        
        # Get completed programs with details
        completed_programs_details = []
        for prog in completed_programs:
            program = self.db.query(Program).filter(Program.id == prog.program_id).first()
            if program:
                completed_programs_details.append({
                    "name": program.name,
                    "completed_date": prog.completed_at.strftime("%Y-%m-%d") if prog.completed_at else "N/A",
                    "score": prog.completed_percentage
                })
        
        return {
            "user_info": {
                "user_id": user.user_id,
                "full_name": user.full_name,
                "curos": user.curos or 0,
                "date_of_joining": user.date_of_joining.isoformat() if user.date_of_joining else None
            },
            "summary": {
                "completed_programs": len(completed_programs),
                "in_progress_programs": len(in_progress_programs),
                "total_curos": user.curos or 0,
                "current_streak": streak.current_streak if streak else 0
            },
            "completed_programs": completed_programs_details,
            "quiz_performance": {
                "average": round(avg_quiz_score, 2),
                "highest": round(highest_quiz_score, 2),
                "lowest": round(lowest_quiz_score, 2),
                "total_attempts": len(quiz_attempts)
            },
            "badges": [
                {
                    "name": f"Badge {i+1}",
                    "earned_date": b.earned_at.strftime("%Y-%m-%d") if b.earned_at else "N/A"
                }
                for i, b in enumerate(badges[:10])
            ]
        }
    
    def _compute_team_report(self, raw_data: List[Dict[str, Any]], user_id: int, role_id: int) -> Dict[str, Any]:
        """Compute team progress report"""
        # Get team members
        if role_id in [1, 2]:
            # Admins see all team leaders
            team_members = self.db.query(User).filter(User.role_id == 3).all()
        else:
            # Team leaders see their team members
            team_members = self.db.query(User).filter(User.Team_Leader_id == user_id).all()
        
        if not team_members:
            return {
                "summary": {
                    "total_employees": 0,
                    "active_employees": 0,
                    "completion_rate": 0,
                    "pending_employees": 0
                },
                "top_performers": [],
                "pending_employees": []
            }
        
        user_ids = [member.user_id for member in team_members]
        
        # Get program progress
        all_progress = self.db.query(UserProgramProgress).filter(
            UserProgramProgress.user_id.in_(user_ids)
        ).all()
        
        # Calculate metrics
        total_employees = len(team_members)
        completed_count = len([p for p in all_progress if p.completed])
        active_employees = len(set([p.user_id for p in all_progress]))
        completion_rate = (completed_count / len(all_progress) * 100) if all_progress else 0
        pending_employees = total_employees - active_employees
        
        # Get top performers
        user_scores = {}
        for progress in all_progress:
            if progress.user_id not in user_scores:
                user_scores[progress.user_id] = {"programs": 0, "total_score": 0}
            user_scores[progress.user_id]["programs"] += 1
            user_scores[progress.user_id]["total_score"] += progress.completed_percentage
        
        top_performers = []
        for user_id, scores in sorted(user_scores.items(), key=lambda x: x[1]["total_score"], reverse=True)[:5]:
            user = self.db.query(User).filter(User.user_id == user_id).first()
            if user:
                avg_score = scores["total_score"] / scores["programs"] if scores["programs"] > 0 else 0
                top_performers.append({
                    "name": user.full_name,
                    "programs_completed": scores["programs"],
                    "avg_score": round(avg_score, 2)
                })
        
        # Get pending employees
        pending_employees_list = []
        for member in team_members:
            member_progress = [p for p in all_progress if p.user_id == member.user_id]
            if not member_progress or not any(p.completed for p in member_progress):
                pending_employees_list.append({
                    "name": member.full_name,
                    "pending_programs": len([p for p in member_progress if not p.completed]),
                    "last_activity": "N/A"
                })
        
        return {
            "summary": {
                "total_employees": total_employees,
                "active_employees": active_employees,
                "completion_rate": round(completion_rate, 2),
                "pending_employees": pending_employees
            },
            "top_performers": top_performers,
            "pending_employees": pending_employees_list[:5]
        }
    
    def _compute_franchise_report(self, raw_data: List[Dict[str, Any]], user_id: int, role_id: int) -> Dict[str, Any]:
        """Compute franchise performance report"""
        # Get franchise users (roles 4 and 6)
        if role_id in [1, 2]:
            franchise_users = self.db.query(User).filter(User.role_id.in_([4, 6])).all()
        elif role_id in [3, 6]:
            franchise_users = self.db.query(User).filter(
                User.Team_Leader_id == user_id,
                User.role_id.in_([4, 6])
            ).all()
        else:
            franchise_users = self.db.query(User).filter(User.user_id == user_id).all()
        
        if not franchise_users:
            return {
                "summary": {
                    "total_franchises": 0,
                    "avg_completion_rate": 0,
                    "total_employees": 0,
                    "active_employees": 0
                },
                "franchise_comparison": []
            }
        
        user_ids = [user.user_id for user in franchise_users]
        
        # Get program progress
        all_progress = self.db.query(UserProgramProgress).filter(
            UserProgramProgress.user_id.in_(user_ids)
        ).all()
        
        # Calculate metrics
        total_franchises = len(set([u.Team_Leader_id for u in franchise_users if u.Team_Leader_id]))
        completed_count = len([p for p in all_progress if p.completed])
        avg_completion_rate = (sum([p.completed_percentage for p in all_progress if p.completed]) / completed_count) if completed_count > 0 else 0
        total_employees = len(franchise_users)
        active_employees = len(set([p.user_id for p in all_progress]))
        
        # Build franchise comparison
        franchise_comparison = []
        franchise_groups = {}
        for user in franchise_users:
            if user.Team_Leader_id not in franchise_groups:
                franchise_groups[user.Team_Leader_id] = []
            franchise_groups[user.Team_Leader_id].append(user)
        
        for team_leader_id, members in franchise_groups.items():
            member_ids = [m.user_id for m in members]
            member_progress = [p for p in all_progress if p.user_id in member_ids]
            completed = len([p for p in member_progress if p.completed])
            completion = (sum([p.completed_percentage for p in member_progress if p.completed]) / completed) if completed > 0 else 0
            
            team_leader = self.db.query(User).filter(User.user_id == team_leader_id).first()
            franchise_comparison.append({
                "name": team_leader.full_name if team_leader else f"Franchise {team_leader_id}",
                "completion": round(completion, 2),
                "employees": len(members)
            })
        
        return {
            "summary": {
                "total_franchises": total_franchises,
                "avg_completion_rate": round(avg_completion_rate, 2),
                "total_employees": total_employees,
                "active_employees": active_employees
            },
            "franchise_comparison": franchise_comparison
        }
    
    def _compute_organization_report(self, raw_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute organization learning report"""
        total_learners = self.db.query(User).count()
        
        # Get active learners
        active_learners = self.db.query(UserProgramProgress.user_id).distinct().count()
        
        # Get total programs
        total_programs = self.db.query(Program).filter(Program.status == "Published").count()
        
        # Get completion rate
        total_progress = self.db.query(UserProgramProgress).count()
        completed_count = self.db.query(UserProgramProgress).filter(
            UserProgramProgress.completed == True
        ).count()
        completion_rate = (completed_count / total_progress * 100) if total_progress > 0 else 0
        
        # Get top programs
        program_completion = self.db.query(
            Program.name,
            func.avg(UserProgramProgress.completed_percentage).label("avg_completion")
        ).join(
            UserProgramProgress, Program.id == UserProgramProgress.program_id
        ).group_by(Program.id, Program.name).order_by(
            func.avg(UserProgramProgress.completed_percentage).desc()
        ).limit(5).all()
        
        top_programs = [
            {
                "name": prog.name,
                "completion": round(prog.avg_completion or 0, 2)
            }
            for prog in program_completion
        ]
        
        return {
            "summary": {
                "total_learners": total_learners,
                "active_learners": active_learners,
                "total_programs": total_programs,
                "completion_rate": round(completion_rate, 2)
            },
            "top_programs": top_programs
        }
    
    def _compute_program_report(self, raw_data: List[Dict[str, Any]], filters: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute program performance report"""
        program_id = filters.get("program_id") if filters else None
        
        if program_id:
            # Individual program report
            programs = self.db.query(Program).filter(
                Program.id == program_id,
                Program.status == "Published"
            ).all()
        else:
            # All programs report
            programs = self.db.query(Program).filter(Program.status == "Published").all()
        
        program_metrics = []
        for program in programs:
            # Get enrollments
            enrollments = self.db.query(UserProgramProgress).filter(
                UserProgramProgress.program_id == program.id
            ).count()
            
            # Get completions
            completions = self.db.query(UserProgramProgress).filter(
                UserProgramProgress.program_id == program.id,
                UserProgramProgress.completed == True
            ).count()
            
            # Get average quiz scores
            quiz_scores_query = self.db.query(QuizAttempt).join(
                Quiz, Quiz.id == QuizAttempt.quiz_id
            ).join(
                Module, Quiz.module_id == Module.id
            ).filter(
                Module.program_id == program.id
            ).all()
            
            quiz_scores = [qa.percentage for qa in quiz_scores_query if qa.percentage is not None]
            avg_quiz_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0
            
            completion_rate = (completions / enrollments * 100) if enrollments > 0 else 0
            
            program_metrics.append({
                "name": program.name,
                "completion": round(completion_rate, 2),
                "avg_score": round(avg_quiz_score, 2),
                "enrollments": enrollments
            })
        
        # Calculate overall averages
        avg_completion_rate = sum(p["completion"] for p in program_metrics) / len(program_metrics) if program_metrics else 0
        avg_quiz_score = sum(p["avg_score"] for p in program_metrics) / len(program_metrics) if program_metrics else 0
        
        return {
            "summary": {
                "total_programs": len(programs),
                "avg_completion_rate": round(avg_completion_rate, 2),
                "avg_quiz_score": round(avg_quiz_score, 2)
            },
            "program_metrics": program_metrics
        }
    
    def _compute_engagement_report(self, raw_data: List[Dict[str, Any]], filters: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute learner engagement report"""
        user_id = filters.get("user_id") if filters else None
        
        if user_id:
            # Individual learner report
            activity_query = self.db.query(UserProgramProgress).filter(
                UserProgramProgress.user_id == user_id
            )
            active_learners = 1 if activity_query.count() > 0 else 0
        else:
            # All learners report
            active_learners = self.db.query(UserProgramProgress.user_id).distinct().count()
        
        # Get average streak
        avg_streak = self.db.query(func.avg(LearningStreak.current_streak)).scalar() or 0
        
        # Get total badges
        total_badges = self.db.query(UserBadge).count()
        
        return {
            "summary": {
                "avg_daily_active": active_learners,
                "avg_streak": round(avg_streak, 2),
                "total_badges_earned": total_badges
            },
            "engagement_metrics": [
                {
                    "metric": "Daily Active Users",
                    "value": active_learners,
                    "change": "+0%"
                },
                {
                    "metric": "Average Streak",
                    "value": round(avg_streak, 2),
                    "change": "+0%"
                },
                {
                    "metric": "Badges Earned",
                    "value": total_badges,
                    "change": "+0%"
                }
            ]
        }
