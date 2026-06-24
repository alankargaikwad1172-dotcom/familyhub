"""
expenses.py
Add, list, delete, and summarize family expenses.
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from database import get_db
from auth import get_current_user
from models import User, FamilyMember, Expense

router = APIRouter(tags=["Expenses"])


class ExpenseCreateInput(BaseModel):
    family_id: int
    title: str
    amount: float
    category: str = "Other"
    note: Optional[str] = None
    expense_date: Optional[str] = None


@router.post("/expenses")
def add_expense(
    data: ExpenseCreateInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new expense to the family."""
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == data.family_id,
        FamilyMember.user_id == user.id,
    ).first()
    if not member:
        raise HTTPException(403, "Not a member of this family")
    expense = Expense(
        family_id=data.family_id,
        user_id=user.id,
        title=data.title,
        amount=data.amount,
        category=data.category,
        note=data.note,
        date=date.fromisoformat(data.expense_date) if data.expense_date else date.today(),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {
        "id": expense.id,
        "title": expense.title,
        "amount": expense.amount,
        "category": expense.category,
        "date": str(expense.date),
    }


@router.get("/expenses/{family_id}")
def list_expenses(
    family_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all expenses for a family this month."""
    today = date.today()
    month = month or today.month
    year = year or today.year
    expenses = db.query(Expense).filter(
        Expense.family_id == family_id,
        extract("month", Expense.date) == month,
        extract("year", Expense.date) == year,
    ).order_by(Expense.date.desc()).all()
    result = []
    for e in expenses:
        result.append({
            "id": e.id,
            "title": e.title,
            "amount": e.amount,
            "category": e.category,
            "note": e.note,
            "date": str(e.date),
            "added_by": e.user.full_name if e.user else "Unknown",
        })
    return result


@router.get("/expenses/{family_id}/summary")
def expense_summary(
    family_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get expense totals and category breakdown."""
    today = date.today()
    month = month or today.month
    year = year or today.year
    total = db.query(func.sum(Expense.amount)).filter(
        Expense.family_id == family_id,
        extract("month", Expense.date) == month,
        extract("year", Expense.date) == year,
    ).scalar() or 0
    categories = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count"),
    ).filter(
        Expense.family_id == family_id,
        extract("month", Expense.date) == month,
        extract("year", Expense.date) == year,
    ).group_by(Expense.category).all()
    return {
        "total": round(float(total), 2),
        "month": month,
        "year": year,
        "categories": [
            {"name": c.category, "total": round(float(c.total), 2), "count": c.count}
            for c in categories
        ],
    }


@router.delete("/expenses/delete/{expense_id}")
def delete_expense(
    expense_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an expense. Only the person who added it can delete it."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(404, "Expense not found")
    if expense.user_id != user.id:
        raise HTTPException(403, "You can only delete your own expenses")
    db.delete(expense)
    db.commit()
    return {"message": "Deleted"}