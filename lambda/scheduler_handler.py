"""
Scheduler handler — triggered by EventBridge every 2 hours.
Runs the Forecast Agent against every active fridge in DynamoDB.
"""
import json
import logging
import os
import sys

sys.path.insert(0, "/var/task")

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))


def handler(event, context):
    """Lambda entry point for EventBridge scheduled trigger."""
    try:
        from neighbornode.db import scan_by_status
        from neighbornode.agents.forecast_agent import run_forecast_agent

        fridges = []
        for status in ("stocked", "low", "empty"):
            fridges.extend(scan_by_status("FRIDGE#", status))

        logger.info(f"Running forecast for {len(fridges)} fridges")

        results = []
        for fridge in fridges:
            fridge_id = fridge.get("entity_id", "")
            if not fridge_id:
                continue
            try:
                result = run_forecast_agent(fridge_id=fridge_id)
                results.append(result)
                logger.info(f"Forecast for {fridge_id}: {result}")
            except Exception as exc:
                logger.error(f"Forecast failed for {fridge_id}: {exc}")
                results.append({"fridge_id": fridge_id, "error": str(exc)})

        return {"status": "ok", "forecasts_run": len(results), "results": results}

    except Exception as exc:
        logger.exception("Scheduler error")
        return {"status": "error", "error": str(exc)}
