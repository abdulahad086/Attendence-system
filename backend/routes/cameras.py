from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from database.connection import get_db
from database.models import Camera, Organization, User
from utils.dependencies import get_org_admin

router = APIRouter(prefix="/api/cameras", tags=["Cameras"])

class CameraCreate(BaseModel):
    name: str
    location: str | None = None

class CameraResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    location: str | None
    status: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[CameraResponse])
def get_cameras(db: Session = Depends(get_db), current_user: User = Depends(get_org_admin)):
    """Get all cameras for the current organization."""
    return db.query(Camera).filter(Camera.organization_id == current_user.organization_id).all()

@router.post("/", response_model=CameraResponse)
def create_camera(
    camera_data: CameraCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_org_admin)
):
    """Register a new camera for the organization (org admins only)."""
    if current_user.role not in ["org_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to add cameras.")
        
    camera = Camera(
        organization_id=current_user.organization_id,
        name=camera_data.name,
        location=camera_data.location,
        status="online"
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera

@router.delete("/{camera_id}")
def delete_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin)
):
    """Delete a camera from the organization."""
    if current_user.role not in ["org_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete cameras.")
        
    camera = db.query(Camera).filter(
        Camera.id == camera_id,
        Camera.organization_id == current_user.organization_id
    ).first()
    
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found in this organization.")
        
    db.delete(camera)
    db.commit()
    return {"message": "Camera deleted successfully."}
