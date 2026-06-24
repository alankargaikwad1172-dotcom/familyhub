"""
images.py
Handle photo uploads from camera or gallery.
Saves images to static/uploads/ folder.
"""

import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import User, ShoppingImage, ShoppingList, FamilyMember

router = APIRouter(tags=["Images"])

UPLOAD_DIR = os.path.join("static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/images/shopping/{family_id}")
async def upload_shopping_image(
    family_id: int,
    file: UploadFile = File(...),
    caption: str = "",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a photo for the shopping list (from camera or gallery)."""

    # Check user is in this family
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == user.id,
    ).first()
    if not member:
        raise HTTPException(403, "Not a member of this family")

    # Check file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, and WebP images are allowed")

    # Read file
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, "Image too large. Max 10MB.")

    # Save file with unique name
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        ext = "jpg"
    filename = str(uuid.uuid4()) + "." + ext
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    # Get or create shopping list
    shopping_list = db.query(ShoppingList).filter(
        ShoppingList.family_id == family_id,
    ).first()
    if not shopping_list:
        shopping_list = ShoppingList(family_id=family_id, name="Family Shopping")
        db.add(shopping_list)
        db.flush()

    # Save to database
    image = ShoppingImage(
        family_id=family_id,
        list_id=shopping_list.id,
        filename=filename,
        url="/static/uploads/" + filename,
        caption=caption or file.filename,
        uploaded_by=user.id,
    )
    db.add(image)
    db.commit()
    db.refresh(image)

    return {
        "id": image.id,
        "url": image.url,
        "caption": image.caption,
        "uploaded_by": user.full_name,
        "created_at": str(image.created_at),
    }


@router.get("/images/shopping/{family_id}")
def get_shopping_images(
    family_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all photos for the family shopping list."""
    images = db.query(ShoppingImage).filter(
        ShoppingImage.family_id == family_id,
    ).order_by(ShoppingImage.created_at.desc()).all()

    return [
        {
            "id": img.id,
            "url": img.url,
            "caption": img.caption,
            "uploaded_by": img.uploader.full_name if img.uploader else "Unknown",
            "created_at": str(img.created_at),
        }
        for img in images
    ]


@router.delete("/images/{image_id}")
def delete_image(
    image_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a photo."""
    image = db.query(ShoppingImage).filter(ShoppingImage.id == image_id).first()
    if not image:
        raise HTTPException(404, "Image not found")
    if image.uploaded_by != user.id:
        raise HTTPException(403, "You can only delete your own photos")

    # Delete file from disk
    filepath = os.path.join("static", "uploads", image.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(image)
    db.commit()
    return {"message": "Deleted"}