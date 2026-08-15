"""
Webhook handler — receives inbound SMS/HTTP events from API Gateway
and routes them through the NeighborNode Orchestrator.

API Gateway sends POST /inbound with JSON body:
  {"text": "...", "sender": "+1...", "channel": "sms"}

Pinpoint SMS webhooks have a different structure — handle both.
"""
import json
import logging
import os
import sys

sys.path.insert(0, "/var/task")

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))


def handler(event, context):
    """Lambda entry point for POST /inbound."""
    try:
        body = {}
        if "body" in event:
            raw = event["body"]
            if raw:
                body = json.loads(raw) if isinstance(raw, str) else raw

        text = body.get("text", "")
        sender = body.get("sender", body.get("originationNumber", ""))
        channel = body.get("channel", "sms")

        if not text:
            return _response(400, {"error": "Missing 'text' field in request body"})

        logger.info(f"Inbound event: text={text!r} sender={sender} channel={channel}")

        from neighbornode.agents.orchestrator import process_event
        result = process_event(text=text, sender=sender, channel=channel)

        return _response(200, {"status": "processed", "result": result})

    except Exception as exc:
        logger.exception("Orchestrator error")
        return _response(500, {"error": str(exc)})


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body),
    }
