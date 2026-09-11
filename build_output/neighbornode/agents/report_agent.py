from strands import Agent
from strands.tools import tool
from neighbornode.skills.report import aggregate_events, estimate_impact, render_report
from neighbornode.prompts.report import REPORT_SYSTEM_PROMPT
from neighbornode.config import settings
import json

_agent = Agent(
    model=f"bedrock:{settings.bedrock_model_id}",
    system_prompt=REPORT_SYSTEM_PROMPT,
    tools=[aggregate_events, estimate_impact, render_report],
)

def run_report_agent(from_date: str, to_date: str, output_format: str = "markdown") -> dict:
    """Process report task."""
    payload = {"from_date": from_date, "to_date": to_date, "output_format": output_format}
    response = _agent(json.dumps(payload))
    try:
        return json.loads(str(response))
    except:
        return {"result": str(response)}

@tool
def report_agent_tool(from_date: str, to_date: str, output_format: str = "markdown") -> dict:
    """Generate impact reports. Call when the request is for a report."""
    return run_report_agent(from_date, to_date, output_format)
