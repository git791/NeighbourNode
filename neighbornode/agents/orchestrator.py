"""
orchestrator.py — the top-level agent that routes every inbound event.

Two runtime modes (selected by AGENTCORE_AGENT_ID in .env):

1. **Direct Strands mode** (default, local dev + most deployments)
   A regular Strands `Agent` is instantiated with the five specialist agents as tools.
   No extra setup needed beyond `pip install strands-agents`.

2. **AgentCore Runtime mode** (production / persistent memory)
   When AGENTCORE_AGENT_ID is set, the Orchestrator is called via the
   `bedrock-agentcore` SDK client, which adds semantic/summarization memory,
   runtime monitoring, and session management on top of the same agent logic.

   To get an Agent ID:
     pip install bedrock-agentcore
     agentcore create --name neighbornode-orchestrator
     agentcore add memory --name NeighborNodeMemory \\
       --strategies SEMANTIC,SUMMARIZATION
     agentcore deploy
   Then paste the printed Agent ID into .env as AGENTCORE_AGENT_ID.
"""

import json
import logging

from strands import Agent
from neighbornode.agents.intake_agent import intake_agent_tool
from neighbornode.agents.forecast_agent import forecast_agent_tool
from neighbornode.agents.match_agent import match_agent_tool
from neighbornode.agents.dispatch_agent import dispatch_agent_tool
from neighbornode.agents.report_agent import report_agent_tool
from neighbornode.prompts.orchestrator import ORCHESTRATOR_SYSTEM_PROMPT
from neighbornode.config import settings

logger = logging.getLogger(__name__)

# ── Direct Strands Agent (always built — used as fallback or primary) ─────────

_strands_orchestrator = Agent(
    model=f"bedrock:{settings.bedrock_model_id}",
    system_prompt=ORCHESTRATOR_SYSTEM_PROMPT,
    tools=[
        intake_agent_tool,
        forecast_agent_tool,
        match_agent_tool,
        dispatch_agent_tool,
        report_agent_tool,
    ],
)

# ── AgentCore client (built only when AGENTCORE_AGENT_ID is configured) ──────

_agentcore_client = None

if settings.agentcore_agent_id:
    try:
        from bedrock_agentcore import AgentCoreClient  # type: ignore[import]
        _agentcore_client = AgentCoreClient(agent_id=settings.agentcore_agent_id)
        logger.info(f"AgentCore Runtime enabled — agent_id={settings.agentcore_agent_id}")
    except ImportError:
        logger.warning(
            "AGENTCORE_AGENT_ID is set but bedrock-agentcore is not installed. "
            "Falling back to direct Strands mode. "
            "Install it with: pip install bedrock-agentcore"
        )
    except Exception as exc:
        logger.warning(f"AgentCore client init failed ({exc}). Falling back to direct Strands mode.")


# ── public entry point ────────────────────────────────────────────────────────

def process_event(text: str, sender: str = "", channel: str = "sms") -> str:
    """
    Route an inbound event through the full orchestrator chain.

    Uses the AgentCore Runtime if AGENTCORE_AGENT_ID is set (persistent memory,
    runtime monitoring), otherwise falls back to direct Strands Agent invocation.

    Args:
        text:    The raw inbound text (SMS body, form submission, etc.)
        sender:  E.164 phone number, email, or identifier of the sender.
        channel: 'sms' | 'webform' | 'dashboard' — helps the Intake Agent classify context.

    Returns:
        The orchestrator's final string response (for logging; real side-effects
        happen through tool calls inside the chain).
    """
    payload = json.dumps({"text": text, "sender": sender, "channel": channel})

    if _agentcore_client is not None:
        try:
            logger.info("Invoking via AgentCore Runtime")
            response = _agentcore_client.invoke(
                input_text=payload,
                session_id=sender or "default",   # one session per sender phone/email
            )
            return str(response)
        except Exception as exc:
            logger.error(f"AgentCore invocation failed ({exc}). Falling back to direct Strands.")

    logger.info("Invoking via direct Strands Agent")
    response = _strands_orchestrator(payload)
    return str(response)
