from fastapi import APIRouter, HTTPException
from database import SessionLocal
from models import NotificationScript, NotificationScriptRecipient
from schemas import (
    NotificationScriptCreate,
    NotificationScriptResponse
)

router = APIRouter(
    prefix="/notification-scripts",
    tags=["Notification Scripts"]
)


# Get all scripts
@router.get("", response_model=list[NotificationScriptResponse])
def get_notification_scripts():
    db = SessionLocal()

    try:
        scripts = db.query(NotificationScript).all()

        result = []

        for script in scripts:
            result.append({
                "id": script.id,
                "title": script.title,
                "message": script.message,
                "notification_type": script.notification_type,
                "audience": script.audience,
                "recipients": [
                    {
                        "type": recipient.recipient_type,
                        "value": (
                            int(recipient.recipient_value)
                            if recipient.recipient_type == "user"
                            else recipient.recipient_value
                        )
                    }
                    for recipient in script.recipients
                ],
                "schedule_type": script.schedule_type,
                "trigger_type": script.trigger_type,
                "schedule_time": script.schedule_time,
                "schedule_date": script.schedule_date,
                "is_active": script.is_active,
                "created_at_time": script.created_at_time
            })

        return result

    finally:
        db.close()

# Create script
@router.post("")
def create_notification_script(script: NotificationScriptCreate):
    db = SessionLocal()

    try:
        if script.schedule_type != "once":
            raise HTTPException(
                status_code=400,
                detail="Only one-time scheduled notifications are allowed"
            )

        if not script.schedule_date or not script.schedule_time:
            raise HTTPException(
                status_code=400,
                detail="Schedule date and time are required"
            )
        # Create notification script
        new_script = NotificationScript(
            title=script.title,
            message=script.message,
            notification_type=script.notification_type,
            audience=script.audience,
            schedule_type=script.schedule_type,
            trigger_type=script.trigger_type,
            schedule_time=script.schedule_time,
            schedule_date=script.schedule_date,
            is_active=True
        )

        db.add(new_script)
        db.commit()
        db.refresh(new_script)

        # ==========================================
        # SAVE RECIPIENTS
        # ==========================================

        for recipient in script.recipients:

            new_recipient = NotificationScriptRecipient(
                script_id=new_script.id,
                recipient_type=recipient.type,
                recipient_value=str(recipient.value)
            )

            db.add(new_recipient)

        db.commit()

        return {
            "message": "Notification script created",
            "id": new_script.id
        }

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise

    finally:
        db.close()

# Delete script
@router.delete("/{script_id}")
def delete_notification_script(script_id: int):
    db = SessionLocal()
    try:
        script = db.query(NotificationScript).filter(NotificationScript.id == script_id).first()
        
        if not script:
            raise HTTPException(status_code=404, detail="Script not found")

        db.delete(script)
        db.commit()

        return {"message": "Script deleted successfully"}
    finally:
        db.close()


# Toggle active/inactive
@router.put("/{script_id}/status")
def toggle_notification_script_status(script_id: int):
    db = SessionLocal()
    try:
        script = db.query(NotificationScript).filter(NotificationScript.id == script_id).first()
        
        if not script:
            raise HTTPException(status_code=404, detail="Script not found")

        script.is_active = not script.is_active
        db.commit()
        db.refresh(script)

        return {
            "message": "Status updated",
            "is_active": script.is_active
        }
    finally:
        db.close()


# Update script
@router.put("/{script_id}")
def update_notification_script(
    script_id: int,
    script: NotificationScriptCreate
):
    db = SessionLocal()

    try:

        if script.schedule_type != "once":
            raise HTTPException(
                status_code=400,
                detail="Only one-time scheduled notifications are allowed"
            )

        if not script.schedule_date or not script.schedule_time:
            raise HTTPException(
                status_code=400,
                detail="Schedule date and time are required"
            )
        existing_script = (
            db.query(NotificationScript)
            .filter(NotificationScript.id == script_id)
            .first()
        )

        if not existing_script:
            raise HTTPException(
                status_code=404,
                detail="Script not found"
            )

        # Update script details
        existing_script.title = script.title
        existing_script.message = script.message
        existing_script.notification_type = script.notification_type
        existing_script.audience = script.audience
        existing_script.schedule_type = script.schedule_type
        existing_script.schedule_time = script.schedule_time
        existing_script.schedule_date = script.schedule_date
        existing_script.trigger_type = script.trigger_type

        # Remove old recipients
        db.query(NotificationScriptRecipient).filter(
            NotificationScriptRecipient.script_id == script_id
        ).delete(synchronize_session=False)

        # Add the newly selected recipients
        for recipient in script.recipients:
            new_recipient = NotificationScriptRecipient(
                script_id=script_id,
                recipient_type=recipient.type,
                recipient_value=str(recipient.value)
            )

            db.add(new_recipient)

        db.commit()
        db.refresh(existing_script)

        return {
            "message": "Notification script updated",
            "id": existing_script.id
        }

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise

    finally:
        db.close()