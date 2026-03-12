"""
face_recognition/embedder.py
-----------------------------
Generates 512-dimensional face embeddings using DeepFace with ArcFace model.
Also provides cosine-similarity-based matching against stored embeddings.

DeepFace is lazy-loaded — the FastAPI server starts instantly and TensorFlow
is only imported the first time an embedding is actually requested.
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_distances

from config import settings
from utils.logger import logger

# Lazy reference — populated on first call to _get_deepface()
_deepface = None


def _get_deepface():
    """Import DeepFace lazily so the server starts even without TensorFlow."""
    global _deepface
    if _deepface is None:
        try:
            from deepface import DeepFace as _df
            _deepface = _df
            logger.info("DeepFace loaded successfully.")
        except ImportError:
            logger.error(
                "DeepFace not installed — run: python3 -m pip install deepface"
            )
    return _deepface


# ── Embedding generation ──────────────────────────────────────────────────────

def generate_embedding(face_img: np.ndarray) -> list[float] | None:
    """
    Generate a 512-d embedding vector for a cropped face image.

    Parameters
    ----------
    face_img : np.ndarray
        BGR face image (already cropped, from detector.py)

    Returns
    -------
    list[float] | None
        512-dimensional embedding, or None if extraction fails.
    """
    DeepFace = _get_deepface()
    if DeepFace is None:
        return None

    try:
        result = DeepFace.represent(
            img_path=face_img,
            model_name=settings.DEEPFACE_MODEL,
            enforce_detection=False,  # we already cropped the face
            detector_backend="skip",  # skip internal detection
        )
        embedding = result[0]["embedding"]
        logger.debug(f"Generated embedding of dim {len(embedding)}")
        return embedding

    except Exception as exc:
        logger.error(f"Embedding generation failed: {exc}")
        return None


def generate_embedding_from_path(image_path: str) -> list[float] | None:
    """Convenience wrapper that reads an image file and embeds it."""
    import cv2
    img = cv2.imread(image_path)
    if img is None:
        logger.error(f"Could not read image at {image_path}")
        return None
    return generate_embedding(img)


# ── Matching / Similarity ─────────────────────────────────────────────────────

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Return cosine similarity (0-1, higher = more similar)."""
    a = np.array(vec_a).reshape(1, -1)
    b = np.array(vec_b).reshape(1, -1)
    distance = cosine_distances(a, b)[0][0]
    return float(1.0 - distance)


def find_best_match(
    query_embedding: list[float],
    candidates: list[dict],
    threshold: float | None = None,
) -> dict | None:
    """
    Find the best matching stored embedding.

    Parameters
    ----------
    query_embedding : list[float]
        Embedding of the face to identify.
    candidates : list[dict]
        Each dict must have keys 'user_id', 'embedding' (list[float]),
        and optionally 'name'.
    threshold : float | None
        Similarity threshold (0-1). Defaults to settings value.

    Returns
    -------
    dict | None
        Best match {'user_id', 'similarity', 'name'} or None if no match.
    """
    if not candidates:
        return None

    threshold = threshold if threshold is not None else (
        1.0 - settings.SIMILARITY_THRESHOLD
    )

    best_sim = -1.0
    best_candidate = None

    for cand in candidates:
        sim = cosine_similarity(query_embedding, cand["embedding"])
        if sim > best_sim:
            best_sim = sim
            best_candidate = cand

    logger.debug(
        f"Best match: user_id={best_candidate.get('user_id')} "
        f"similarity={best_sim:.4f} threshold={threshold:.4f}"
    )

    if best_sim >= threshold and best_candidate:
        return {
            "user_id": best_candidate["user_id"],
            "name": best_candidate.get("name", "Unknown"),
            "similarity": round(best_sim, 4),
        }

    return None   # no confident match
