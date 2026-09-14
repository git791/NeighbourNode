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
    """Return the full live state for the coordinator dashboard: all fridges, open offers, active dispatches, pending approvals, and latest forecasts."""
    from neighbornode.db import get_table
    from boto3.dynamodb.conditions import Attr
    table = get_table()

    fridges = table.scan(FilterExpression=Attr("PK").begins_with("FRIDGE#") & Attr("SK").eq("META")).get("Items", [])
    open_offers = scan_by_status("OFFER", "open")
    active_dispatches = scan_by_status("DISPATCH", "active")
    pending_approvals = table.scan(
        FilterExpression=Attr("PK").begins_with("APPROVAL#") & Attr("SK").eq("META") & Attr("status").eq("pending")
    ).get("Items", [])

    # Fetch the latest forecast prediction for each fridge
    forecasts = []
    try:
        forecast_items = table.scan(
            FilterExpression=Attr("PK").begins_with("FORECAST#")
        ).get("Items", [])
        # Keep only the most recent prediction per fridge
        latest: dict = {}
        for item in forecast_items:
            fridge_pk = item["PK"]
            ts = item.get("SK", "")
            if fridge_pk not in latest or ts > latest[fridge_pk].get("SK", ""):
                latest[fridge_pk] = item
        forecasts = list(latest.values())
    except Exception:
        pass  # Forecasts are best-effort; don't break the dashboard if missing

    return {
        "fridges": fridges,
        "open_offers": open_offers,
        "active_dispatches": active_dispatches,
        "pending_approvals": pending_approvals,
        "forecasts": forecasts,
    }
