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

        text = body.get("text", "").strip()
        sender = body.get("sender", body.get("originationNumber", ""))
        channel = body.get("channel", "sms")

        if not text:
            return _response(400, {"error": "Missing 'text' field in request body"})

        logger.info(f"Inbound event: text={text!r} sender={sender} channel={channel}")

        # ── Runner reply fast-path ─────────────────────────────────────────────
        # If the sender has an active dispatch AND the text is a runner reply,
        # handle it directly without going through the full orchestrator chain.
        normalized = text.upper().strip()
        if normalized in ("ON IT", "ON IT!", "YES", "OK", "CONFIRMED") or normalized in ("CANT", "CAN'T", "NO", "PASS", "SKIP"):
            result = _handle_runner_reply(sender=sender, text=normalized)
            if result is not None:
                return result
        # ─────────────────────────────────────────────────────────────────────

        from neighbornode.agents.orchestrator import process_event
        result = process_event(text=text, sender=sender, channel=channel)

        return _response(200, {"status": "processed", "result": result})

    except Exception as exc:
        logger.exception("Orchestrator error")
        return _response(500, {"error": str(exc)})


def _handle_runner_reply(sender: str, text: str):
    """Handle ON IT / CANT runner replies. Returns a response dict or None if sender is not a known active runner."""
    try:
        from neighbornode.db import get_table
        import boto3
        from boto3.dynamodb.conditions import Attr

        # Find runner by phone number
        table = get_table()
        runners = table.scan(
            FilterExpression=Attr("PK").begins_with("RUNNER#") & Attr("SK").eq("META") & Attr("phone").eq(sender)
        ).get("Items", [])

        if not runners:
            return None  # Not a known runner — fall through to full orchestrator

        runner = runners[0]
        dispatch_id = runner.get("active_dispatch_id")
        if not dispatch_id:
            return None  # Runner has no active dispatch — fall through

        runner_id = runner.get("entity_id") or runner["PK"].replace("RUNNER#", "")
        is_accept = text in ("ON IT", "ON IT!", "YES", "OK", "CONFIRMED")

        if is_accept:
            from neighbornode.db import update_item_attr
            from neighbornode.skills.shared import log_event
            update_item_attr(f"DISPATCH#{dispatch_id}", "META", "status", "active")
            log_event(
                entity_id=f"DISPATCH#{dispatch_id}",
                event_type="runner_accepted",
                payload={"runner_id": runner_id, "reply": text},
            )
            logger.info(f"Runner {runner_id} accepted dispatch {dispatch_id}")
            return _response(200, {"status": "accepted", "dispatch_id": dispatch_id})
        else:
            # Runner declined — trigger retry logic
            from neighbornode.skills.dispatch import retry_dispatch
            from neighbornode.db import get_item
            dispatch = get_item(f"DISPATCH#{dispatch_id}", "META")
            attempt = dispatch.get("attempt", 1) if dispatch else 1
            result = retry_dispatch(dispatch_id=dispatch_id, declined_runner_id=runner_id, attempt=attempt)
            logger.info(f"Runner {runner_id} declined dispatch {dispatch_id}: retry result={result}")
            return _response(200, {"status": "declined", "retry_result": result})

    except Exception as exc:
        logger.error(f"Runner reply handler error: {exc}")
        return None  # Fall through to orchestrator on any error


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body),
    }
