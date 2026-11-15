import hmac
import hashlib
import os
import json
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Header, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from pydantic import BaseModel, ValidationError

from . import models, database

app = FastAPI()
models.Base.metadata.create_all(bind=database.engine)

SECRET_KEY = os.environ["WEBHOOK_SECRET"].encode("utf-8")
API_TOKEN = os.environ["API_TOKEN"]

# Pydantic model for strict type validation to prevent 500 errors from malformed data
class WebhookPayload(BaseModel):
    event_id: str
    event_type: str
    account_id: str
    call_id: str
    timestamp: str
    duration_seconds: int = 0
    cost_cents: int = 0
    destination_country: Optional[str] = None

@app.post("/webhooks/calls")
async def handle_webhook(
    request: Request, 
    x_signature: str = Header(None),
    db: Session = Depends(database.get_db)
):
    # 1. Security Check
    if not x_signature:
        raise HTTPException(status_code=401, detail="Missing X-Signature header")

    raw_body = await request.body()
    expected_mac = hmac.new(SECRET_KEY, raw_body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_mac, x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # 2. Parse and Validate Payload
    try:
        raw_dict = json.loads(raw_body)
        payload = WebhookPayload(**raw_dict)
    except (json.JSONDecodeError, ValidationError, TypeError):
        # This safely catches "not_a_number" and missing fields, returning a 400 instead of crashing (500)[cite: 1]
        raise HTTPException(status_code=400, detail="Malformed payload")

    valid_events = ["call.started", "call.ended", "call.failed"]
    if payload.event_type not in valid_events:
        raise HTTPException(status_code=400, detail="Unknown event_type")

    # 3. Store in Database
    try:
        parsed_timestamp = datetime.fromisoformat(payload.timestamp)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    db_event = models.CallEvent(
        event_id=payload.event_id,
        event_type=payload.event_type,
        account_id=payload.account_id,
        call_id=payload.call_id,
        timestamp=parsed_timestamp,
        duration_seconds=payload.duration_seconds,
        cost_cents=payload.cost_cents,
        destination_country=payload.destination_country
    )

    try:
        db.add(db_event)
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"status": "ok", "message": "Duplicate event ignored"}

    return {"status": "ok"}

@app.get("/api/usage/{account_id}")
def get_account_usage(
    account_id: str, 
    authorization: str = Header(None), 
    db: Session = Depends(database.get_db)
):
    if authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    usage_stats = db.query(
        func.sum(models.CallEvent.duration_seconds).label("total_duration"),
        func.sum(models.CallEvent.cost_cents).label("total_cost")
    ).filter(
        models.CallEvent.account_id == account_id,
        models.CallEvent.event_type == "call.ended"
    ).first()

    total_minutes = (usage_stats.total_duration or 0) // 60
    total_cost_cents = usage_stats.total_cost or 0

    cap_limit_cents = 10000
    status = "active"
    if total_cost_cents > cap_limit_cents:
        status = "capped_soft_limit_reached"

    return {
        "account_id": account_id,
        "total_minutes": total_minutes,
        "total_cost_cents": total_cost_cents,
        "status": status,
        "cap_limit_cents": cap_limit_cents
    }