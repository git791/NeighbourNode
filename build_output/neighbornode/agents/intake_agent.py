from strands import Agent
from strands.tools import tool
from neighbornode.skills.intake import parse_inbound_message, resolve_entity, translate_message
from neighbornode.skills.shared import log_event
from neighbornode.prompts.intake import INTAKE_SYSTEM_PROMPT
from neighbornode.config import settings
import json

_agent = Agent(
    model=f"bedrock:{settings.bedrock_model_id_micro}",
    system_prompt=INTAKE_SYSTEM_PROMPT,
    tools=[parse_inbound_message, resolve_entity, translate_message, log_event],
)

def run_intake_agent(payload: dict) -> dict:
    """Process an inbound message through the Intake Agent."""
    response = _agent(json.dumps(payload))
    try:
        return json.loads(str(response))
    except:
        return {"result": str(response)}

@tool
def intake_agent_tool(payload: dict) -> dict:
    """Parse and classify inbound messages. ALWAYS call this first for any new inbound event."""
    return run_intake_agent(payload)
