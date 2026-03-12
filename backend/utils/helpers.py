"""
utils/helpers.py
----------------
Miscellaneous helper utilities.
"""

import base64
import io
import numpy as np
import cv2
from PIL import Image
from utils.logger import logger


def base64_to_frame(b64_string: str) -> np.ndarray | None:
    """
    Decode a base64-encoded JPEG/PNG string into an OpenCV BGR frame.

    Accepts both raw base64 and data-URI prefixed strings
    (e.g. 'data:image/jpeg;base64,...').
    """
    try:
        if "," in b64_string:
            b64_string = b64_string.split(",", 1)[1]
        img_bytes = base64.b64decode(b64_string)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        return frame
    except Exception as exc:
        logger.error(f"base64_to_frame failed: {exc}")
        return None


def frame_to_base64(frame: np.ndarray, quality: int = 80) -> str:
    """Encode an OpenCV BGR frame to a base64 JPEG data URI."""
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    b64 = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def save_face_image(face_img: np.ndarray, path: str) -> bool:
    """Save a cropped face image to disk. Returns True on success."""
    try:
        import os
        os.makedirs(os.path.dirname(path), exist_ok=True)
        cv2.imwrite(path, face_img)
        return True
    except Exception as exc:
        logger.error(f"Failed to save face image to {path}: {exc}")
        return False
