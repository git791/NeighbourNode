"""
Approval handler — Coordinator approves or rejects held items from the dashboard.

POST /approve  body: {"approval_id": "...", "coordinator_note": "..."}
POST /reject   body: {"approval_id": "...", "coordinator_note": "..."}
"""
import json
import logging
import os
import sys
import datetime

sys.path.insert(0, "/var/task")

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))


def handler(event, context):
    path = event.get("rawPath", event.get("path", ""))
    action = "approve" if "/approve" in path else "reject"

    try:
        body = {}
        if event.get("body"):
            body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]

        approval_id = body.get("approval_id", "")
        coordinator_note = body.get("coordinator_note", "")

        if not approval_id:
            return _response(400, {"error": "Missing approval_id"})

        from neighbornode.db import get_item, update_item_attr, put_item
        from neighbornode.skills.shared import log_event
        
        item = get_item(pk=f"APPROVAL#{approval_id}", sk="META")
        if not item:
            return _response(404, {"error": f"Approval item {approval_id} not found"})

        if item.get("status") != "pending":
            return _response(409, {"error": f"Item is already {item.get('status')} — cannot {action} again"})

        now = datetime.datetime.utcnow().isoformat() + "Z"
        update_item_attr(pk=f"APPROVAL#{approval_id}", sk="META", key="status", value=action + "d")
        update_item_attr(pk=f"APPROVAL#{approval_id}", sk="META", key="resolved_at", value=now)
        update_item_attr(pk=f"APPROVAL#{approval_id}", sk="META", key="coordinator_note", value=coordinator_note)

        log_event(
            entity_id=f"APPROVAL#{approval_id}",
            event_type=f"coordinator_{action}d",
            payload={"coordinator_note": coordinator_note, "resolved_at": now},
        )

        logger.info(f"Coordinator {action}d approval {approval_id}: {coordinator_note}")

        result_msg = f"Item {approval_id} has been {action}d."
        if action == "approve":
            try:
                result_msg += " Triggering dispatch..."
                from neighbornode.agents.dispatch_agent import run_dispatch_agent
                match = {
                    "offer_id": item.get("item_id"),
                    "approved": True,
                    "approval_id": approval_id,
                }
                dispatch_result = run_dispatch_agent(match=match)
                result_msg += f" Dispatch result: {dispatch_result}"
            except Exception as exc:
                logger.error(f"Post-approval dispatch failed: {exc}")
                result_msg += f" Warning: dispatch failed — {exc}"

        return _response(200, {"status": f"{action}d", "message": result_msg})

    except Exception as exc:
        logger.exception(f"Approval handler error ({action})")
        return _response(500, {"error": str(exc)})


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body),
    }
