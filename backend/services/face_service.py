"""
services/face_service.py
------------------------
High-level orchestration between the face detection / embedding pipeline
and the database. Consumed by the API routes.
"""

import os
import uuid
from datetime import datetime

import cv2
import numpy as np
from sqlalchemy.orm import Session

from config import settings
from database.models import User, FaceEmbedding
from face_recognition.detector import detect_faces
from face_recognition.embedder import generate_embedding, find_best_match
from utils.logger import logger
from utils.helpers import save_face_image


# ── Registration ──────────────────────────────────────────────────────────────

def register_user_embeddings(
    db: Session,
    user_id: int,
    images: list[np.ndarray],
) -> int:
    """
    Generate embeddings for each provided image and persist them.

    Parameters
    ----------
    db       : SQLAlchemy session
    user_id  : ID of the already-created User row
    images   : list of BGR numpy arrays (cropped or full frames)

    Returns
    -------
    int : number of embeddings successfully stored
    """
    stored = 0
    for idx, img in enumerate(images):
        if img is None:
            continue

        # Detect the largest face in the image
        detections = detect_faces(img)
        if not detections:
            logger.warning(f"No face found in registration image {idx}")
            continue

        # Use the detection with the highest confidence
        best = max(detections, key=lambda d: d["confidence"])
        face_crop = best["face"]

        # Generate embedding
        embedding = generate_embedding(face_crop)
        if embedding is None:
            logger.warning(f"Could not embed registration image {idx}")
            continue

        # Save face image to disk
        img_filename = f"{user_id}_{uuid.uuid4().hex}.jpg"
        img_path = os.path.join(settings.FACE_IMAGES_DIR, img_filename)
        save_face_image(face_crop, img_path)

        # Persist to DB
        fe = FaceEmbedding(user_id=user_id, image_path=img_path)
        fe.set_embedding(embedding)
        db.add(fe)
        stored += 1

    db.commit()
    logger.info(f"Stored {stored} embeddings for user_id={user_id}")
    return stored


# ── Recognition ───────────────────────────────────────────────────────────────

def _load_all_embeddings(db: Session, organization_id: int) -> list[dict]:
    """Load all stored face embeddings with user info for the given organization."""
    rows = (
        db.query(FaceEmbedding, User)
        .join(User, User.id == FaceEmbedding.user_id)
        .filter(User.is_active == True, User.organization_id == organization_id)  # noqa: E712
        .all()
    )
    candidates = []
    for fe, user in rows:
        candidates.append({
            "user_id": user.id,
            "name": user.name,
            "department": user.department,
            "embedding": fe.get_embedding(),
        })
    return candidates


def identify_face_in_frame(
    db: Session,
    frame: np.ndarray,
    organization_id: int,
) -> list[dict]:
    """
    Detect all faces in `frame` and return recognition results.

    Returns a list of dicts (one per detected face):
    {
        "bbox": (x, y, w, h),
        "confidence": float,
        "user_id": int | None,
        "name": str,
        "similarity": float | None,
    }
    """
    detections = detect_faces(frame)
    if not detections:
        return []

    candidates = _load_all_embeddings(db, organization_id)
    results = []

    for det in detections:
        face_crop = det["face"]
        embedding = generate_embedding(face_crop)

        if embedding is None:
            results.append({
                "bbox": det["bbox"],
                "confidence": det["confidence"],
                "user_id": None,
                "name": "Unknown",
                "similarity": None,
            })
            continue

        match = find_best_match(embedding, candidates)
        if match:
            results.append({
                "bbox": det["bbox"],
                "confidence": det["confidence"],
                "user_id": match["user_id"],
                "name": match["name"],
                "similarity": match["similarity"],
            })
        else:
            results.append({
                "bbox": det["bbox"],
                "confidence": det["confidence"],
                "user_id": None,
                "name": "Unknown",
                "similarity": None,
            })

    return results
