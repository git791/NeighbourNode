from strands import Agent
from strands.tools import tool
from neighbornode.skills.forecast import get_status_history, predict_empty_window
from neighbornode.skills.shared import log_event
from neighbornode.prompts.forecast import FORECAST_SYSTEM_PROMPT
from neighbornode.config import settings
import json

_agent = Agent(
    model=f"bedrock:{settings.bedrock_model_id_micro}",
    system_prompt=FORECAST_SYSTEM_PROMPT,
    tools=[get_status_history, predict_empty_window, log_event],
)

def run_forecast_agent(fridge_id: str = None) -> dict:
    """Process forecast task."""
    payload = {"fridge_id": fridge_id} if fridge_id else {"action": "forecast_all"}
    response = _agent(json.dumps(payload))
    try:
        return json.loads(str(response))
    except:
        return {"result": str(response)}

@tool
def forecast_agent_tool(fridge_id: str = None) -> dict:
    """Predict which fridges will go empty. Call after intake for status updates."""
    return run_forecast_agent(fridge_id)
