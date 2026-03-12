"""
database/models.py
------------------
ORM models for:
  • User          — registered person (employee / student)
  • FaceEmbedding — 512-d ArcFace vector stored as JSON
  • AttendanceLog — timestamped record each time someone is recognised
"""

import json
from datetime import datetime, date as date_type

from sqlalchemy import (
    Column, Integer, String, Float, Text,
    DateTime, Date, ForeignKey, Boolean,
)
from sqlalchemy.orm import relationship

from database.connection import Base


class Organization(Base):
    __tablename__ = "organizations"

    id                 = Column(Integer, primary_key=True, index=True)
    name               = Column(String(150), unique=True, nullable=False)
    created_at         = Column(DateTime, default=datetime.now)
    subscription_plan  = Column(String(50), default="Basic")    # Basic | Standard | Enterprise
    subscription_status= Column(String(50), default="active")   # active | past_due | cancelled
    is_active          = Column(Boolean, default=True)

    # relationships
    users      = relationship("User", back_populates="organization", cascade="all, delete")
    logs       = relationship("AttendanceLog", back_populates="organization", cascade="all, delete")
    settings   = relationship("SystemSettings", back_populates="organization", cascade="all, delete")
    cameras    = relationship("Camera", back_populates="organization", cascade="all, delete")

    def __repr__(self) -> str:
        return f"<Organization id={self.id} name={self.name!r} plan={self.subscription_plan}>"


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default=1)
    name            = Column(String(120), nullable=False)
    email           = Column(String(200), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    department      = Column(String(120), nullable=True)
    role            = Column(String(80), default="employee")   # employee | student | org_admin | super_admin
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.now)

    # relationships
    organization    = relationship("Organization", back_populates="users")
    embeddings      = relationship("FaceEmbedding", back_populates="user", cascade="all, delete")
    attendance_logs = relationship("AttendanceLog", back_populates="user", cascade="all, delete")

    def __repr__(self) -> str:
        return f"<User id={self.id} name={self.name!r}>"


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Store the embedding vector as a JSON text column for portability
    embedding   = Column(Text, nullable=False)   # JSON-serialised list[float]
    image_path  = Column(String(300), nullable=True)
    created_at  = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="embeddings")

    # ── helpers ──────────────────────────────────────────────────────────────

    def set_embedding(self, vector: list[float]) -> None:
        """Serialise a list[float] into the text column."""
        self.embedding = json.dumps(vector)

    def get_embedding(self) -> list[float]:
        """Deserialise the stored JSON back to a list[float]."""
        return json.loads(self.embedding)

    def __repr__(self) -> str:
        return f"<FaceEmbedding id={self.id} user_id={self.user_id}>"


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id              = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default=1)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    timestamp       = Column(DateTime, default=datetime.now, nullable=False)
    date            = Column(Date, default=date_type.today, nullable=False)
    status          = Column(String(20), default="present")  # present | late | early
    confidence      = Column(Float, nullable=True)          # similarity score at recognition time

    organization    = relationship("Organization", back_populates="logs")
    user            = relationship("User", back_populates="attendance_logs")

    def __repr__(self) -> str:
        return f"<AttendanceLog id={self.id} user_id={self.user_id} date={self.date}>"


class SystemSettings(Base):
    """
    Stores global application settings per organization.
    """
    __tablename__ = "system_settings"

    id                  = Column(Integer, primary_key=True, index=True)
    organization_id     = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True, default=1)
    expected_start_time = Column(String(5), default="09:15")  # HH:MM format

    organization        = relationship("Organization", back_populates="settings")


class Camera(Base):
    """
    Stores connected physical cameras per organization.
    """
    __tablename__ = "cameras"

    id              = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default=1)
    name            = Column(String(150), nullable=False)    # e.g. "Front Door"
    location        = Column(String(200), nullable=True)     # e.g. "Lobby A"
    status          = Column(String(50), default="online")   # online | offline
    created_at      = Column(DateTime, default=datetime.now)

    organization    = relationship("Organization", back_populates="cameras")

    def __repr__(self) -> str:
        return f"<Camera id={self.id} org={self.organization_id} location={self.location}>"
