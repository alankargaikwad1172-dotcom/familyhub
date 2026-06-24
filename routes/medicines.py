"""
medicines.py
Track medicine schedules for family members.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_user
from models import User, Medicine

router = APIRouter(tags=["Medicines"])


class MedicineCreateInput(BaseModel):
    family_id: int
    person_name: str
    medicine_name: str
    dosage: Optional[str] = None
    frequency: str = "daily"
    time: Optional[str] = None


@router.get("/medicines/{family_id}")
def get_medicines(
    family_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all active medicines for a family."""
    meds = db.query(Medicine).filter(
        Medicine.family_id == family_id,
        Medicine.is_active == True,
    ).all()
    return [
        {
            "id": m.id,
            "person_name": m.person_name,
            "medicine_name": m.medicine_name,
            "dosage": m.dosage,
            "frequency": m.frequency,
            "time": m.time,
        }
        for m in meds
    ]


@router.post("/medicines")
def add_medicine(
    data: MedicineCreateInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new medicine to track."""
    med = Medicine(
        family_id=data.family_id,
        person_name=data.person_name,
        medicine_name=data.medicine_name,
        dosage=data.dosage,
        frequency=data.frequency,
        time=data.time,
    )
    db.add(med)
    db.commit()
    return {"id": med.id, "medicine_name": med.medicine_name}


@router.delete("/medicines/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a medicine from tracking."""
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(404, "Medicine not found")
    db.delete(med)
    db.commit()
    return {"message": "Deleted"}