"""
auth_routes.py
Handles registration, login, and getting user info.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from auth import hash_password, check_password, create_token, get_current_user
from models import User

router = APIRouter(tags=["Auth"])


class RegisterInput(BaseModel):
    full_name: str
    email: str
    password: str


class LoginInput(BaseModel):
    email: str
    password: str


@router.post("/auth/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    """Create a new account."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    return {
        "access_token": token,
        "user": {"id": user.id, "full_name": user.full_name, "email": user.email},
    }


@router.post("/auth/login")
def login(data: LoginInput, db: Session = Depends(get_db)):
    """Sign in with email and password."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not check_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(user.id)
    return {"access_token": token}


@router.get("/auth/me")
def get_my_info(user: User = Depends(get_current_user)):
    """Get the currently logged in user's info."""
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "avatar_color": user.avatar_color,
    }