from strands.tools import tool
import datetime
from neighbornode.db import query_pk

@tool
def get_status_history(fridge_id: str, days: int = 30) -> dict:
    """Query the DynamoDB event store for the status history of a fridge."""
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    events = query_pk(f"FRIDGE#{fridge_id}", "EVENT#")
    recent_events = [e for e in events if e["timestamp"] >= cutoff.isoformat() + "Z"]
    return {"fridge_id": fridge_id, "events": recent_events, "count": len(recent_events)}

@tool
def predict_empty_window(fridge_id: str) -> dict:
    """Predict when a fridge will go empty based on its history."""
    history = get_status_history(fridge_id, 30)
    events = history["events"]
    
    empty_events = [e for e in events if e.get("event_type") == "status_update" and e.get("status") == "empty"]
    if len(empty_events) < 5:
        return {
            "fridge_id": fridge_id,
            "predicted_empty_within_hours": None,
            "confidence": 0.2,
            "reasoning": "Insufficient data to make a reliable prediction (<5 empty events)."
        }
    
    empty_events.sort(key=lambda x: x["timestamp"])
    intervals = []
    for i in range(1, len(empty_events)):
        t1 = datetime.datetime.fromisoformat(empty_events[i-1]["timestamp"].replace("Z", "+00:00"))
        t2 = datetime.datetime.fromisoformat(empty_events[i]["timestamp"].replace("Z", "+00:00"))
        intervals.append((t2 - t1).total_seconds())
        
    avg_seconds = sum(intervals) / len(intervals)
    avg_hours = avg_seconds / 3600
    
    return {
        "fridge_id": fridge_id,
        "predicted_empty_within_hours": avg_hours,
        "confidence": min(0.8, len(empty_events) * 0.1),
        "reasoning": f"Based on {len(empty_events)} historical empty events, the fridge goes empty every {avg_hours:.1f} hours on average."
    }
