from strands import Agent
from strands.tools import tool
from neighbornode.skills.dispatch import check_safety_exclusion, find_nearest_available_runner, build_manifest, send_sms, queue_for_approval
from neighbornode.skills.shared import log_event
from neighbornode.prompts.dispatch import DISPATCH_SYSTEM_PROMPT
from neighbornode.config import settings
import json

_agent = Agent(
    model=f"bedrock:{settings.bedrock_model_id}",
    system_prompt=DISPATCH_SYSTEM_PROMPT,
    tools=[check_safety_exclusion, find_nearest_available_runner, build_manifest, send_sms, queue_for_approval, log_event],
)

def run_dispatch_agent(match: dict) -> dict:
    """Process dispatch task."""
    response = _agent(json.dumps(match))
    try:
        return json.loads(str(response))
    except:
        return {"result": str(response)}

@tool
def dispatch_agent_tool(match: dict) -> dict:
    """Dispatch a runner. Call after match_agent returns a ranked match."""
    return run_dispatch_agent(match)
