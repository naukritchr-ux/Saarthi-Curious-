from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date as DateType, time as TimeType, datetime

from database import get_db
from models import Task, User, UserGoogleToken
from services.google_calendar import create_google_meet_event

router = APIRouter(prefix="/tasks", tags=["Tasks"])


class TaskCreate(BaseModel):
    admin_id: Optional[int] = 2
    title: str
    description: Optional[str] = None
    date: DateType
    start_time: Optional[TimeType] = None
    end_time: Optional[TimeType] = None
    task_type: Optional[str] = "task"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[DateType] = None
    start_time: Optional[TimeType] = None
    end_time: Optional[TimeType] = None
    is_completed: Optional[bool] = None
    task_type: Optional[str] = None


@router.post("")
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    # Determine valid admin_id
    admin_id = payload.admin_id or 2
    admin_user = db.query(User).filter(User.user_id == admin_id).first()
    if not admin_user:
        # Fallback to first existing user
        first_user = db.query(User).first()
        if first_user:
            admin_id = first_user.user_id
        else:
            admin_id = 2

    # Calculate valid start and end times
    st = payload.start_time
    et = payload.end_time
    if st and et and et <= st:
        from datetime import datetime as dt, timedelta
        tmp_dt = dt.combine(payload.date, st) + timedelta(minutes=30)
        et = tmp_dt.time()

    task = Task(
        admin_id=admin_id,
        title=payload.title,
        description=payload.description,
        date=payload.date,
        start_time=st,
        end_time=et,
        task_type=payload.task_type or "task",
        is_completed=False,
    )
    db.add(task)
    db.flush()

    # Sync to linked Google Calendar (only if this admin has their own token)
    token_row = (
        db.query(UserGoogleToken)
        .filter(
            UserGoogleToken.user_id == admin_id,
            UserGoogleToken.refresh_token.isnot(None),
            UserGoogleToken.refresh_token != "pending_auth",
            UserGoogleToken.refresh_token != "",
        )
        .order_by(UserGoogleToken.updated_at.desc(), UserGoogleToken.id.desc())
        .first()
    )

    if token_row and token_row.refresh_token:
        try:
            from datetime import time as dt_time, timedelta
            cal_st = st or dt_time(9, 0)
            cal_et = et or dt_time(10, 0)
            start_dt = datetime.combine(payload.date, cal_st)
            end_dt = datetime.combine(payload.date, cal_et)
            if end_dt <= start_dt:
                end_dt = start_dt + timedelta(minutes=30)

            attendee_list = []
            if admin_user and admin_user.email:
                attendee_list.append(admin_user.email)
            if token_row.google_email and token_row.google_email not in attendee_list:
                attendee_list.append(token_row.google_email)

            res = create_google_meet_event(
                title=f"[Task] {payload.title}",
                start_datetime=start_dt,
                end_datetime=end_dt,
                refresh_token=token_row.refresh_token,
                attendees=attendee_list,
                description=payload.description or f"Saarthi Task: {payload.title}",
            )
            print(f"[tasks] Synced task to Google Calendar: {res.get('event_id')}")
        except Exception as e:
            print(f"[tasks] Google sync warning: {e}")

    db.commit()
    db.refresh(task)
    return {
        "message": "Task created successfully",
        "task": {
            "id": task.id,
            "admin_id": task.admin_id,
            "title": task.title,
            "description": task.description,
            "date": task.date.isoformat(),
            "start_time": task.start_time.isoformat() if task.start_time else None,
            "end_time": task.end_time.isoformat() if task.end_time else None,
            "is_completed": task.is_completed,
            "task_type": task.task_type,
        },
    }


@router.get("")
def get_tasks(
    admin_id: int = Query(...),
    month: Optional[str] = Query(None),
    date_str: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    query = db.query(Task).filter(Task.admin_id == admin_id)
    if date_str:
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
            query = query.filter(Task.date == d)
        except ValueError:
            pass
    elif month:
        try:
            import calendar
            year, m = map(int, month.split("-"))
            last_day = calendar.monthrange(year, m)[1]
            query = query.filter(
                Task.date >= DateType(year, m, 1),
                Task.date <= DateType(year, m, last_day),
            )
        except Exception:
            pass

    tasks = query.order_by(Task.date, Task.start_time).all()
    return [
        {
            "id": t.id,
            "admin_id": t.admin_id,
            "title": t.title,
            "description": t.description,
            "date": t.date.isoformat(),
            "start_time": t.start_time.isoformat() if t.start_time else None,
            "end_time": t.end_time.isoformat() if t.end_time else None,
            "is_completed": t.is_completed,
            "task_type": t.task_type,
        }
        for t in tasks
    ]


@router.patch("/{task_id}")
@router.put("/{task_id}")
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.date is not None:
        task.date = payload.date
    if payload.start_time is not None:
        task.start_time = payload.start_time
    if payload.end_time is not None:
        task.end_time = payload.end_time
    if payload.is_completed is not None:
        task.is_completed = payload.is_completed
    if payload.task_type is not None:
        task.task_type = payload.task_type

    db.commit()
    db.refresh(task)
    return {
        "message": "Task updated successfully",
        "task": {
            "id": task.id,
            "admin_id": task.admin_id,
            "title": task.title,
            "description": task.description,
            "date": task.date.isoformat(),
            "start_time": task.start_time.isoformat() if task.start_time else None,
            "end_time": task.end_time.isoformat() if task.end_time else None,
            "is_completed": task.is_completed,
            "task_type": task.task_type,
        },
    }


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
