"""
tasks.py
Family to-do list with priorities and assignments.
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_user
from models import User, Task

router = APIRouter(tags=["Tasks"])


class TaskCreateInput(BaseModel):
    family_id: int
    title: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    priority: str = "medium"
    due_date: Optional[str] = None


class TaskUpdateInput(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None


@router.get("/tasks/{family_id}")
def get_tasks(
    family_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all tasks for a family."""
    tasks = db.query(Task).filter(
        Task.family_id == family_id,
    ).order_by(Task.created_at.desc()).all()
    result = []
    for t in tasks:
        result.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "status": t.status,
            "due_date": str(t.due_date) if t.due_date else None,
            "assigned_to": t.assignee.full_name if t.assignee else None,
        })
    return result


@router.post("/tasks")
def create_task(
    data: TaskCreateInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new task."""
    task = Task(
        family_id=data.family_id,
        title=data.title,
        description=data.description,
        assigned_to=data.assigned_to,
        priority=data.priority,
        due_date=date.fromisoformat(data.due_date) if data.due_date else None,
        created_by=user.id,
    )
    db.add(task)
    db.commit()
    return {"id": task.id, "title": task.title, "status": task.status}


@router.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    data: TaskUpdateInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a task (mark done, change priority, etc)."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    if data.status:
        task.status = data.status
    if data.priority:
        task.priority = data.priority
    if data.assigned_to is not None:
        task.assigned_to = data.assigned_to
    db.commit()
    return {"message": "Updated"}


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Deleted"}