"""
models.py
All data tables.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, Date,
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar_color = Column(String(7), default="#6366F1")
    created_at = Column(DateTime, default=datetime.utcnow)
    memberships = relationship("FamilyMember", back_populates="user")


class Family(Base):
    __tablename__ = "families"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    invite_code = Column(String(10), unique=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    members = relationship("FamilyMember", back_populates="family")


class FamilyMember(Base):
    __tablename__ = "family_members"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="member")
    nickname = Column(String(50))
    joined_at = Column(DateTime, default=datetime.utcnow)
    family = relationship("Family", back_populates="members")
    user = relationship("User", back_populates="memberships")


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    icon = Column(String(30), default="")
    color = Column(String(7), default="#6366F1")


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(50), default="Other")
    note = Column(Text)
    date = Column(Date, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")


class ShoppingList(Base):
    __tablename__ = "shopping_lists"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    name = Column(String(100), default="Shopping List")
    created_at = Column(DateTime, default=datetime.utcnow)
    items = relationship("ShoppingItem", back_populates="list")
    images = relationship("ShoppingImage", back_populates="list")


class ShoppingItem(Base):
    __tablename__ = "shopping_items"
    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("shopping_lists.id"), nullable=False)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    name = Column(String(200), nullable=False)
    quantity = Column(String(50), default="1")
    category = Column(String(50), default="General")
    is_bought = Column(Boolean, default=False)
    added_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    list = relationship("ShoppingList", back_populates="items")


class ShoppingImage(Base):
    __tablename__ = "shopping_images"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    list_id = Column(Integer, ForeignKey("shopping_lists.id"))
    filename = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    caption = Column(String(300), default="")
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    list = relationship("ShoppingList", back_populates="images")
    uploader = relationship("User")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    priority = Column(String(10), default="medium")
    status = Column(String(20), default="pending")
    due_date = Column(Date)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    assignee = relationship("User", foreign_keys=[assigned_to])


class Medicine(Base):
    __tablename__ = "medicines"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    person_name = Column(String(100), nullable=False)
    medicine_name = Column(String(200), nullable=False)
    dosage = Column(String(100))
    frequency = Column(String(50))
    time = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    title = Column(String(200), nullable=False)
    target_amount = Column(Float, nullable=False)
    saved_amount = Column(Float, default=0)
    icon = Column(String(20), default="target")
    created_at = Column(DateTime, default=datetime.utcnow)


class Reminder(Base):
    """Reminders for grocery shopping or anything else."""
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(String(500), default="Time for grocery shopping!")
    remind_at = Column(DateTime, nullable=False)
    repeat_type = Column(String(20), default="none")
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    creator = relationship("User", foreign_keys=[user_id])