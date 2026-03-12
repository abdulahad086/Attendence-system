"""
face_recognition/detector.py
-----------------------------
Detects faces in an image frame using OpenCV's DNN-based face detector
(more accurate than Haar Cascades, works at various angles and lighting).

Returns a list of cropped face images (numpy arrays) ready for embedding.
"""

import cv2
import numpy as np
from pathlib import Path
from utils.logger import logger
from config import settings

# Path to the bundled OpenCV DNN face detection model files
_MODELS_DIR = Path(__file__).parent / "models"

# We use OpenCV's res10_300x300_ssd_iter_140000 which is robust and fast
_PROTO = str(_MODELS_DIR / "deploy.prototxt")
_MODEL = str(_MODELS_DIR / "res10_300x300_ssd_iter_140000.caffemodel")

_CONFIDENCE_THRESHOLD = 0.65   # DNN confidence threshold


def _load_net():
    """Load the DNN face detection network (cached at module level)."""
    if not Path(_PROTO).exists() or not Path(_MODEL).exists():
        # Fall back to Haar Cascade if DNN model files are missing
        logger.warning(
            "DNN model files not found — falling back to Haar Cascade detector. "
            "Run scripts/download_models.py to get the DNN models."
        )
        return None
    return cv2.dnn.readNetFromCaffe(_PROTO, _MODEL)


_net = None  # lazy-loaded


def _get_net():
    global _net
    if _net is None:
        _net = _load_net()
    return _net


def detect_faces(frame: np.ndarray) -> list[dict]:
    """
    Detect all faces in `frame`.

    Parameters
    ----------
    frame : np.ndarray
        BGR image as returned by cv2.VideoCapture.read()

    Returns
    -------
    list of dict with keys:
        - "face"   : cropped BGR face image (np.ndarray)
        - "bbox"   : (x, y, w, h) bounding box tuple
        - "confidence" : detection confidence (float 0-1)
    """
    net = _get_net()

    if net is not None:
        return _detect_dnn(frame, net)
    else:
        return _detect_haar(frame)


def _detect_dnn(frame: np.ndarray, net) -> list[dict]:
    """DNN-based face detection (preferred)."""
    h, w = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(
        cv2.resize(frame, (300, 300)), 1.0, (300, 300),
        (104.0, 177.0, 123.0), swapRB=False, crop=False,
    )
    net.setInput(blob)
    detections = net.forward()

    results = []
    for i in range(detections.shape[2]):
        conf = float(detections[0, 0, i, 2])
        if conf < _CONFIDENCE_THRESHOLD:
            continue

        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
        x1, y1, x2, y2 = box.astype(int)

        # Clamp to image boundaries
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w - 1, x2), min(h - 1, y2)

        face_w, face_h = x2 - x1, y2 - y1
        if face_w < settings.MIN_FACE_SIZE or face_h < settings.MIN_FACE_SIZE:
            continue

        face_crop = frame[y1:y2, x1:x2]
        results.append({
            "face": face_crop,
            "bbox": (x1, y1, face_w, face_h),
            "confidence": conf,
        })

    logger.debug(f"DNN detected {len(results)} face(s)")
    return results


def _detect_haar(frame: np.ndarray) -> list[dict]:
    """Haar Cascade fallback detector."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    faces = cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5,
        minSize=(settings.MIN_FACE_SIZE, settings.MIN_FACE_SIZE),
    )

    results = []
    for (x, y, fw, fh) in (faces if len(faces) else []):
        results.append({
            "face": frame[y: y + fh, x: x + fw],
            "bbox": (int(x), int(y), int(fw), int(fh)),
            "confidence": 0.8,   # Haar doesn't give confidence
        })

    logger.debug(f"Haar detected {len(results)} face(s)")
    return results


def draw_detections(frame: np.ndarray, detections: list[dict]) -> np.ndarray:
    """
    Draw bounding boxes + confidence on a frame (for debug / preview).
    Returns a copy of the frame with annotations.
    """
    annotated = frame.copy()
    for det in detections:
        x, y, fw, fh = det["bbox"]
        conf = det["confidence"]
        label = det.get("name", f"{conf:.0%}")
        color = (0, 200, 100)  # green

        cv2.rectangle(annotated, (x, y), (x + fw, y + fh), color, 2)
        cv2.putText(
            annotated, label, (x, y - 8),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2,
        )
    return annotated
