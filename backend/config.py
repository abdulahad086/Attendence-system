"""
config.py
---------
Centralised application configuration using pydantic-settings.
All values are read from the .env file (or environment variables).
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql://attend_user:attend_pass@localhost:5432/attendance_db",
        description="PostgreSQL connection string",
    )

    # ── Face Recognition ─────────────────────────────────────────────────────
    DEEPFACE_MODEL: str = Field(
        default="ArcFace",
        description="DeepFace model name: ArcFace | Facenet | VGG-Face | DeepFace",
    )
    SIMILARITY_THRESHOLD: float = Field(
        default=0.40,
        description="Cosine distance threshold — lower = stricter matching",
    )
    MIN_FACE_SIZE: int = Field(
        default=60,
        description="Minimum face bounding-box size in pixels to accept",
    )

    # ── Attendance ────────────────────────────────────────────────────────────
    EXPECTED_START_TIME: str = Field(
        default="09:15",
        description="Time before which an employee is considered 'present' (HH:MM format)",
    )
    ATTENDANCE_COOLDOWN_MINUTES: int = Field(
        default=5,
        description="Minutes before the same user can be marked again",
    )

    # ── Security ──────────────────────────────────────────────────────────────
    SECRET_KEY: str = Field(
        default="change-me-in-production-please",
        description="Secret key for signing tokens / sessions",
    )

    # ── Storage ───────────────────────────────────────────────────────────────
    FACE_IMAGES_DIR: str = Field(
        default="data/face_images",
        description="Directory where captured face images are saved",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Singleton instance imported by all modules
settings = Settings()
