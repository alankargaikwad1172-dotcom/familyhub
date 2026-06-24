from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import User, ShoppingItem, Reminder
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NotificationCheckResponse(BaseModel):
    has_new: bool
    new_items: list
    new_reminders: list
    latest_id: int


@router.get("/{user_id}/check")
def check_notifications(
    user_id: int,
    since_id: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check for new shopping items and due reminders since last check"""
    
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get user's family IDs
    from models import FamilyMember
    family_members = db.query(FamilyMember).filter(FamilyMember.user_id == user_id).all()
    family_ids = [fm.family_id for fm in family_members]
    
    # Check for new shopping items
    new_items = []
    latest_id = since_id
    
    if family_ids:
        items = db.query(ShoppingItem).filter(
            ShoppingItem.family_id.in_(family_ids),
            ShoppingItem.id > since_id,
            ShoppingItem.added_by != user_id  # Only items added by OTHERS
        ).order_by(ShoppingItem.id.desc()).limit(10).all()
        
        for item in items:
            new_items.append({
                "id": item.id,
                "name": item.name,
                "quantity": item.quantity,
                "added_by": item.added_by
            })
            if item.id > latest_id:
                latest_id = item.id
    
    # Check for due reminders
    new_reminders = []
    now = datetime.now()
    
    reminders = db.query(Reminder).filter(
        Reminder.user_id == user_id,
        Reminder.is_due == False,
        Reminder.remind_at <= now
    ).all()
    
    for r in reminders:
        r.is_due = True
        db.commit()
        db.refresh(r)
        new_reminders.append({
            "id": r.id,
            "title": r.title,
            "message": r.message,
            "speak": r.speak_aloud
        })
    
    return NotificationCheckResponse(
        has_new=len(new_items) > 0 or len(new_reminders) > 0,
        new_items=new_items,
        new_reminders=new_reminders,
        latest_id=latest_id
    )


@router.get("/{user_id}/count")
def get_notification_count(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Count due reminders
    count = db.query(Reminder).filter(
        Reminder.user_id == user_id,
        Reminder.is_due == True,
        Reminder.dismissed == False
    ).count()
    
    return {"count": count}


@router.post("/{user_id}/dismiss/{reminder_id}")
def dismiss_reminder(
    user_id: int,
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dismiss a reminder notification"""
    
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    ).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    reminder.dismissed = True
    db.commit()
    
    return {"success": True}