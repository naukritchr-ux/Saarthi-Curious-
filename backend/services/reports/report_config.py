"""
Report Configuration Schema

Data-driven report definitions that specify:
- Required database tables
- Required columns (no SELECT *)
- Join conditions (only when needed)
- Filter conditions (apply before aggregation)
- Aggregation rules
- Output schema structure
"""

from typing import Dict, List, Any, Optional
from datetime import date


# Report configuration schema
REPORT_CONFIGS = {
    "my_learning_report": {
        "tables": ["users", "user_program_progress", "quiz_attempts", "user_badges", "learning_streaks", "programs"],
        "columns": {
            "users": ["user_id", "full_name", "curos", "date_of_joining"],
            "user_program_progress": ["user_id", "program_id", "completed", "completed_percentage", "created_at", "completed_at"],
            "quiz_attempts": ["user_id", "quiz_id", "percentage", "attempted_at"],
            "user_badges": ["user_id", "earned_at"],
            "learning_streaks": ["user_id", "current_streak"],
            "programs": ["id", "name"]
        },
        "joins": [
            {
                "from": "user_program_progress",
                "to": "programs",
                "on": "user_program_progress.program_id = programs.id"
            }
        ],
        "filters": [
            "user_program_progress.user_id = :user_id",
            "quiz_attempts.user_id = :user_id",
            "user_badges.user_id = :user_id",
            "learning_streaks.user_id = :user_id"
        ],
        "aggregations": {
            "completed_programs": "COUNT(CASE WHEN user_program_progress.completed = true THEN 1 END)",
            "in_progress_programs": "COUNT(CASE WHEN user_program_progress.completed = false THEN 1 END)",
            "avg_quiz_score": "AVG(quiz_attempts.percentage)",
            "highest_quiz_score": "MAX(quiz_attempts.percentage)",
            "lowest_quiz_score": "MIN(quiz_attempts.percentage)",
            "total_quiz_attempts": "COUNT(quiz_attempts.id)",
            "total_badges": "COUNT(user_badges.id)"
        },
        "output_schema": {
            "report_metadata": {
                "report_type": "my_learning_report",
                "generated_for": "user_id",
                "filters": {},
                "reporting_period": {}
            },
            "user_info": {
                "user_id": "int",
                "full_name": "str",
                "curos": "int",
                "date_of_joining": "date"
            },
            "summary": {
                "completed_programs": "int",
                "in_progress_programs": "int",
                "total_curos": "int",
                "current_streak": "int"
            },
            "completed_programs": [
                {
                    "name": "str",
                    "completed_date": "str",
                    "score": "float"
                }
            ],
            "quiz_performance": {
                "average": "float",
                "highest": "float",
                "lowest": "float",
                "total_attempts": "int"
            },
            "badges": [
                {
                    "name": "str",
                    "earned_date": "str"
                }
            ]
        }
    },
    
    "team_progress_report": {
        "tables": ["users", "user_program_progress", "quiz_attempts"],
        "columns": {
            "users": ["user_id", "full_name", "Team_Leader_id"],
            "user_program_progress": ["user_id", "program_id", "completed", "completed_percentage", "created_at"],
            "quiz_attempts": ["user_id", "quiz_id", "percentage", "attempted_at"]
        },
        "joins": [],
        "filters": [
            "users.Team_Leader_id = :team_leader_id OR users.Team_Leader_id IS NULL"  # For comprehensive team view
        ],
        "aggregations": {
            "total_employees": "COUNT(DISTINCT users.user_id)",
            "active_employees": "COUNT(DISTINCT user_program_progress.user_id)",
            "completion_rate": "(COUNT(CASE WHEN user_program_progress.completed = true THEN 1 END) * 100.0 / NULLIF(COUNT(user_program_progress.id), 0))",
            "pending_employees": "COUNT(DISTINCT users.user_id) - COUNT(DISTINCT user_program_progress.user_id)"
        },
        "output_schema": {
            "report_metadata": {
                "report_type": "team_progress_report",
                "generated_for": "team_leader_id",
                "filters": {},
                "reporting_period": {}
            },
            "summary": {
                "total_employees": "int",
                "active_employees": "int",
                "completion_rate": "float",
                "pending_employees": "int"
            },
            "top_performers": [
                {
                    "name": "str",
                    "programs_completed": "int",
                    "avg_score": "float"
                }
            ],
            "pending_employees": [
                {
                    "name": "str",
                    "pending_programs": "int",
                    "last_activity": "str"
                }
            ]
        }
    },
    
    "franchise_performance_report": {
        "tables": ["users", "user_program_progress"],
        "columns": {
            "users": ["user_id", "full_name", "Team_Leader_id", "role_id"],
            "user_program_progress": ["user_id", "program_id", "completed", "completed_percentage", "created_at"]
        },
        "joins": [],
        "filters": [
            "users.role_id IN (4, 5)",  # Franchise Partner and Franchise Employee
            "users.Team_Leader_id = :franchise_manager_id OR users.Team_Leader_id IS NULL"
        ],
        "aggregations": {
            "total_franchises": "COUNT(DISTINCT users.Team_Leader_id)",
            "avg_completion_rate": "AVG(CASE WHEN user_program_progress.completed = true THEN user_program_progress.completed_percentage ELSE 0 END)",
            "total_employees": "COUNT(DISTINCT users.user_id)",
            "active_employees": "COUNT(DISTINCT user_program_progress.user_id)"
        },
        "output_schema": {
            "report_metadata": {
                "report_type": "franchise_performance_report",
                "generated_for": "franchise_id",
                "filters": {},
                "reporting_period": {}
            },
            "summary": {
                "total_franchises": "int",
                "avg_completion_rate": "float",
                "total_employees": "int",
                "active_employees": "int"
            },
            "franchise_comparison": [
                {
                    "name": "str",
                    "completion": "float",
                    "employees": "int"
                }
            ]
        }
    },
    
    "organization_learning_report": {
        "tables": ["users", "user_program_progress", "programs"],
        "columns": {
            "users": ["user_id"],
            "user_program_progress": ["user_id", "program_id", "completed", "completed_percentage", "created_at"],
            "programs": ["id", "name", "status"]
        },
        "joins": [
            {
                "from": "user_program_progress",
                "to": "programs",
                "on": "user_program_progress.program_id = programs.id"
            }
        ],
        "filters": [
            "programs.status = 'Published'"
        ],
        "aggregations": {
            "total_learners": "COUNT(DISTINCT users.user_id)",
            "active_learners": "COUNT(DISTINCT user_program_progress.user_id)",
            "total_programs": "COUNT(DISTINCT programs.id)",
            "completion_rate": "(COUNT(CASE WHEN user_program_progress.completed = true THEN 1 END) * 100.0 / NULLIF(COUNT(user_program_progress.id), 0))"
        },
        "output_schema": {
            "report_metadata": {
                "report_type": "organization_learning_report",
                "generated_for": "organization",
                "filters": {},
                "reporting_period": {}
            },
            "summary": {
                "total_learners": "int",
                "active_learners": "int",
                "total_programs": "int",
                "completion_rate": "float"
            },
            "top_programs": [
                {
                    "name": "str",
                    "completion": "float"
                }
            ]
        }
    },
    
    "program_performance_report": {
        "tables": ["programs", "user_program_progress", "quiz_attempts", "quiz", "modules"],
        "columns": {
            "programs": ["id", "name", "status"],
            "user_program_progress": ["program_id", "user_id", "completed", "completed_percentage", "created_at"],
            "quiz_attempts": ["quiz_id", "percentage", "attempted_at"],
            "quiz": ["id", "module_id"],
            "modules": ["id", "program_id"]
        },
        "joins": [
            {
                "from": "quiz_attempts",
                "to": "quiz",
                "on": "quiz_attempts.quiz_id = quiz.id"
            },
            {
                "from": "quiz",
                "to": "modules",
                "on": "quiz.module_id = modules.id"
            },
            {
                "from": "modules",
                "to": "programs",
                "on": "modules.program_id = programs.id"
            }
        ],
        "filters": [
            "programs.status = 'Published'",
            "programs.id = :program_id OR :program_id IS NULL"  # Individual or all programs
        ],
        "aggregations": {
            "total_programs": "COUNT(DISTINCT programs.id)",
            "avg_completion_rate": "AVG(CASE WHEN user_program_progress.completed = true THEN user_program_progress.completed_percentage ELSE 0 END)",
            "avg_quiz_score": "AVG(quiz_attempts.percentage)",
            "total_enrollments": "COUNT(user_program_progress.id)"
        },
        "output_schema": {
            "report_metadata": {
                "report_type": "program_performance_report",
                "generated_for": "program_id or all",
                "filters": {},
                "reporting_period": {}
            },
            "summary": {
                "total_programs": "int",
                "avg_completion_rate": "float",
                "avg_quiz_score": "float"
            },
            "program_metrics": [
                {
                    "name": "str",
                    "completion": "float",
                    "avg_score": "float",
                    "enrollments": "int"
                }
            ]
        }
    },
    
    "learner_engagement_report": {
        "tables": ["users", "user_program_progress", "learning_streaks", "user_badges"],
        "columns": {
            "users": ["user_id", "role_id"],
            "user_program_progress": ["user_id", "created_at"],
            "learning_streaks": ["user_id", "current_streak"],
            "user_badges": ["user_id", "earned_at"]
        },
        "joins": [],
        "filters": [
            "users.role_id IN (3, 4, 5, 6, 7)",  # All learner roles
            "users.user_id = :user_id OR :user_id IS NULL"  # Individual or all learners
        ],
        "aggregations": {
            "avg_daily_active": "COUNT(DISTINCT user_program_progress.user_id)",
            "avg_streak": "AVG(learning_streaks.current_streak)",
            "total_badges_earned": "COUNT(user_badges.id)"
        },
        "output_schema": {
            "report_metadata": {
                "report_type": "learner_engagement_report",
                "generated_for": "user_id or all",
                "filters": {},
                "reporting_period": {}
            },
            "summary": {
                "avg_daily_active": "int",
                "avg_streak": "float",
                "total_badges_earned": "int"
            },
            "engagement_metrics": [
                {
                    "metric": "str",
                    "value": "float",
                    "change": "str"
                }
            ]
        }
    }
}


def get_report_config(report_type: str) -> Optional[Dict[str, Any]]:
    """
    Get configuration for a specific report type.
    
    Args:
        report_type: Report type identifier
        
    Returns:
        Report configuration dictionary or None if not found
    """
    return REPORT_CONFIGS.get(report_type)


def get_all_report_configs() -> Dict[str, Dict[str, Any]]:
    """
    Get all report configurations.
    
    Returns:
        Dictionary of all report configurations
    """
    return REPORT_CONFIGS


def validate_report_config(config: Dict[str, Any]) -> bool:
    """
    Validate a report configuration has all required fields.
    
    Args:
        config: Report configuration dictionary
        
    Returns:
        True if valid, False otherwise
    """
    required_fields = ["tables", "columns", "joins", "filters", "aggregations", "output_schema"]
    return all(field in config for field in required_fields)
