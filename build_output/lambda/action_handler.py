import json
import logging
import os
import sys
import datetime
import uuid

sys.path.insert(0, "/var/task")

from neighbornode.db import put_item, update_item_attr
from neighbornode.skills.dispatch import check_safety_exclusion

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

def handler(event, context):
    try:
        # API Gateway HTTP APIs use rawPath
        path = event.get("rawPath", "")
        if "body" in event:
            raw = event["body"]
            body = json.loads(raw) if isinstance(raw, str) else raw
        else:
            body = {}

        logger.info(f"Action triggered: {path} with body {body}")

        if path.endswith("/offer"):
            return handle_offer(body)
        elif path.endswith("/fridge/empty"):
            return handle_fridge_status(body, "empty")
        elif path.endswith("/fridge/low"):
            return handle_fridge_status(body, "low")
        elif path.endswith("/fridge/update"):
            return handle_fridge_update(body)
        elif path.endswith("/dispatch/complete"):
            return handle_dispatch_complete(body)
        else:
            return _response(404, {"error": f"Unknown path {path}"})

    except Exception as exc:
        logger.exception("Action handler error")
        return _response(500, {"error": str(exc)})

def handle_offer(body):
    offer_id = f"offer-{uuid.uuid4().hex[:8]}"
    food_type = body.get("food_type", "")
    notes = body.get("notes", "")
    
    # 1. Deterministically save the offer
    offer_item = {
        "PK": f"DONOR#{body.get('donor_name', 'Unknown').replace(' ', '')}",
        "SK": f"OFFER#{offer_id}",
        "entity_id": offer_id,
        "donor_name": body.get("donor_name"),
        "food_type": food_type,
        "quantity": body.get("quantity"),
        "fridge_id": body.get("fridge_id"), 
        "notes": notes,
        "status": "open",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    put_item(offer_item)

    # 2. Check safety exclusions deterministically
    safety = check_safety_exclusion(food_type=food_type, notes=notes)
    if safety.get("excluded"):
        update_item_attr(offer_item["PK"], offer_item["SK"], "status", "flagged")
        
        approval_id = f"approval-{uuid.uuid4().hex[:8]}"
        put_item({
            "PK": f"APPROVAL#{approval_id}",
            "SK": "META",
            "approval_id": approval_id,
            "item_type": "offer",
            "item_id": offer_id,
            "reason": safety.get("reason", "Safety flag"),
            "status": "pending",
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })
        return _response(200, {"success": True, "offer": offer_item, "flagged": True})

    # 3. Trigger the agent chain (match → dispatch) so the offer is handled autonomously,
    #    just as it would be if the donor had texted their offer via SMS.
    try:
        from neighbornode.agents.orchestrator import process_event
        process_event(
            text=f"Donor offer: {food_type}, qty {body.get('quantity', 'unknown')}, notes: {notes}",
            sender=body.get("donor_name", "webform"),
            channel="webform",
        )
    except Exception as exc:
        logger.warning(f"Orchestrator chain failed after offer submission: {exc}")

    return _response(200, {"success": True, "offer": offer_item})

def handle_fridge_status(body, status):
    fridge_id = body.get("fridge_id")
    if not fridge_id:
        return _response(400, {"error": "Missing fridge_id"})

    pk = f"FRIDGE#{fridge_id.replace('fridge-', '')}"

    update_item_attr(pk, "META", "status", status)
    filled_count = 0 if status == "empty" else 2
    update_item_attr(pk, "META", "filled_count", filled_count)
    update_item_attr(pk, "META", "last_restocked_at", datetime.datetime.now(datetime.timezone.utc).isoformat())

    # Trigger the full agent chain (match → dispatch) when a fridge goes empty or low,
    # so dashboard host actions are equivalent to sending an SMS "EMPTY" text.
    if status in ("empty", "low"):
        try:
            from neighbornode.agents.orchestrator import process_event
            process_event(
                text=f"Fridge {fridge_id} is {status}",
                sender=body.get("host_phone", "dashboard"),
                channel="dashboard",
            )
        except Exception as exc:
            logger.warning(f"Orchestrator chain failed after fridge status update: {exc}")

    return _response(200, {"success": True, "status": status})

def handle_fridge_update(body):
    fridge_id = body.get("fridge_id")
    count = body.get("count", 0)
    auth_user = body.get("user", "Unknown User")
    
    if not fridge_id:
        return _response(400, {"error": "Missing fridge_id"})
        
    pk = f"FRIDGE#{fridge_id.replace('fridge-', '')}"
    
    if count == 0:
        status = "empty"
    elif count <= 2:
        status = "low"
    else:
        status = "stocked"
        
    update_item_attr(pk, "META", "status", status)
    update_item_attr(pk, "META", "filled_count", count)
    update_item_attr(pk, "META", "last_restocked_at", datetime.datetime.now(datetime.timezone.utc).isoformat())

    logger.info(f"Fridge {fridge_id} updated to {count} crates by {auth_user}")
    return _response(200, {"success": True, "status": status, "count": count})

def handle_dispatch_complete(body):
    dispatch_id = body.get("dispatch_id")
    if not dispatch_id:
        return _response(400, {"error": "Missing dispatch_id"})
        
    return _response(200, {"success": True, "dispatch_id": dispatch_id, "status": "completed"})

def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body),
    }
