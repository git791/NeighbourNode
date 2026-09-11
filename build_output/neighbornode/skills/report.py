from strands.tools import tool
import datetime
import math
from neighbornode.db import get_table

@tool
def aggregate_events(from_date: str, to_date: str) -> dict:
    """Aggregate dispatch events within a date range."""
    from boto3.dynamodb.conditions import Attr
    table = get_table()
    
    response = table.scan(
        FilterExpression=Attr("PK").begins_with("DISPATCH#") & Attr("SK").eq("META")
    )
    items = response.get("Items", [])
    
    in_range = []
    for item in items:
        ca = item.get("created_at", "")
        if from_date <= ca <= (to_date + "T23:59:59Z"):
            in_range.append(item)
            
    completed = [i for i in in_range if i.get("status") == "completed"]
    cancelled = [i for i in in_range if i.get("status") == "cancelled"]
    
    response_times = []
    for i in completed:
        ca = i.get("created_at")
        co = i.get("completed_at")
        if ca and co:
            try:
                t1 = datetime.datetime.fromisoformat(ca.replace("Z", "+00:00"))
                t2 = datetime.datetime.fromisoformat(co.replace("Z", "+00:00"))
                response_times.append((t2 - t1).total_seconds() / 60)
            except:
                pass
                
    response_times.sort()
    median_time = 0
    if response_times:
        mid = len(response_times) // 2
        if len(response_times) % 2 == 0:
            median_time = (response_times[mid - 1] + response_times[mid]) / 2
        else:
            median_time = response_times[mid]
            
    fridges = list(set(i.get("fridge_id") for i in completed if i.get("fridge_id")))
    
    return {
        "from_date": from_date,
        "to_date": to_date,
        "offers_matched": len(in_range),
        "dispatches_completed": len(completed),
        "dispatches_cancelled": len(cancelled),
        "median_response_minutes": round(median_time, 1),
        "fridges_served": fridges
    }

@tool
def estimate_impact(offers_matched: int, dispatches_completed: int) -> dict:
    """Estimate impact metrics based on completed dispatches."""
    kg_moved = dispatches_completed * 3.5
    meals = kg_moved / 0.4
    
    return {
        "estimated_kg_moved": round(kg_moved, 1),
        "estimated_meals_enabled": math.floor(meals),
        "assumption_notes": "avg_kg_per_dispatch: 3.5 kg, kg_per_meal: 0.4 kg (USDA reference)",
        "offers_matched": offers_matched,
        "dispatches_completed": dispatches_completed
    }

@tool
def render_report(totals: dict, impact: dict, output_format: str = "markdown") -> dict:
    """Render an impact report in markdown and optionally PDF."""
    md = f"""# NeighborNode Impact Report
**Period:** {totals.get('from_date')} to {totals.get('to_date')}
     
## Numbers
| Metric | Value |
|---|---|
| Offers matched | {totals.get('offers_matched', 0)} |
| Dispatches completed | {totals.get('dispatches_completed', 0)} |
| Median response time | {totals.get('median_response_minutes', 0)} min |
| Fridges served | {len(totals.get('fridges_served', []))} |
     
## Estimated Impact
- ~{impact.get('estimated_kg_moved', 0)} kg of food moved
- ~{impact.get('estimated_meals_enabled', 0)} meals enabled
     
*Assumptions: {impact.get('assumption_notes')}*
*This report was generated automatically from the NeighborNode event log.*
"""
    result = {"markdown": md, "pdf_bytes": None}
    
    if output_format == "pdf":
        try:
            import markdown2
            from reportlab.platypus import SimpleDocTemplate, Paragraph
            from reportlab.lib.styles import getSampleStyleSheet
            from io import BytesIO
            
            html = markdown2.markdown(md)
            buf = BytesIO()
            doc = SimpleDocTemplate(buf)
            styles = getSampleStyleSheet()
            flowables = [Paragraph(p, styles['Normal']) for p in html.split('\\n') if p.strip()]
            doc.build(flowables)
            result["pdf_bytes"] = buf.getvalue()
        except Exception as e:
            result["pdf_error"] = str(e)
            
    return result
