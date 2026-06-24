"""
shopping.py
Shared family shopping list.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_user
from models import User, ShoppingList, ShoppingItem

router = APIRouter(tags=["Shopping"])


class ShoppingItemInput(BaseModel):
    family_id: int
    name: str
    quantity: str = "1"
    category: str = "General"


class ShoppingItemUpdate(BaseModel):
    is_bought: Optional[bool] = None
    name: Optional[str] = None
    quantity: Optional[str] = None


@router.get("/shopping/{family_id}")
def get_shopping_items(
    family_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all items on the family shopping list."""
    items = db.query(ShoppingItem).filter(
        ShoppingItem.family_id == family_id,
    ).order_by(
        ShoppingItem.is_bought.asc(),
        ShoppingItem.created_at.desc(),
    ).all()
    return [
        {
            "id": i.id,
            "name": i.name,
            "quantity": i.quantity,
            "category": i.category,
            "is_bought": i.is_bought,
        }
        for i in items
    ]


@router.post("/shopping")
def add_shopping_item(
    data: ShoppingItemInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add an item to the shopping list."""
    shopping_list = db.query(ShoppingList).filter(
        ShoppingList.family_id == data.family_id,
    ).first()
    if not shopping_list:
        shopping_list = ShoppingList(family_id=data.family_id, name="Family Shopping")
        db.add(shopping_list)
        db.flush()
    item = ShoppingItem(
        list_id=shopping_list.id,
        family_id=data.family_id,
        name=data.name,
        quantity=data.quantity,
        category=data.category,
        added_by=user.id,
    )
    db.add(item)
    db.commit()
    return {"id": item.id, "name": item.name, "quantity": item.quantity}


@router.put("/shopping/{item_id}")
def update_shopping_item(
    item_id: int,
    data: ShoppingItemUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark an item as bought or unbought, or edit it."""
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    if data.is_bought is not None:
        item.is_bought = data.is_bought
    if data.name is not None:
        item.name = data.name
    if data.quantity is not None:
        item.quantity = data.quantity
    db.commit()
    return {"message": "Updated"}


@router.delete("/shopping/{item_id}")
def delete_shopping_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove an item from the shopping list."""
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}