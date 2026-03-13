from database.connection import SessionLocal, engine, Base
from database.models import User, Organization
from services.auth_service import get_password_hash
import os

DATABASE_URL = "postgresql://neondb_owner:npg_p4EsOJgTN1Ym@ep-rapid-cherry-adi1qp8k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
os.environ["DATABASE_URL"] = DATABASE_URL

def force_seed_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        org = db.query(Organization).filter(Organization.name == "AttendAI HQ").first()
        if not org:
            org = Organization(name="AttendAI HQ")
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"Created organization: {org.name}")

        admin = db.query(User).filter(User.email == "admin@attendai.com").first()
        if admin:
            print("Updating existing admin password...")
            admin.hashed_password = get_password_hash("admin123")
            admin.role = "super_admin"
            db.commit()
        else:
            admin = User(
                organization_id=org.id,
                name="System Administrator",
                email="admin@attendai.com",
                hashed_password=get_password_hash("admin123"),
                role="super_admin"
            )
            db.add(admin)
            db.commit()
            print("Created new admin user.")
        
        print("Admin user is ready: admin@attendai.com / admin123")
    finally:
        db.close()

if __name__ == "__main__":
    force_seed_admin()
