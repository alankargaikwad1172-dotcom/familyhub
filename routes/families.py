"""
families.py
Create families, join families, see members.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, generate_invite_code
from models import User, Family, FamilyMember

router = APIRouter(tags=["Families"])


class FamilyCreateInput(BaseModel):
    name: str


class FamilyJoinInput(BaseModel):
    invite_code: str


@router.post("/families")
def create_family(
    data: FamilyCreateInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new family. Creator becomes admin."""
    family = Family(
        name=data.name,
        invite_code=generate_invite_code(),
        created_by=user.id,
    )
    db.add(family)
    db.flush()
    member = FamilyMember(
        family_id=family.id,
        user_id=user.id,
        role="admin",
        nickname=user.full_name,
    )
    db.add(member)
    db.commit()
    return {"id": family.id, "name": family.name, "invite_code": family.invite_code}


@router.post("/families/join")
def join_family(
    data: FamilyJoinInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Join an existing family using an invite code."""
    family = db.query(Family).filter(Family.invite_code == data.invite_code).first()
    if not family:
        raise HTTPException(404, "Family not found. Check the invite code.")
    existing = db.query(FamilyMember).filter(
        FamilyMember.family_id == family.id,
        FamilyMember.user_id == user.id,
    ).first()
    if existing:
        raise HTTPException(400, "You are already in this family.")
    member = FamilyMember(
        family_id=family.id,
        user_id=user.id,
        role="member",
        nickname=user.full_name,
    )
    db.add(member)
    db.commit()
    return {"message": "Welcome to " + family.name + "!", "family_id": family.id}


@router.get("/families")
def get_my_families(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all families the current user belongs to."""
    memberships = db.query(FamilyMember).filter(
        FamilyMember.user_id == user.id
    ).all()
    results = []
    for m in memberships:
        family = db.query(Family).filter(Family.id == m.family_id).first()
        if family:
            count = db.query(FamilyMember).filter(
                FamilyMember.family_id == family.id
            ).count()
            results.append({
                "id": family.id,
                "name": family.name,
                "invite_code": family.invite_code,
                "role": m.role,
                "member_count": count,
            })
    return results


@router.get("/families/{family_id}/members")
def get_members(
    family_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all members of a family."""
    membership = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == user.id,
    ).first()
    if not membership:
        raise HTTPException(403, "You are not in this family")
    members = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id
    ).all()
    result = []
    for m in members:
        result.append({
            "user_id": m.user_id,
            "name": m.nickname or m.user.full_name,
            "email": m.user.email,
            "role": m.role,
            "color": m.user.avatar_color,
        })
    return result