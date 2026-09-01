from fastapi import Request
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from models import AuditLog


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request headers."""
    x_forwarded_for = request.headers.get('X-Forwarded-For')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    x_real_ip = request.headers.get('X-Real-IP')
    if x_real_ip:
        return x_real_ip
    return request.client.host if request.client else "unknown"


def create_audit_log(
    db: Session,
    request: Request,
    actor_id: Optional[int] = None,
    actor_name: Optional[str] = None,
    action: str = "",
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    message: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Create an audit log entry.

    Args:
        db: Database session
        request: FastAPI request object (for IP extraction)
        actor_id: ID of the user performing the action
        actor_name: Name of the user performing the action
        action: Type of action performed (e.g., "user_created", "user_updated")
        entity_type: Type of entity affected (e.g., "user", "program", "role")
        entity_id: ID of the entity affected
        message: Human-readable message describing the action
        metadata: Additional context as a dictionary (will be stored as JSON)
    """
    try:
        ip_address = get_client_ip(request)

        if metadata and not isinstance(metadata, dict):
            metadata = {}

        if metadata:
            # Remove potential SQLAlchemy objects from metadata
            metadata = {k: v for k, v in metadata.items() if not hasattr(v, '__table__')}

        audit_log = AuditLog(
            actor_id=actor_id,
            actor_name=actor_name,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            message=message,
            log_metadata=metadata,
            ip_address=ip_address
        )

        db.add(audit_log)
        db.commit()
    except Exception as e:
        print(f"Failed to create audit log: {e}")
        db.rollback()
