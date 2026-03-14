"""
routes/users.py
---------------
REST API routes for user management (CRUD) and face registration.
"""

import io
import os
from typing import Optional

import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, FaceEmbedding
from services.face_service import register_user_embeddings
from utils.logger import logger
from utils.dependencies import get_org_admin

router = APIRouter(prefix="/api/users", tags=["Users"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    department: Optional[str]
    role: str
    is_active: bool
    embedding_count: int

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def _upload_to_cv2(upload: UploadFile) -> np.ndarray | None:
    """Convert an UploadFile to an OpenCV BGR image."""
    try:
        data = upload.file.read()
        arr = np.frombuffer(data, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except Exception as exc:
        logger.error(f"Failed to decode upload {upload.filename}: {exc}")
        return None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    name: str = Form(..., description="Full name"),
    department: str = Form(default="General", description="Department or class"),
    email: str = Form(default=None, description="Email address (optional)"),
    role: str = Form(default="employee", description="employee | student | admin"),
    images: list[UploadFile] = File(..., description="1-10 face images"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin),
):
    """
    Register a new user and store their face embeddings.

    - Accepts 1-10 face images (JPEG/PNG).
    - Creates the User row, then generates + stores embeddings.
    """
    if not 1 <= len(images) <= 10:
        raise HTTPException(
            status_code=422,
            detail="Provide between 1 and 10 face images.",
        )

    # Check email uniqueness if provided
    if email:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered.")

    # Create user row scoped to the organization
    user = User(
        name=name,
        email=email,
        department=department,
        role=role,
        organization_id=current_user.organization_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"Created user: id={user.id} name={name}")

    # Convert uploads to numpy arrays
    cv2_images = [_upload_to_cv2(img) for img in images]
    cv2_images = [img for img in cv2_images if img is not None]

    if not cv2_images:
        db.delete(user)
        db.commit()
        raise HTTPException(status_code=422, detail="No valid images could be decoded.")

    # Generate and store embeddings
    stored = register_user_embeddings(db, user.id, cv2_images)

    if stored == 0:
        db.delete(user)
        db.commit()
        raise HTTPException(
            status_code=422,
            detail="No faces detected in the provided images. Please try again with clearer photos."
        )

    return {
        "user_id": user.id,
        "name": user.name,
        "department": user.department,
        "embeddings_stored": stored,
        "message": f"User {name!r} registered successfully.",
    }


@router.get("", response_model=list[UserOut])
def list_users(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin),
):
    """List all registered users scoped to the organization."""
    q = db.query(User).filter(
        User.organization_id == current_user.organization_id,
        User.role.notin_(["org_admin", "super_admin"])
    )
    if active_only:
        q = q.filter(User.is_active == True)  # noqa: E712
    users = q.order_by(User.created_at.desc()).all()

    result = []
    for u in users:
        count = db.query(FaceEmbedding).filter(FaceEmbedding.user_id == u.id).count()
        result.append(UserOut(
            id=u.id,
            name=u.name,
            email=u.email,
            department=u.department,
            role=u.role,
            is_active=u.is_active,
            embedding_count=count,
        ))
    return result


@router.get("/{user_id}")
def get_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin)
):
    """Get details of a single user."""
    user = db.query(User).filter(
        User.id == user_id, 
        User.organization_id == current_user.organization_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    count = db.query(FaceEmbedding).filter(FaceEmbedding.user_id == user_id).count()
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "department": user.department,
        "role": user.role,
        "is_active": user.is_active,
        "embedding_count": count,
        "created_at": user.created_at.isoformat(),
    }


@router.delete("/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin)
):
    """Soft-delete a user (sets is_active=False)."""
    user = db.query(User).filter(
        User.id == user_id, 
        User.organization_id == current_user.organization_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = False
    db.commit()
    logger.info(f"Soft-deleted user id={user_id}")
    return JSONResponse(status_code=200, content={"message": "User removed successfully."})


@router.post("/{user_id}/add-images")
async def add_face_images(
    user_id: int,
    images: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin)
):
    """Add more face images to an existing user to improve accuracy."""
    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    cv2_images = [_upload_to_cv2(img) for img in images]
    cv2_images = [img for img in cv2_images if img is not None]
    stored = register_user_embeddings(db, user_id, cv2_images)

    return {"user_id": user_id, "new_embeddings_stored": stored}
