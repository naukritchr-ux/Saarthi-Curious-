from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from database import get_db
from models import Role, User
from routes.audit_helpers import create_audit_log

router = APIRouter()

VALID_PERMISSIONS = {"dashboard", "programs", "reports", "analytics", "settings"}


class RoleCreate(BaseModel):
    role_name: str
    dashboard: bool = False
    programs: bool = False
    reports: bool = False
    analytics: bool = False
    settings: bool = False


class RoleUpdate(BaseModel):
    role_name: str

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
            "users": [
                {
                    "id": user.user_id,
                    "name": user.full_name,
                    "email": user.email,
                    "is_active": user.is_active
                }
                for user in db.query(User).filter(User.role_id == role.id).all()
            ]
        }
        for role in roles
    ])


@router.get("/roles/{id}/users")
def get_role_users(
    id: int,
    db: Session = Depends(get_db)
):
    role = db.query(Role).filter(Role.id == id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    users = db.query(User).filter(User.role_id == id).all()
    return jsonable_encoder([
        {
            "id": user.user_id,
            "name": user.full_name,
            "email": user.email,
            "is_active": user.is_active
        }
        for user in users
    ])


@router.post("/roles")
def create_role(
    role_data: RoleCreate,
    request: Request,
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None)
):
    # Check if role name already exists
    existing_role = db.query(Role).filter(Role.role_name == role_data.role_name).first()
    if existing_role:
        raise HTTPException(status_code=400, detail="Role with this name already exists")
    
    try:
        new_role = Role(
            role_name=role_data.role_name,
            dashboard=role_data.dashboard,
            programs=role_data.programs,
            reports=role_data.reports,
            analytics=role_data.analytics,
            settings=role_data.settings,
        )
        db.add(new_role)
        db.commit()
        db.refresh(new_role)
        
        # Create audit log
        create_audit_log(
            db=db,
            request=request,
            actor_id=actor_id,
            actor_name=actor_name,
            action="role_created",
            entity_type="role",
            entity_id=new_role.id,
            message=f"Created new role: {new_role.role_name}",
            metadata={
                "role_id": new_role.id,
                "role_name": new_role.role_name,
                "permissions": {
                    "dashboard": role_data.dashboard,
                    "programs": role_data.programs,
                    "reports": role_data.reports,
                    "analytics": role_data.analytics,
                    "settings": role_data.settings,
                }
            }
        )
        
        return {
            "id": new_role.id,
            "role_name": new_role.role_name,
            "dashboard": new_role.dashboard,
            "programs": new_role.programs,
            "reports": new_role.reports,
            "analytics": new_role.analytics,
            "settings": new_role.settings,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create role: {str(e)}")

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

    # Debug logging
    print(f"DEBUG: permission type: {type(permission)}, value: {permission}")
    print(f"DEBUG: value type: {type(value)}, value: {value}")

    # Validate permission is a string, not a dict
    if not isinstance(permission, str):
        raise HTTPException(status_code=400, detail=f"Invalid permission format: expected string, got {type(permission)}")

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


@router.put("/roles/{id}")
def update_role_name(
    id: int,
    role_data: RoleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None)
):
    role = db.query(Role).filter(Role.id == id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    old_name = role.role_name
    role.role_name = role_data.role_name
    
    try:
        db.commit()
        db.refresh(role)
        
        create_audit_log(
            db=db,
            request=request,
            actor_id=actor_id,
            actor_name=actor_name,
            action="role_name_updated",
            entity_type="role",
            entity_id=id,
            message=f"Updated role name from {old_name} to {role.role_name}",
            metadata={
                "role_id": id,
                "old_name": old_name,
                "new_name": role.role_name
            }
        )
        
        return {
            "id": role.id,
            "role_name": role.role_name,
            "dashboard": role.dashboard,
            "programs": role.programs,
            "reports": role.reports,
            "analytics": role.analytics,
            "settings": role.settings,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")


@router.delete("/roles/{id}")
def delete_role(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None)
):
    # Prevent deletion of default roles (IDs 1-7)
    if id <= 7:
        raise HTTPException(status_code=403, detail="Cannot delete default system roles")
    
    role = db.query(Role).filter(Role.id == id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    role_name = role.role_name
    
    try:
        db.delete(role)
        db.commit()
        
        create_audit_log(
            db=db,
            request=request,
            actor_id=actor_id,
            actor_name=actor_name,
            action="role_deleted",
            entity_type="role",
            entity_id=id,
            message=f"Deleted role: {role_name}",
            metadata={
                "role_id": id,
                "role_name": role_name
            }
        )
        
        return {"message": "Role deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete role: {str(e)}")