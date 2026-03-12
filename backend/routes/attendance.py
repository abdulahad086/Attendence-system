"""
routes/attendance.py
--------------------
Endpoints for marking attendance and querying/exporting logs.
"""

import csv
import io
from datetime import date as date_type

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from services.face_service import identify_face_in_frame
from services.attendance_service import (
    mark_attendance,
    get_attendance_logs,
    get_daily_report,
)
from utils.helpers import base64_to_frame
from utils.logger import logger
from utils.dependencies import get_org_admin
from database.models import User

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class MarkAttendanceRequest(BaseModel):
    frame_base64: str  # data URI or raw base64 JPEG/PNG


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/mark")
def mark_attendance_from_frame(
    payload: MarkAttendanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin),
):
    """
    Identify faces in the provided base64 frame and mark attendance.

    Returns a list of recognition + attendance results, one per detected face.
    """
    frame = base64_to_frame(payload.frame_base64)
    if frame is None:
        raise HTTPException(status_code=422, detail="Invalid image data.")

    # Identify all faces in the frame, scoped to the organization
    recognitions = identify_face_in_frame(db, frame, current_user.organization_id)
    if not recognitions:
        return {"detected": 0, "results": []}

    results = []
    for rec in recognitions:
        if rec["user_id"] is not None:
            attendance = mark_attendance(db, rec["user_id"], current_user.organization_id, confidence=rec["similarity"])
            if attendance:
                results.append({
                    "user_id": rec["user_id"],
                    "name": rec["name"],
                    "similarity": rec["similarity"],
                    "status": attendance["status"],
                    "timestamp": attendance["timestamp"],
                    "already_marked": False,
                })
            else:
                results.append({
                    "user_id": rec["user_id"],
                    "name": rec["name"],
                    "similarity": rec["similarity"],
                    "status": "already_marked",
                    "already_marked": True,
                })
        else:
            results.append({
                "user_id": None,
                "name": "Unknown",
                "similarity": rec["similarity"],
                "status": "not_recognized",
                "already_marked": False,
            })

    logger.info(f"mark_attendance processed {len(recognitions)} face(s)")
    return {"detected": len(recognitions), "results": results}


@router.get("/logs")
def attendance_logs(
    date: date_type | None = Query(default=None, description="Filter by date YYYY-MM-DD"),
    user_id: int | None = Query(default=None, description="Filter by user ID"),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin),
):
    """Retrieve paginated attendance logs with optional filters."""
    logs = get_attendance_logs(db, current_user.organization_id, date=date, user_id=user_id, limit=limit, offset=offset)
    return {"total": len(logs), "logs": logs}


@router.get("/daily-report")
def daily_report(
    date: date_type = Query(default=None, description="Report date (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin),
):
    """Return aggregated daily attendance statistics."""
    if date is None:
        date = date_type.today()
    report = get_daily_report(db, current_user.organization_id, date)
    return report

@router.get("/trend")
def attendance_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin),
):
    """Return 7-day attendance trend data for the dashboard chart."""
    from services.attendance_service import get_7_day_trend
    trend = get_7_day_trend(db, current_user.organization_id)
    return trend


@router.get("/export")
def export_csv(
    date: date_type = Query(..., description="Date to export YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_org_admin),
):
    """Download attendance logs for a given date as a CSV file."""
    logs = get_attendance_logs(db, current_user.organization_id, date=date, limit=10_000)
    if not logs:
        raise HTTPException(status_code=404, detail="No logs found for this date.")

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["log_id", "user_id", "name", "department", "status", "timestamp", "confidence"],
    )
    writer.writeheader()
    for log in logs:
        writer.writerow({k: log.get(k, "") for k in writer.fieldnames})

    output.seek(0)
    filename = f"attendance_{date}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
