from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database.connection import get_db
from database.models import User, Organization, SystemSettings
from services.auth_service import verify_password, get_password_hash, create_access_token
from config import settings

router = APIRouter()

class OrgRegistration(BaseModel):
    organization_name: str
    admin_name: str
    admin_email: EmailStr
    admin_password: str

@router.post("/register-org")
def register_organization(data: OrgRegistration, db: Session = Depends(get_db)):
    # Check if org exists
    if db.query(Organization).filter(Organization.name == data.organization_name).first():
        raise HTTPException(status_code=400, detail="Organization already exists")
    
    # Check if user exists
    if db.query(User).filter(User.email == data.admin_email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create Organization
    org = Organization(name=data.organization_name)
    db.add(org)
    db.commit()
    db.refresh(org)

    # Create Default Settings
    sys_settings = SystemSettings(organization_id=org.id, expected_start_time=settings.EXPECTED_START_TIME)
    db.add(sys_settings)

    # Create Admin User
    admin = User(
        organization_id=org.id,
        name=data.admin_name,
        email=data.admin_email,
        hashed_password=get_password_hash(data.admin_password),
        role="org_admin"
    )
    db.add(admin)
    db.commit()

    return {"message": "Organization and Admin account created successfully."}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2 uses "username" field, we map it to "email"
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(subject=user.id, organization_id=user.organization_id)
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "organization_id": user.organization_id
        }
    }
