from strands import Agent
from neighbornode.agents.intake_agent import intake_agent_tool
from neighbornode.agents.forecast_agent import forecast_agent_tool
from neighbornode.agents.match_agent import match_agent_tool
from neighbornode.agents.dispatch_agent import dispatch_agent_tool
from neighbornode.agents.report_agent import report_agent_tool
from neighbornode.prompts.orchestrator import ORCHESTRATOR_SYSTEM_PROMPT
from neighbornode.config import settings

orchestrator = Agent(
    model=f"bedrock:{settings.bedrock_model_id}",
    system_prompt=ORCHESTRATOR_SYSTEM_PROMPT,
    tools=[intake_agent_tool, forecast_agent_tool, match_agent_tool, dispatch_agent_tool, report_agent_tool],
)

def process_event(text: str, sender: str = "", channel: str = "sms") -> str:
    """Route an inbound event through the full orchestrator chain."""
    import json
    payload = json.dumps({"text": text, "sender": sender, "channel": channel})
    response = orchestrator(payload)
    return str(response)
