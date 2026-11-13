import hmac
import hashlib
import os
import json
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, Header, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from . import models, database

app = FastAPI()

# Creates the table in Postgres when the server starts
models.Base.metadata.create_all(bind=database.engine)

SECRET_KEY = os.environ["WEBHOOK_SECRET"].encode("utf-8")

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

    # 2. Parse Payload
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Malformed JSON")

    valid_events = ["call.started", "call.ended", "call.failed"]
    if payload.get("event_type") not in valid_events:
        raise HTTPException(status_code=400, detail="Unknown event_type")

    # 3. Store in Database
    db_event = models.CallEvent(
        event_id=payload.get("event_id"),
        event_type=payload.get("event_type"),
        account_id=payload.get("account_id"),
        call_id=payload.get("call_id"),
        timestamp=datetime.fromisoformat(payload.get("timestamp")),
        duration_seconds=payload.get("duration_seconds", 0),
        cost_cents=payload.get("cost_cents", 0),
        destination_country=payload.get("destination_country")
    )

    try:
        db.add(db_event)
        db.commit() 
    except IntegrityError:
        db.rollback()
        # If we hit an IntegrityError, it means the event_id is a duplicate.
        # We silently ignore it but tell the simulator "ok" so it stops sending it.
        return {"status": "ok", "message": "Duplicate event ignored"}

    return {"status": "ok"}