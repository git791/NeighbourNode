from strands.tools import tool
import datetime
from neighbornode.db import put_item, scan_by_status

@tool
def log_event(entity_id: str, event_type: str, payload: dict) -> dict:
    """Log a structured event to the DynamoDB event store. Every state change flows through here."""
    ts = datetime.datetime.utcnow().isoformat() + "Z"
    item = {
        "PK": entity_id,
        "SK": f"EVENT#{ts}",
        "event_type": event_type,
        "timestamp": ts,
        **payload,
    }
    put_item(item)
    return {"logged": True, "timestamp": ts}

@tool
def get_dashboard_state() -> dict:
    """Return the full live state for the coordinator dashboard: all fridges, open offers, active dispatches, pending approvals."""
    from neighbornode.db import get_table
    from boto3.dynamodb.conditions import Attr
    table = get_table()
    
    fridges = table.scan(FilterExpression=Attr("PK").begins_with("FRIDGE#") & Attr("SK").eq("META")).get("Items", [])
    open_offers = scan_by_status("OFFER", "open")
    active_dispatches = scan_by_status("DISPATCH", "active")
    pending_approvals = scan_by_status("APPROVAL", "pending")
    
    return {
        "fridges": fridges,
        "open_offers": open_offers,
        "active_dispatches": active_dispatches,
        "pending_approvals": pending_approvals
    }
