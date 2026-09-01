from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Role
from routes.audit_helpers import create_audit_log

router = APIRouter()

VALID_PERMISSIONS = {"dashboard", "programs", "reports", "analytics", "settings"}

@router.get("/roles")
def get_roles(
    db: Session = Depends(get_db)
):
    roles = db.query(Role).order_by(Role.id).all()
    return jsonable_encoder([
        {
            "id": role.id,
            "role_name": role.role_name,
            "dashboard": role.dashboard,
            "programs": role.programs,
            "reports": role.reports,
            "analytics": role.analytics,
            "settings": role.settings,
        }
        for role in roles
    ])

@router.put(
    "/roles/{id}/permissions"
)
def update_permission(
    id: int,
    data: dict,
    request: Request,
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None)
):

    role = db.query(Role).filter(
        Role.id == id
    ).first()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    permission = data.get("permission")
    value = data.get("value")

    if permission not in VALID_PERMISSIONS:
        raise HTTPException(status_code=400, detail="Invalid permission")

    # Capture old value for audit log
    old_value = getattr(role, permission)

    setattr(role, permission, value)

    db.commit()

    # Create audit log
    create_audit_log(
        db=db,
        request=request,
        actor_id=actor_id,
        actor_name=actor_name,
        action="role_permission_updated",
        entity_type="role",
        entity_id=id,
        message=f"Updated {permission} permission for role {role.role_name}",
        metadata={
            "role_id": id,
            "role_name": role.role_name,
            "permission": permission,
            "old_value": old_value,
            "new_value": value
        }
    )

    return {
        "message": "Updated"
    }