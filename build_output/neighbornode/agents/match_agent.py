from strands import Agent
from strands.tools import tool
from neighbornode.skills.match import find_open_offers, score_match, rank_candidates
from neighbornode.prompts.match import MATCH_SYSTEM_PROMPT
from neighbornode.config import settings
import json

_agent = Agent(
    model=f"bedrock:{settings.bedrock_model_id}",
    system_prompt=MATCH_SYSTEM_PROMPT,
    tools=[find_open_offers, score_match, rank_candidates],
)

def run_match_agent(offer_id: str = None, fridge_id: str = None) -> dict:
    """Process match task."""
    payload = {"offer_id": offer_id, "fridge_id": fridge_id}
    response = _agent(json.dumps(payload))
    try:
        return json.loads(str(response))
    except:
        return {"result": str(response)}

@tool
def match_agent_tool(offer_id: str = None, fridge_id: str = None) -> dict:
    """Match open donor offers to fridge needs. Call after intake when a fridge is empty or low."""
    return run_match_agent(offer_id, fridge_id)
