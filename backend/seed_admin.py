from database.connection import SessionLocal, engine, Base
from database.models import User, Organization
from services.auth_service import get_password_hash

def seed_admin():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if we already have an org
        org = db.query(Organization).filter(Organization.name == "AttendAI HQ").first()
        if not org:
            org = Organization(name="AttendAI HQ")
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"Created organization: {org.name}")

        # Check if we already have this user
        admin = db.query(User).filter(User.email == "admin@attendai.com").first()
        if not admin:
            admin = User(
                organization_id=org.id,
                name="System Administrator",
                email="admin@attendai.com",
                hashed_password=get_password_hash("admin123"),
                role="super_admin"
            )
            db.add(admin)
            db.commit()
            print("Created admin user:")
            print("  Email: admin@attendai.com")
            print("  Password: admin123")
        else:
            print("Admin user already exists!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
