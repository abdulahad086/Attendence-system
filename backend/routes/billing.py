"""
routes/billing.py
-----------------
Monetization foundation. Stubs for Stripe integration, 
subscription management, and webhooks.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Organization
from utils.logger import logger

router = APIRouter(prefix="/api/billing", tags=["Billing"])

@router.post("/subscribe")
def create_subscription(
    org_id: int,
    plan: str = Body(..., embed=True), # Basic | Standard | Enterprise
    db: Session = Depends(get_db)
):
    """
    Stub for creating a Stripe Checkout Session.
    In production, this would return a Stripe URL for the user to pay.
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    logger.info(f"Subscription request for Org: {org.name}, Plan: {plan}")
    
    # Logic to generate Stripe Session would go here
    return {
        "status": "success",
        "message": f"Checkout session initiated for {plan} plan",
        "checkout_url": "https://checkout.stripe.com/stub-url"
    }

@router.get("/status/{org_id}")
def get_billing_status(org_id: int, db: Session = Depends(get_db)):
    """Check if an organization has an active subscription."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "organization": org.name,
        "plan": org.subscription_plan,
        "status": org.subscription_status,
        "is_active": org.is_active
    }

@router.post("/webhook")
async def stripe_webhook(payload: dict = Body(...)):
    """
    Handle Stripe events (invoice.paid, customer.subscription.deleted, etc.)
    This updates the 'organizations' table in the DB.
    """
    event_type = payload.get("type")
    logger.info(f"Received Stripe Webhook: {event_type}")
    
    # In production, verify Stripe signature here
    return {"status": "received"}
