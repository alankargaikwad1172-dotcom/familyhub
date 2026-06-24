"""
auth.py
Security system. Works with Python 3.14.
"""

import secrets
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User

import jwt

SECRET_KEY = "familyhub-super-secret-key-change-in-production"
ALGORITHM = "HS256"
TOKEN_HOURS = 72
security = HTTPBearer()


def hash_password(password):
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def check_password(plain_password, hashed_password):
    import bcrypt
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_token(user_id):
    expire = datetime.utcnow() + timedelta(hours=TOKEN_HOURS)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user_id = decode_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def generate_invite_code():
    return secrets.token_urlsafe(6).upper()[:8]


DEFAULT_CATEGORIES = [
    {"name": "Food & Dining", "icon": "food", "color": "#FF6B6B"},
    {"name": "Groceries", "icon": "cart", "color": "#4ECDC4"},
    {"name": "Transport", "icon": "car", "color": "#45B7D1"},
    {"name": "Utilities", "icon": "bolt", "color": "#96CEB4"},
    {"name": "Healthcare", "icon": "hospital", "color": "#FF8A5C"},
    {"name": "Education", "icon": "school", "color": "#A78BFA"},
    {"name": "Shopping", "icon": "bag", "color": "#34D399"},
    {"name": "Entertainment", "icon": "movie", "color": "#F472B6"},
    {"name": "Rent", "icon": "home", "color": "#FBBF24"},
    {"name": "Other", "icon": "box", "color": "#9CA3AF"},
]