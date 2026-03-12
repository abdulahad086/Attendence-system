from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.connection import get_db
from database.models import Organization, User, AttendanceLog, FaceEmbedding, SystemSettings, Camera
from utils.dependencies import get_current_user, get_super_admin

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])

@router.get("/")
def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin)
):
    """List all organizations with their admin details. Super admin only."""
    orgs = db.query(Organization).all()
    
    result = []
    for org in orgs:
        user_count = db.query(User).filter(
            User.organization_id == org.id,
            User.role.notin_(["org_admin", "super_admin"])
        ).count()
        camera_count = db.query(Camera).filter(Camera.organization_id == org.id).count()
        log_count = db.query(AttendanceLog).filter(AttendanceLog.organization_id == org.id).count()
        
        # Get the primary administrator for this organization
        admin = db.query(User).filter(
            User.organization_id == org.id, 
            User.role == "org_admin"
        ).first()
        
        result.append({
            "id": org.id,
            "name": org.name,
            "created_at": org.created_at,
            "subscription_plan": org.subscription_plan,
            "subscription_status": org.subscription_status,
            "is_active": org.is_active,
            "user_count": user_count,
            "camera_count": camera_count,
            "log_count": log_count,
            "admin": {
                "name": admin.name if admin else "No Admin",
                "email": admin.email if admin else "N/A"
            } if admin else None
        })
    return result

@router.get("/stats")
def platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin)
):
    """Platform-wide statistics for Super Admin dashboard."""
    total_orgs = db.query(Organization).count()
    active_orgs = db.query(Organization).filter(Organization.is_active == True).count()
    total_users = db.query(User).filter(User.role.notin_(["org_admin", "super_admin"])).count()
    total_cameras = db.query(Camera).count()
    total_logs = db.query(AttendanceLog).count()
    
    return {
        "total_organizations": total_orgs,
        "active_organizations": active_orgs,
        "total_employees": total_users,
        "total_cameras": total_cameras,
        "total_attendance_logs": total_logs,
    }

class OrgUpdate(BaseModel):
    is_active: bool | None = None
    subscription_plan: str | None = None
    subscription_status: str | None = None

@router.patch("/{org_id}")
def update_organization(
    org_id: int,
    data: OrgUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin)
):
    """Update organization status or plan. Super admin only."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    if data.is_active is not None:
        org.is_active = data.is_active
    if data.subscription_plan is not None:
        org.subscription_plan = data.subscription_plan
    if data.subscription_status is not None:
        org.subscription_status = data.subscription_status
        
    db.commit()
    return {"message": "Organization updated successfully"}

@router.delete("/{org_id}")
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin)
):
    """Delete an organization and all its data. Super admin only."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # Prevent deleting the current super admin's default organization
    if org_id == current_user.organization_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own organization")

    # The database cascading is set up, but let's be explicit and manual to avoid foreign key constraint issues if not configured cascading
    # Delete face embeddings for users in this org
    users = db.query(User).filter(User.organization_id == org_id).all()
    user_ids = [u.id for u in users]
    if user_ids:
        db.query(FaceEmbedding).filter(FaceEmbedding.user_id.in_(user_ids)).delete(synchronize_session=False)

    # Delete attendance logs
    db.query(AttendanceLog).filter(AttendanceLog.organization_id == org_id).delete(synchronize_session=False)
    
    # Delete users
    db.query(User).filter(User.organization_id == org_id).delete(synchronize_session=False)
    
    # Delete settings
    db.query(SystemSettings).filter(SystemSettings.organization_id == org_id).delete(synchronize_session=False)

    # Delete cameras
    db.query(Camera).filter(Camera.organization_id == org_id).delete(synchronize_session=False)

    # Delete org
    db.delete(org)
    db.commit()
    
    return {"message": "Organization deleted successfully"}

class PasswordReset(BaseModel):
    new_password: str

@router.post("/{org_id}/reset-password")
def reset_organization_password(
    org_id: int,
    data: PasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin)
):
    """Reset the password for the organization admin. Super admin only."""
    from services.auth_service import get_password_hash
    
    # Find the org admin for this organization
    admin = db.query(User).filter(
        User.organization_id == org_id, 
        User.role == "org_admin"
    ).first()
    
    if not admin:
        raise HTTPException(status_code=404, detail="Organization Admin not found")
        
    admin.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": f"Password for {admin.email} has been reset successfully"}
