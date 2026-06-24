"""
dashboard.py
One big endpoint that returns everything the home screen needs.
"""

from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from auth import get_current_user
from models import User, Expense, ShoppingItem, Task, Medicine, Goal

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/{family_id}")
def get_dashboard(
    family_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all data the dashboard needs in one request."""
    today = date.today()

    monthly = db.query(func.sum(Expense.amount)).filter(
        Expense.family_id == family_id,
        extract("month", Expense.date) == today.month,
        extract("year", Expense.date) == today.year,
    ).scalar() or 0

    shopping_count = db.query(ShoppingItem).filter(
        ShoppingItem.family_id == family_id,
        ShoppingItem.is_bought == False,
    ).count()

    task_count = db.query(Task).filter(
        Task.family_id == family_id,
        Task.status == "pending",
    ).count()

    done_count = db.query(Task).filter(
        Task.family_id == family_id,
        Task.status == "done",
    ).count()

    med_count = db.query(Medicine).filter(
        Medicine.family_id == family_id,
        Medicine.is_active == True,
    ).count()

    goals = db.query(Goal).filter(Goal.family_id == family_id).all()
    goal_list = []
    for g in goals:
        pct = round(g.saved_amount / g.target_amount * 100, 1) if g.target_amount > 0 else 0
        goal_list.append({
            "title": g.title,
            "target": g.target_amount,
            "saved": g.saved_amount,
            "progress": pct,
            "icon": g.icon,
        })

    categories = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total"),
    ).filter(
        Expense.family_id == family_id,
        extract("month", Expense.date) == today.month,
        extract("year", Expense.date) == today.year,
    ).group_by(Expense.category).all()

    recent = db.query(Expense).filter(
        Expense.family_id == family_id,
    ).order_by(Expense.created_at.desc()).limit(5).all()

    return {
        "monthly_expenses": round(float(monthly), 2),
        "shopping_items": shopping_count,
        "pending_tasks": task_count,
        "completed_tasks": done_count,
        "active_medicines": med_count,
        "goals": goal_list,
        "categories": [
            {"name": c.category, "total": round(float(c.total), 2)}
            for c in categories
        ],
        "recent_expenses": [
            {"title": e.title, "amount": e.amount, "category": e.category, "date": str(e.date)}
            for e in recent
        ],
    }