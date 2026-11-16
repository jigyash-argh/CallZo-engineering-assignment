# Task 1: Usage Metering Service

## Setup Instructions
1. Copy the environment variables: `cp .env.example .env`
2. Start the service: `docker compose up`
3. The API will be available at `http://localhost:8080`, and the simulator will automatically run its configured scenario.

## Design Decisions
* **Idempotency & Duplicates:** I used PostgreSQL with `event_id` as the primary key. If a duplicate event arrives, the database throws an `IntegrityError`, which the API catches, rolls back, and returns a `200 OK` to stop the simulator from retrying.
* **Out-of-Order Events:** By storing raw events individually rather than calculating state on the fly, `call.ended` events can safely arrive before `call.started` events without breaking the billing logic.
* **Financial Data:** All financial fields (`cost_cents`) are strictly stored and computed as integers to prevent floating-point precision errors.
* **Security:** The `WEBHOOK_SECRET` and `API_TOKEN` are loaded strictly from environment variables to keep secrets out of the codebase. Constant-time comparison (`hmac.compare_digest`) is used to prevent timing attacks during signature verification.

## Failure Behavior
* **Malformed Payloads:** Handled via Pydantic strict typing. Invalid types (like string instead of integer) or missing fields are caught before database insertion and return a clean `400 Bad Request`.
* **Bad Signatures:** Rejected immediately with `401 Unauthorized` before the payload is parsed.
* **Late Events:** Currently, late events are stored as-is with their historical timestamps. When querying the usage API, they will inherently apply to whatever billing cycle their `timestamp` falls into.
* **Cap Burst:** A soft cap of $100.00 (10,000 cents) is enforced. When exceeded, the account is flagged (`status: capped_soft_limit_reached`) in the usage API, but data continues to be recorded so no usage is permanently lost.

## Next Steps (With More Time)
1. **Message Broker (Kafka/RabbitMQ):** Move the webhook processing into a queue to handle massive bursts without overwhelming the Postgres connection pool.
2. **Reconciliation Cron Job:** Implement a background worker (e.g., Celery) to periodically sweep the events table and pre-calculate monthly usage into an aggregated `account_billing` table for faster API reads.