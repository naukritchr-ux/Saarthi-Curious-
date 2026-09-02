# dashboard.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
from models import User, AuditLog
from routes.dashboard_helpers import (
    get_admin_dashboard_data,
    get_franchisee_dashboard_data,
    get_team_leader_dashboard_data,
    get_learner_dashboard_data,
    get_learner_program_stats  # Added missing import
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# ============================================
# ADMIN DASHBOARD ENDPOINT
# ============================================

@router.get("/admin/{user_id}")
def get_admin_dashboard(
    user_id: int,
    role_id: int = Query(..., description="User's role ID from frontend"),
    db: Session = Depends(get_db)
):
    """
    Admin/Master Admin Dashboard
    Role IDs: 1 (Master Admin), 2 (Admin)
    """
    # Check if user has admin access (role_id 1 or 2)
    if role_id not in [1, 2]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin or Master Admin privileges required."
        )
    
    # Get all dashboard data using helpers
    dashboard_data = get_admin_dashboard_data(db)
    
    # Add role-specific info
    dashboard_data["user_role"] = {
        "role_id": role_id,
        "role_type": "master_admin" if role_id == 1 else "admin"
    }
    
    return dashboard_data


# ============================================
# TEAM LEADER DASHBOARD ENDPOINT
# ============================================

@router.get("/team-leader/{user_id}")
def get_team_leader_dashboard(
    user_id: int,
    role_id: int = Query(..., description="User's role ID from frontend"),
    db: Session = Depends(get_db)
):
    """
    Team Leader dashboard.
    Role IDs: 3 (Team Leader), 6 (Franchise Developer)
    """
    if role_id not in [3, 6]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Team Leader or Franchise Developer privileges required."
        )

    return get_team_leader_dashboard_data(db, user_id)


# ============================================
# AUDIT LOGS ENDPOINT
# ============================================

@router.get("/audit-logs")
def get_audit_logs(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    actor_name: Optional[str] = Query(None, description="Filter by actor name"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    limit: int = Query(100, description="Maximum number of logs to return"),
    offset: int = Query(0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    Get all audit logs with optional filters
    """
    query = db.query(AuditLog)
    
    # Filter by date range
    if start_date:
        try:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(AuditLog.created_at >= start_datetime)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(AuditLog.created_at < end_datetime)
        except ValueError:
            pass
    
    # Filter by actor name (case-insensitive partial match)
    if actor_name:
        query = query.filter(AuditLog.actor_name.ilike(f"%{actor_name}%"))
    
    # Filter by action type
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    
    # Filter by entity type
    if entity_type:
        query = query.filter(AuditLog.entity_type.ilike(f"%{entity_type}%"))
    
    # Order by most recent first
    query = query.order_by(AuditLog.created_at.desc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    logs = query.offset(offset).limit(limit).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "actor_id": log.actor_id,
                "actor_name": log.actor_name,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "message": log.message,
                "metadata": log.log_metadata,
                "ip_address": log.ip_address,
                "created_at": log.created_at
            }
            for log in logs
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }
    
# ============================================
# FRANCHISEE DASHBOARD ENDPOINT
# ============================================

@router.get("/franchisee/{user_id}")
def get_franchisee_dashboard(
    user_id: int,
    role_id: int = Query(..., description="User's role ID from frontend"),
    db: Session = Depends(get_db)
):
    """
    Franchisee Dashboard
    Role IDs: 4 (Franchise Partner), 6 (Franchise Developer)
    """
    if role_id not in [4, 6]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Franchise Partner or Franchise Developer privileges required."
        )

    return get_franchisee_dashboard_data(db, user_id)


# ============================================
# LEARNER DASHBOARD ENDPOINT
# ============================================

@router.get("/learner/{user_id}")
def get_learner_dashboard(
    user_id: int,
    role_id: int = Query(..., description="User's role ID from frontend"),
    db: Session = Depends(get_db)
):
    """
    Learner Dashboard
    Role IDs: 3 (Team Leader), 4 (Franchise Partner), 5 (Franchise Employee), 6 (Franchise Developer), 7 (Head Office Staff)
    """
    # Allow learners with role 3, 4, 5, 6, or 7
    if role_id not in [3, 4, 5, 6, 7]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Learner privileges required."
        )

    return get_learner_dashboard_data(db, user_id)


# ============================================
# GENERIC ROUTE (Redirects by role)
# ============================================

@router.get("/{user_id}")
def get_dashboard_by_role(
    user_id: int,
    role_id: int = Query(..., description="User's role ID from frontend"),
    db: Session = Depends(get_db)
):
    """
    Generic dashboard router - returns available dashboards based on role
    Role 1, 2: admin_dashboard only
    Role 3: team_leader_dashboard + learner_dashboard
    Role 4, 6: franchisee_dashboard + learner_dashboard
    Role 5, 7: learner_dashboard only
    """
    response = {
        "available_dashboards": [],
        "role_id": role_id
    }
    
    # Route based on role
    if role_id in [1, 2]:  # Admin or Master Admin
        response["available_dashboards"] = ["admin"]
        response["admin_dashboard"] = get_admin_dashboard(user_id, role_id, db)
        
    elif role_id in [3, 6]:  # Team Leader or Franchise Developer
        response["available_dashboards"] = ["team_leader", "learner"]
        response["team_leader_dashboard"] = get_team_leader_dashboard(user_id, role_id, db)
        response["learner_dashboard"] = get_learner_dashboard_data(db, user_id)
        
    elif role_id in [4, 6]:  # Franchise Partner or Developer (Optimized by combining cases)
        response["available_dashboards"] = ["franchisee", "learner"]
        response["franchisee_dashboard"] = get_franchisee_dashboard(user_id, role_id, db)
        response["learner_dashboard"] = get_learner_dashboard_data(db, user_id)
        
    elif role_id in [5, 7]:  # Franchise Employee or Head Office Staff
        response["available_dashboards"] = ["learner"]
        response["learner_dashboard"] = get_learner_dashboard_data(db, user_id)
        
    else:
        raise HTTPException(
            status_code=400,
            detail=f"No dashboard configured for role ID: {role_id}"
        )
    
    return response


# ============================================
# LEARNER PROGRAM STATS ENDPOINT
# ============================================

@router.get("/learner/{user_id}/program/{program_id}")
def get_learner_program_details(
    user_id: int,
    program_id: int,
    role_id: int = Query(..., description="User's role ID from frontend"),
    db: Session = Depends(get_db)
):
    """
    Get detailed stats for a specific program for a learner.
    """
    # Allow learners with role 3, 4, 5, 6, or 7
    if role_id not in [3, 4, 5, 6, 7]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Learner privileges required."
        )

    return get_learner_program_stats(db, user_id, program_id)