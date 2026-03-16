"""
main.py
-------
FastAPI application entry-point.

Responsibilities:
  • Mount all API routers
  • Create DB tables on startup
  • Configure CORS
  • WebSocket endpoint for real-time camera frame processing
"""

import asyncio
import base64
import json
import os

import cv2
import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError

from config import settings
from database.connection import create_tables, SessionLocal
from routes.users import router as users_router
from routes.attendance import router as attendance_router
from routes.settings import router as settings_router
from routes.auth import router as auth_router
from routes.organizations import router as orgs_router
from routes.cameras import router as cameras_router
from routes.billing import router as billing_router
from routes.debug import router as debug_router
from services.face_service import identify_face_in_frame
from services.attendance_service import mark_attendance
from face_recognition.detector import draw_detections
from utils.helpers import base64_to_frame, frame_to_base64
from utils.logger import logger
from services.auth_service import ALGORITHM


# ── App lifespan ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks (DB init, model warm-up)."""
    logger.info("Starting AI Attendance System …")
    os.makedirs("logs", exist_ok=True)
    os.makedirs(settings.FACE_IMAGES_DIR, exist_ok=True)
    create_tables()
    logger.info("Database tables ready.")
    yield
    logger.info("Shutting down …")


# ── Application ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Face Recognition Attendance System",
    description=(
        "Production-ready attendance system using DeepFace ArcFace embeddings, "
        "OpenCV detection, and PostgreSQL storage."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(orgs_router)
app.include_router(cameras_router)
app.include_router(users_router)
app.include_router(attendance_router)
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])
app.include_router(billing_router)
app.include_router(debug_router, prefix="/api")
app.include_router(__import__("routes.debug").debug.router)


@app.get("/")
def read_root():
    return {"message": "AttendAI Backend is Running!", "docs": "/docs", "health": "/health"}


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "model": settings.DEEPFACE_MODEL}


# ── WebSocket: Real-time camera stream ───────────────────────────────────────

@app.websocket("/ws/camera")
async def camera_ws(websocket: WebSocket, token: str = Query(None)):
    """
    WebSocket endpoint for live camera feed processing.
    Expects a JWT token in the query string: ?token=...

    Protocol (JSON messages):
      Client → Server: {"frame": "<base64-image>"}
      Server → Client: {
          "detected": <int>,
          "results": [{"name", "user_id", "similarity", "status", "bbox"}, …],
          "annotated_frame": "<base64-jpeg>"   ← frame with drawn boxes
      }
    """
    await websocket.accept()

    if not token:
        await websocket.send_json({"error": "Authentication token missing"})
        await websocket.close()
        return

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        organization_id = payload.get("org_id")
        if organization_id is None:
            raise JWTError()
    except JWTError:
        await websocket.send_json({"error": "Invalid token"})
        await websocket.close()
        return

    logger.info(f"WebSocket camera connection opened for org_id={organization_id}")

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
                continue

            b64_frame = msg.get("frame")
            if not b64_frame:
                await websocket.send_json({"error": "Missing 'frame' key"})
                continue

            frame = base64_to_frame(b64_frame)
            if frame is None:
                await websocket.send_json({"error": "Could not decode frame"})
                continue

            # Run in a thread-pool so the event loop isn't blocked
            db = SessionLocal()
            try:
                recognitions = await asyncio.to_thread(
                    identify_face_in_frame, db, frame, organization_id
                )

                results = []
                for rec in recognitions:
                    attendance_result = None
                    if rec["user_id"] is not None:
                        attendance_result = await asyncio.to_thread(
                            mark_attendance, db, rec["user_id"], organization_id, rec["similarity"]
                        )

                    results.append({
                        "user_id": int(rec["user_id"]) if rec["user_id"] is not None else None,
                        "name": rec["name"],
                        "similarity": float(rec["similarity"]) if rec["similarity"] is not None else None,
                        "bbox": [int(v) for v in rec["bbox"]],
                        "confidence": float(rec.get("confidence", 1.0)),
                        "status": (
                            attendance_result["status"]
                            if attendance_result
                            else ("already_marked" if rec["user_id"] else "unknown")
                        ),
                    })

                # Annotate frame with boxes and names
                annotated = draw_detections(frame, [
                    {**r, "name": f"{r['name']} ({r['similarity']:.0%})" if r['similarity'] else r['name']}
                    for r in results
                ])
                annotated_b64 = frame_to_base64(annotated)

                await websocket.send_json({
                    "detected": len(recognitions),
                    "results": results,
                    "annotated_frame": annotated_b64,
                })

            finally:
                db.close()

    except WebSocketDisconnect:
        logger.info("WebSocket camera connection closed")
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")
        await websocket.close()
