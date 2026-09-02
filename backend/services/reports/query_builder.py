"""
Query Builder for Data-Driven Reports

Builds SQL queries dynamically from report configuration:
- Applies role-based visibility filters before data retrieval
- Selects only required columns (no SELECT *)
- Applies filters before aggregation
- Respects organizational hierarchy
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, select
from typing import Dict, Any, List, Optional, Tuple
from datetime import date
from models import User, UserProgramProgress, QuizAttempt, UserBadge, LearningStreak, Program, Module, Quiz
from .report_config import get_report_config


class QueryBuilder:
    """Builds SQL queries dynamically from report configuration"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def build_query(
        self,
        report_type: str,
        user_id: int,
        role_id: int,
        filters: Optional[Dict[str, Any]] = None,
        period_start: Optional[date] = None,
        period_end: Optional[date] = None
    ) -> Tuple[select, Dict[str, Any]]:
        """
        Build a SQL query based on report configuration.
        
        Args:
            report_type: Type of report to generate
            user_id: User ID requesting the report
            role_id: Role ID of the user
            filters: Additional filter options
            period_start: Period start date
            period_end: Period end date
            
        Returns:
            Tuple of (SQLAlchemy select object, parameters dict)
        """
        config = get_report_config(report_type)
        if not config:
            raise ValueError(f"Unknown report type: {report_type}")
        
        # Build base query with required columns
        query = self._build_base_query(config)
        
        # Apply role-based visibility filters
        query = self._apply_visibility_filters(query, config, user_id, role_id, filters)
        
        # Apply time period filters
        query = self._apply_period_filters(query, config, period_start, period_end)
        
        # Apply additional filters from config
        query = self._apply_config_filters(query, config, filters)
        
        # Build parameters
        params = self._build_params(config, user_id, role_id, filters)
        
        return query, params
    
    def _build_base_query(self, config: Dict[str, Any]) -> select:
        """
        Build base query with required columns only.
        
        Args:
            config: Report configuration
            
        Returns:
            SQLAlchemy select object
        """
        # Get primary table (first in tables list)
        primary_table = config["tables"][0]
        table_map = {
            "users": User,
            "user_program_progress": UserProgramProgress,
            "quiz_attempts": QuizAttempt,
            "user_badges": UserBadge,
            "learning_streaks": LearningStreak,
            "programs": Program,
            "modules": Module,
            "quiz": Quiz
        }
        
        primary_model = table_map.get(primary_table)
        if not primary_model:
            raise ValueError(f"Unknown table: {primary_table}")
        
        # Select only required columns
        columns = config["columns"].get(primary_table, [])
        column_objects = []
        for col_name in columns:
            if hasattr(primary_model, col_name):
                column_objects.append(getattr(primary_model, col_name))
        
        if not column_objects:
            # Fallback to selecting all columns if none specified
            query = select(primary_model)
        else:
            query = select(*column_objects)
        
        # Apply joins
        for join_config in config.get("joins", []):
            from_table = join_config["from"]
            to_table = join_config["to"]
            
            from_model = table_map.get(from_table)
            to_model = table_map.get(to_table)
            
            if from_model and to_model:
                query = query.join(to_model, eval(join_config["on"]))
        
        return query
    
    def _apply_visibility_filters(
        self,
        query: select,
        config: Dict[str, Any],
        user_id: int,
        role_id: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> select:
        """
        Apply role-based visibility filters based on organizational hierarchy.
        
        Args:
            query: SQLAlchemy select object
            config: Report configuration
            user_id: User ID
            role_id: Role ID
            filters: Additional filter options
            
        Returns:
            Modified query with visibility filters
        """
        # Admin and Master Admin can see everything
        if role_id in [1, 2]:
            return query
        
        # Apply hierarchy-based filters
        if role_id in [3, 6]:  # Team Leader or Franchise Developer
            # Can see their own data and their team members
            query = query.where(
                or_(
                    User.user_id == user_id,
                    User.Team_Leader_id == user_id
                )
            )
        elif role_id == 4:  # Franchise Partner
            # Can see themselves and their franchise employees
            query = query.where(
                or_(
                    User.user_id == user_id,
                    and_(
                        User.Team_Leader_id == user_id,
                        User.role_id == 5
                    )
                )
            )
        elif role_id == 5:  # Franchise Employee
            # Can only see their own data
            query = query.where(User.user_id == user_id)
        elif role_id == 7:  # Head Office Staff
            # Can only see their own learner data
            query = query.where(User.user_id == user_id)
        
        return query
    
    def _apply_period_filters(
        self,
        query: select,
        config: Dict[str, Any],
        period_start: Optional[date],
        period_end: Optional[date]
    ) -> select:
        """
        Apply time period filters to the query.
        
        Args:
            query: SQLAlchemy select object
            config: Report configuration
            period_start: Period start date
            period_end: Period end date
            
        Returns:
            Modified query with period filters
        """
        if period_start:
            # Apply to date columns that represent creation/activity
            if "user_program_progress" in config["tables"]:
                query = query.where(UserProgramProgress.created_at >= period_start)
            if "quiz_attempts" in config["tables"]:
                query = query.where(QuizAttempt.attempted_at >= period_start)
            if "user_badges" in config["tables"]:
                query = query.where(UserBadge.earned_at >= period_start)
        
        if period_end:
            if "user_program_progress" in config["tables"]:
                query = query.where(UserProgramProgress.created_at <= period_end)
            if "quiz_attempts" in config["tables"]:
                query = query.where(QuizAttempt.attempted_at <= period_end)
            if "user_badges" in config["tables"]:
                query = query.where(UserBadge.earned_at <= period_end)
        
        return query
    
    def _apply_config_filters(
        self,
        query: select,
        config: Dict[str, Any],
        filters: Optional[Dict[str, Any]]
    ) -> select:
        """
        Apply filters defined in report configuration.
        
        Args:
            query: SQLAlchemy select object
            config: Report configuration
            filters: Additional filter options
            
        Returns:
            Modified query with config filters
        """
        # Apply static filters from config
        for filter_condition in config.get("filters", []):
            # These are SQL fragments that would need to be evaluated
            # For now, we'll handle the most common cases
            if ":user_id" in filter_condition and filters and "user_id" in filters:
                query = query.where(User.user_id == filters["user_id"])
            elif ":team_leader_id" in filter_condition and filters and "team_leader_id" in filters:
                query = query.where(User.Team_Leader_id == filters["team_leader_id"])
            elif ":franchise_manager_id" in filter_condition and filters and "franchise_manager_id" in filters:
                query = query.where(User.Team_Leader_id == filters["franchise_manager_id"])
            elif ":program_id" in filter_condition and filters and "program_id" in filters:
                if filters["program_id"] is not None:
                    query = query.where(Program.id == filters["program_id"])
        
        return query
    
    def _build_params(
        self,
        config: Dict[str, Any],
        user_id: int,
        role_id: int,
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Build parameters dictionary for the query.
        
        Args:
            config: Report configuration
            user_id: User ID
            role_id: Role ID
            filters: Additional filter options
            
        Returns:
            Parameters dictionary
        """
        params = {
            "user_id": user_id,
            "role_id": role_id
        }
        
        if filters:
            params.update(filters)
        
        return params
    
    def execute_query(
        self,
        query: select,
        params: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Execute the query and return results as dictionaries.
        
        Args:
            query: SQLAlchemy select object
            params: Query parameters
            
        Returns:
            List of result dictionaries
        """
        result = self.db.execute(query, params)
        rows = result.fetchall()
        
        # Convert to list of dictionaries
        columns = result.keys()
        return [dict(zip(columns, row)) for row in rows]
