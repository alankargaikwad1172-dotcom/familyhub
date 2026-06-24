"""
reminders.py
Create, list, and manage shopping reminders.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_user
from models import User, Reminder, FamilyMember

router = APIRouter(tags=["Reminders"])


class ReminderCreateInput(BaseModel):
    family_id: int
    title: str
    message: str = "Time for grocery shopping!"
    remind_at: str
    repeat: str = "none"


class ReminderUpdateInput(BaseModel):
    is_dismissed: Optional[bool] = None


@router.post("/reminders")
def create_reminder(
    data: ReminderCreateInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new reminder."""
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == data.family_id,
        FamilyMember.user_id == user.id,
    ).first()
    if not member:
        raise HTTPException(403, "Not a member of this family")

    reminder = Reminder(
        family_id=data.family_id,
        user_id=user.id,
        title=data.title,
        message=data.message,
        remind_at=datetime.fromisoformat(data.remind_at),
        repeat_type=data.repeat,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return {
        "id": reminder.id,
        "title": reminder.title,
        "message": reminder.message,
        "remind_at": reminder.remind_at.isoformat(),
        "repeat_type": reminder.repeat_type,
    }


@router.get("/reminders/{family_id}")
def get_reminders(
    family_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all active reminders for a family."""
    now = datetime.utcnow()
    reminders = db.query(Reminder).filter(
        Reminder.family_id == family_id,
        Reminder.is_dismissed == False,
    ).order_by(Reminder.remind_at.asc()).all()

    result = []
    for r in reminders:
        result.append({
            "id": r.id,
            "title": r.title,
            "message": r.message,
            "remind_at": r.remind_at.isoformat(),
            "repeat_type": r.repeat_type,
            "is_due": r.remind_at <= now,
            "created_by": r.creator.full_name if r.creator else "Unknown",
        })
    return result


@router.put("/reminders/{reminder_id}")
def update_reminder(
    reminder_id: int,
    data: ReminderUpdateInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dismiss or update a reminder."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(404, "Reminder not found")

    if data.is_dismissed is not None:
        reminder.is_dismissed = data.is_dismissed

    db.commit()
    return {"message": "Updated"}


@router.delete("/reminders/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a reminder."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(404, "Reminder not found")
    db.delete(reminder)
    db.commit()
    return {"message": "Deleted"}


@router.get("/reminders/{family_id}/due")
def get_due_reminders(
    family_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get reminders that are due RIGHT NOW (for polling)."""
    now = datetime.utcnow()
    reminders = db.query(Reminder).filter(
        Reminder.family_id == family_id,
        Reminder.is_dismissed == False,
        Reminder.remind_at <= now,
    ).all()

    result = []
    for r in reminders:
        result.append({
            "id": r.id,
            "title": r.title,
            "message": r.message,
            "remind_at": r.remind_at.isoformat(),
        })
    return result