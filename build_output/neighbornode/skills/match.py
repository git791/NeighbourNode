from strands.tools import tool
from geopy.distance import geodesic
from neighbornode.db import scan_by_status, get_item

@tool
def find_open_offers(near_lat: float, near_lng: float, radius_km: float = 10.0) -> dict:
    """Find open donor offers within a given radius."""
    offers = scan_by_status("OFFER", "open")
    nearby = []
    
    for offer in offers:
        donor_id = offer["PK"]
        donor = get_item(donor_id, "META")
        if not donor:
            continue
            
        d_lat = donor.get("lat")
        d_lng = donor.get("lng")
        if d_lat is None or d_lng is None:
            continue
            
        dist = geodesic((near_lat, near_lng), (d_lat, d_lng)).km
        if dist <= radius_km:
            offer_copy = dict(offer)
            offer_copy["distance_km"] = dist
            nearby.append(offer_copy)
            
    return {"offers": nearby, "count": len(nearby)}

@tool
def score_match(offer_id: str, fridge_id: str) -> dict:
    """Score the match between a donor offer and a fridge."""
    from neighbornode.db import get_table
    from boto3.dynamodb.conditions import Attr
    table = get_table()
    
    offer_items = table.scan(FilterExpression=Attr("SK").eq(f"OFFER#{offer_id}") | Attr("SK").eq(offer_id) | Attr("entity_id").eq(offer_id)).get("Items", [])
    if not offer_items:
        return {"error": f"Offer {offer_id} not found"}
    offer = offer_items[0]
    
    donor_id = offer["PK"]
    donor = get_item(donor_id, "META")
    fridge = get_item(f"FRIDGE#{fridge_id.replace('FRIDGE#', '')}", "META")
    
    if not donor or not fridge:
        return {"error": "Donor or Fridge not found"}
        
    d_lat, d_lng = donor.get("lat"), donor.get("lng")
    f_lat, f_lng = fridge.get("lat"), fridge.get("lng")
    
    distance_km = 10.0
    if d_lat and d_lng and f_lat and f_lng:
        distance_km = geodesic((d_lat, d_lng), (f_lat, f_lng)).km
        
    dist_score = max(0.0, 1.0 - (distance_km / 10.0))
    
    perish_window = float(offer.get("perishability_window_hours", 24))
    remaining = perish_window
    fresh_score = max(0.0, min(1.0, remaining / perish_window)) if perish_window else 1.0
    
    cap_score = 1.0 if fridge.get("status") in ["empty", "low"] else 0.2
    
    total = (dist_score * 0.4) + (fresh_score * 0.4) + (cap_score * 0.2)
    
    return {
        "offer_id": offer_id,
        "fridge_id": fridge_id,
        "score_breakdown": {
            "distance_score": dist_score,
            "freshness_score": fresh_score,
            "capacity_score": cap_score,
            "total_score": total,
            "distance_km": distance_km
        }
    }

@tool
def rank_candidates(offer_id: str, fridge_ids: list) -> dict:
    """Rank multiple fridges for a given offer."""
    ranked = []
    for fid in fridge_ids:
        res = score_match(offer_id, fid)
        if "error" not in res:
            ranked.append(res)
            
    ranked.sort(key=lambda x: x["score_breakdown"]["total_score"], reverse=True)
    return {"ranked": ranked}
