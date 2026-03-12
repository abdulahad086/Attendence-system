"""
services/attendance_service.py
-------------------------------
Business logic for marking and querying attendance.
Enforces the duplicate-entry cooldown window.
"""

from datetime import datetime, timedelta, date as date_type
from sqlalchemy.orm import Session
from sqlalchemy import func

from config import settings
from database.models import AttendanceLog, User, SystemSettings
from utils.logger import logger


def _determine_status(db: Session, organization_id: int, ts: datetime) -> str:
    """
    Classify attendance status based on time-of-day.
    Thresholds defined dynamically by the SystemSettings table.
    """
    system_setting = db.query(SystemSettings).filter(SystemSettings.organization_id == organization_id).first()
    expected_start_time = system_setting.expected_start_time if system_setting else "09:15"

    try:
        expected_hour, expected_minute = map(int, expected_start_time.split(":"))
    except ValueError:
        expected_hour, expected_minute = 9, 15

    if ts.hour < expected_hour or (ts.hour == expected_hour and ts.minute <= expected_minute):
        return "present"
    return "late"


def mark_attendance(
    db: Session,
    user_id: int,
    organization_id: int,
    confidence: float | None = None,
) -> dict | None:
    """
    Mark attendance for `user_id` if not already marked within the cooldown window.

    Returns the created AttendanceLog as a dict, or None if within cooldown.
    """
    now = datetime.now()

    # Check for existing entry today (allow only one mark per day)
    recent = (
        db.query(AttendanceLog)
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.organization_id == organization_id,
            AttendanceLog.date == now.date(),
        )
        .first()
    )
    if recent:
        logger.info(
            f"Attendance already marked for user_id={user_id} today."
        )
        return None

    status = _determine_status(db, organization_id, now)
    log = AttendanceLog(
        user_id=user_id,
        organization_id=organization_id,
        timestamp=now,
        date=now.date(),
        status=status,
        confidence=confidence,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    user = db.query(User).filter(User.id == user_id, User.organization_id == organization_id).first()
    logger.info(
        f"Attendance marked: user={user.name if user else user_id} "
        f"status={status} ts={now.isoformat()}"
    )

    return {
        "log_id": log.id,
        "user_id": user_id,
        "name": user.name if user else None,
        "department": user.department if user else None,
        "status": status,
        "timestamp": now.isoformat(),
        "date": now.date().isoformat(),
    }


def get_attendance_logs(
    db: Session,
    organization_id: int,
    date: date_type | None = None,
    user_id: int | None = None,
    limit: int = 200,
    offset: int = 0,
) -> list[dict]:
    """Retrieve attendance logs with optional filters."""
    q = db.query(AttendanceLog, User).join(User, User.id == AttendanceLog.user_id)
    q = q.filter(AttendanceLog.organization_id == organization_id)
    if date:
        q = q.filter(AttendanceLog.date == date)
    if user_id:
        q = q.filter(AttendanceLog.user_id == user_id)
    q = q.order_by(AttendanceLog.timestamp.desc()).offset(offset).limit(limit)

    return [
        {
            "log_id": log.id,
            "user_id": user.id,
            "name": user.name,
            "department": user.department,
            "status": log.status,
            "confidence": log.confidence,
            "timestamp": log.timestamp.isoformat(),
            "date": log.date.isoformat(),
        }
        for log, user in q.all()
    ]


def get_daily_report(db: Session, organization_id: int, report_date: date_type) -> dict:
    """
    Aggregate daily attendance statistics scoped to the organization.
    Counts total registered users vs. those who attended on the given date.
    """
    total_users = db.query(func.count(User.id)).filter(
        User.is_active == True,  # noqa: E712
        User.organization_id == organization_id,
        User.role.notin_(["org_admin", "super_admin"])
    ).scalar()

    attended_query = (
        db.query(AttendanceLog.status, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.date == report_date,
            AttendanceLog.organization_id == organization_id
        )
        .group_by(AttendanceLog.status)
        .all()
    )

    status_counts = {"present": 0, "late": 0}
    for status, count in attended_query:
        status_counts[status] = count

    total_attended = sum(status_counts.values())
    absent = max(0, total_users - total_attended)

    # Logs for the day
    logs = get_attendance_logs(db, organization_id, date=report_date, limit=500)

    return {
        "date": report_date.isoformat(),
        "total_registered": total_users,
        "total_present": status_counts["present"],
        "total_late": status_counts["late"],
        "total_absent": absent,
        "attendance_rate": round((total_attended / total_users * 100) if total_users else 0, 1),
        "logs": logs,
    }


def get_7_day_trend(db: Session, organization_id: int) -> list[dict]:
    """
    Fetch the attendance counts (present, late) for the last 7 days.
    """
    trend_data = []
    today = datetime.now().date()
    
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        
        # Get counts for this day
        counts = (
            db.query(AttendanceLog.status, func.count(AttendanceLog.id))
            .filter(
                AttendanceLog.date == target_date,
                AttendanceLog.organization_id == organization_id
            )
            .group_by(AttendanceLog.status)
            .all()
        )
        
        present_count = 0
        late_count = 0
        for status, count in counts:
            if status == "present":
                present_count = count
            elif status == "late":
                late_count = count
                
        trend_data.append({
            "day": target_date.strftime("%a"), # e.g. "Mon"
            "date": target_date.isoformat(),
            "present": present_count,
            "late": late_count
        })
        
    return trend_data
