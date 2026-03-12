from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import re

from database.connection import get_db
from database.models import SystemSettings, User
from utils.dependencies import get_org_admin

router = APIRouter()

class SettingsUpdate(BaseModel):
    expected_start_time: str

@router.get("/")
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_org_admin)):
    setting = db.query(SystemSettings).filter(SystemSettings.organization_id == current_user.organization_id).first()
    if not setting:
        # Fallback if seeder failed
        return {"expected_start_time": "09:15"}
    return {"expected_start_time": setting.expected_start_time}

@router.put("/")
def update_settings(update: SettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_org_admin)):
    if not re.match(r"^([01][0-9]|2[0-3]):([0-5][0-9])$", update.expected_start_time):
        raise HTTPException(status_code=400, detail="Invalid time format. Expected HH:MM")

    setting = db.query(SystemSettings).filter(SystemSettings.organization_id == current_user.organization_id).first()
    if not setting:
        setting = SystemSettings(organization_id=current_user.organization_id, expected_start_time=update.expected_start_time)
        db.add(setting)
    else:
        setting.expected_start_time = update.expected_start_time

    db.commit()
    return {"message": "Settings updated", "expected_start_time": setting.expected_start_time}
