"""
goals.py
Family savings goals with progress tracking.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import User, Goal

router = APIRouter(tags=["Goals"])


class GoalCreateInput(BaseModel):
    family_id: int
    title: str
    target_amount: float
    icon: str = "target"


class GoalContributeInput(BaseModel):
    amount: float


@router.get("/goals/{family_id}")
def get_goals(
    family_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all goals for a family."""
    goals = db.query(Goal).filter(Goal.family_id == family_id).all()
    return [
        {
            "id": g.id,
            "title": g.title,
            "target_amount": g.target_amount,
            "saved_amount": g.saved_amount,
            "progress": round(g.saved_amount / g.target_amount * 100, 1)
            if g.target_amount > 0 else 0,
            "icon": g.icon,
        }
        for g in goals
    ]


@router.post("/goals")
def create_goal(
    data: GoalCreateInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new savings goal."""
    goal = Goal(
        family_id=data.family_id,
        title=data.title,
        target_amount=data.target_amount,
        icon=data.icon,
    )
    db.add(goal)
    db.commit()
    return {"id": goal.id, "title": goal.title}


@router.put("/goals/{goal_id}/contribute")
def contribute_to_goal(
    goal_id: int,
    data: GoalContributeInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add money toward a goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(404, "Goal not found")
    goal.saved_amount += data.amount
    db.commit()
    return {
        "saved_amount": goal.saved_amount,
        "progress": round(goal.saved_amount / goal.target_amount * 100, 1),
    }


@router.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(404, "Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Deleted"}