from strands.tools import tool
import json
import uuid
import datetime
from geopy.distance import geodesic
import boto3
from neighbornode.config import settings
from neighbornode.db import scan_by_status, get_item, put_item

@tool
def check_safety_exclusion(food_type: str, notes: str = "") -> dict:
    """Check if a food type or notes contain any safety exclusions."""
    try:
        with open(settings.food_safety_exclusion_list, "r") as f:
            exclusions = json.load(f)
    except Exception:
        exclusions = ["raw meat", "unpasteurized", "homemade alcohol", "expired"]
        
    text_to_check = f"{food_type} {notes}".lower()
    
    for ex in exclusions:
        if ex.lower() in text_to_check:
            return {"excluded": True, "matched_pattern": ex, "reason": f"Matches exclusion rule: {ex}"}
            
    return {"excluded": False, "matched_pattern": None, "reason": None}

@tool
def find_nearest_available_runner(near_lat: float, near_lng: float) -> dict:
    """Find the nearest available runner."""
    runners = scan_by_status("RUNNER", "available")
    valid_runners = [r for r in runners if r.get("active_dispatch_id") in [None, "null", ""]]
    
    best_runner = None
    min_dist = float("inf")
    
    for r in valid_runners:
        r_lat = r.get("lat")
        r_lng = r.get("lng")
        if r_lat is not None and r_lng is not None:
            dist = geodesic((near_lat, near_lng), (r_lat, r_lng)).km
            if dist < min_dist:
                min_dist = dist
                best_runner = r
                
    return {"runner": best_runner}

@tool
def build_manifest(offer_id: str, fridge_id: str, runner_id: str) -> dict:
    """Build a manifest text for the runner."""
    from neighbornode.db import get_table
    from boto3.dynamodb.conditions import Attr
    table = get_table()
    
    offer_items = table.scan(FilterExpression=Attr("SK").eq(f"OFFER#{offer_id}") | Attr("SK").eq(offer_id) | Attr("entity_id").eq(offer_id)).get("Items", [])
    if not offer_items:
        return {"error": "Offer not found"}
    offer = offer_items[0]
    
    donor = get_item(offer["PK"], "META")
    fridge = get_item(f"FRIDGE#{fridge_id.replace('FRIDGE#', '')}", "META")
    runner = get_item(f"RUNNER#{runner_id.replace('RUNNER#', '')}", "META")
    
    if not donor or not fridge or not runner:
        return {"error": "Missing entity"}
        
    donor_name = donor.get("name", "Donor")
    donor_address = donor.get("address", "Unknown Address")
    fridge_name = fridge.get("name", "Fridge")
    fridge_address = fridge.get("address", "Unknown Address")
    food_desc = offer.get("food_type", "Food")
    qty = offer.get("qty_estimate", "Unknown qty")
    window = offer.get("perishability_window_hours", "?")
    
    d_lat, d_lng = donor.get("lat", 0), donor.get("lng", 0)
    f_lat, f_lng = fridge.get("lat", 0), fridge.get("lng", 0)
    
    text = (
        f"NeighborNode dispatch 🥦\n"
        f"PICKUP: {donor_name}, {donor_address}\n"
        f"DROP: {fridge_name}, {fridge_address}\n"
        f"BRING: {food_desc} ({qty})\n"
        f"WINDOW: {window}h remaining\n"
        f"ROUTE: https://maps.google.com/maps?saddr={d_lat},{d_lng}&daddr={f_lat},{f_lng}\n"
        f"Reply ON IT to confirm or CANT to pass."
    )
    
    return {
        "manifest_text": text,
        "sms_text": text,
        "offer": offer,
        "fridge": fridge,
        "donor": donor,
        "runner": runner
    }

@tool
def send_sms(to_phone: str, message: str) -> dict:
    """Send an SMS using AWS Pinpoint."""
    if not settings.pinpoint_app_id:
        return {"success": False, "message_id": None, "error": "Pinpoint not configured"}
        
    try:
        client = boto3.client("pinpoint", region_name=settings.aws_region)
        response = client.send_messages(
            ApplicationId=settings.pinpoint_app_id,
            MessageRequest={
                "Addresses": {to_phone: {"ChannelType": "SMS"}},
                "MessageConfiguration": {
                    "SMSMessage": {
                        "Body": message,
                        "MessageType": "TRANSACTIONAL",
                        "OriginationNumber": settings.pinpoint_origination_number
                    }
                }
            }
        )
        msg_result = response["MessageResponse"]["Result"][to_phone]
        return {"success": msg_result["DeliveryStatus"] == "SUCCESSFUL", "message_id": msg_result.get("MessageId"), "error": msg_result.get("StatusMessage")}
    except Exception as e:
        return {"success": False, "message_id": None, "error": str(e)}

@tool
def queue_for_approval(item_type: str, item_id: str, reason: str, context: dict = None) -> dict:
    """Queue an item for human approval."""
    if not reason:
        raise ValueError("reason field is REQUIRED for queue_for_approval")
        
    app_id = str(uuid.uuid4())
    ts = datetime.datetime.utcnow().isoformat() + "Z"
    
    put_item({
        "PK": f"APPROVAL#{app_id}",
        "SK": "META",
        "item_type": item_type,
        "item_id": item_id,
        "reason": reason,
        "context": context or {},
        "status": "pending",
        "created_at": ts
    })
    
    if settings.coordinator_phone:
        send_sms(settings.coordinator_phone, f"Approval needed for {item_type} {item_id}: {reason}")
        
    return {"approval_id": app_id, "queued": True}
