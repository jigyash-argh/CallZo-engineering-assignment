import hmac
import hashlib
import os
from fastapi import FastAPI,Request,Header,HTTPException
app=FastAPI()
# extract the env key from .env
SECRET_KEY = os.getenv("WEBHOOK_SECRET", "callzo_test_secret_change_me").encode("utf-8")
@app.post("/webhooks/calls")
async def handle_webhook(request:Request,x_signature:str=Header(None)):
    if not x_signature:
        raise HTTPException(
            status_code=401,
            detail="Missing X-signature header"
        )
    raw_body=await request.body()
    expected_mac=hmac.new(SECRET_KEY,raw_body,hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_mac,x_signature):
        raise HTTPException(status_code=401,
                            detail="Invalid Signature")
    return {"status":"ok","message":"signature verified"}