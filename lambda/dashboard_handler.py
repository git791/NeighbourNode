"""
Dashboard handler — serves live coordinator dashboard state and on-demand reports.

GET /dashboard  → returns {fridges, offers, dispatches, approvals}
GET /report?from=YYYY-MM-DD&to=YYYY-MM-DD&format=markdown|pdf
"""
import json
import logging
import os
import sys
import base64

sys.path.insert(0, "/var/task")

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))


def handler(event, context):
    path = event.get("rawPath", event.get("path", "/dashboard"))
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    params = event.get("queryStringParameters") or {}

    try:
        if "/dashboard" in path:
            return _handle_dashboard()
        elif "/report" in path:
            return _handle_report(params)
        else:
            return _response(404, {"error": "Not found"})
    except Exception as exc:
        logger.exception("Dashboard handler error")
        return _response(500, {"error": str(exc)})


def _handle_dashboard():
    from neighbornode.skills.shared import get_dashboard_state
    state = get_dashboard_state()
    return _response(200, state)


def _handle_report(params: dict):
    from neighbornode.skills.report import aggregate_events, estimate_impact, render_report
    
    from_date = params.get("from", "")
    to_date = params.get("to", "")
    fmt = params.get("format", "markdown")
    
    if not from_date or not to_date:
        return _response(400, {"error": "Missing 'from' and/or 'to' query parameters (YYYY-MM-DD)"})
    
    totals = aggregate_events(from_date=from_date, to_date=to_date)
    impact = estimate_impact(
        offers_matched=totals.get("offers_matched", 0),
        dispatches_completed=totals.get("dispatches_completed", 0),
    )
    report = render_report(totals=totals, impact=impact, output_format=fmt)
    
    if fmt == "pdf" and report.get("pdf_bytes"):
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/pdf",
                "Content-Disposition": f"attachment; filename=neighbornode-report-{from_date}-{to_date}.pdf",
                "Access-Control-Allow-Origin": "*",
            },
            "body": base64.b64encode(report["pdf_bytes"]).decode(),
            "isBase64Encoded": True,
        }
    
    return _response(200, {"markdown": report.get("markdown", ""), "totals": totals, "impact": impact})


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body),
    }
