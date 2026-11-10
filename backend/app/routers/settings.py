from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SystemSetting
from app.schemas import SystemSettingOut, SystemSettingUpdate

router = APIRouter(prefix="/settings", tags=["System Settings & Policy"])

@router.get("", response_model=List[SystemSettingOut])
def get_all_settings(db: Session = Depends(get_db)):
    return db.query(SystemSetting).all()

@router.put("/{key}", response_model=SystemSettingOut)
def update_setting(
    key: str,
    payload: SystemSettingUpdate,
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value=payload.value)
        db.add(setting)
    else:
        setting.value = payload.value

    db.commit()
    db.refresh(setting)
    return setting
