"""
database/connection.py
----------------------
SQLAlchemy engine + session factory + Base class.

Supports both SQLite (local dev, zero-install) and PostgreSQL (production).
The DB backend is selected automatically from DATABASE_URL.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import settings

_IS_SQLITE = settings.DATABASE_URL.startswith("sqlite")

if _IS_SQLITE:
    # SQLite needs these special connect_args for multi-threaded use with FastAPI
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Common declarative base shared by all ORM models."""
    pass


def get_db():
    """FastAPI dependency — yields a DB session and closes it after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables defined in models (called on app startup)."""
    from database import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    
    # Seed default organization and system settings
    db = SessionLocal()
    try:
        org = db.query(models.Organization).first()
        if not org:
            org = models.Organization(name="Default Organization")
            db.add(org)
            db.commit()
            db.refresh(org)
            
        setting = db.query(models.SystemSettings).filter_by(organization_id=org.id).first()
        if not setting:
            db.add(models.SystemSettings(organization_id=org.id, expected_start_time=settings.EXPECTED_START_TIME))
            db.commit()
    finally:
        db.close()
