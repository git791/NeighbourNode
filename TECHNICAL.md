# Technical Design — NeighborNode

## 1. System overview

NeighborNode is a multi-agent system built on the **Strands Agents SDK**, orchestrated as an "agents-as-tools" graph, deployed to **Amazon Bedrock AgentCore Runtime**. It reacts to three inbound event types (fridge status, donor offer, runner reply) and drives two outbound channels (SMS dispatch, dashboard update), with a background scheduled pass for forecasting and reporting.

```
                         ┌────────────────────────────┐
                         │        Orchestrator          │
                         │   (Strands graph / router)   │
                         └──────────────┬───────────────┘
             ┌───────────────┬──────────┼───────────┬────────────────┐
             ▼               ▼          ▼            ▼                ▼
      ┌────────────┐  ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐
      │  Intake     │  │  Forecast   │ │  Match   │ │ Dispatch   │ │  Report    │
      │  Agent      │  │  Agent      │ │  Agent   │ │ Agent      │ │  Agent     │
      └──────┬──────┘  └──────┬──────┘ └────┬─────┘ └─────┬──────┘ └─────┬──────┘
             │                │              │             │              │
             ▼                ▼              ▼             ▼              ▼
      ┌─────────────────────────────────────────────────────────────────────────┐
      │                          DynamoDB (single-table)                        │
      │      fridges | donors | offers | runners | dispatches | events          │
      └─────────────────────────────────────────────────────────────────────────┘
```

## 2. Tech stack

| Layer | Choice | Why | Cost tier |
|---|---|---|---|
| Agent framework | Strands Agents SDK (Python) | Required by hackathon; open source, model-agnostic | Free (Apache 2.0) |
| Model | Amazon Nova Micro / Lite via Bedrock | Cheapest per-token Bedrock models; sufficient for structured parsing + short generation | AWS Free Tier + $200 new-account credit + $50 hackathon credit |
| Agent runtime | Amazon Bedrock AgentCore Runtime | Serverless agent hosting, explicitly strengthens Technical score per rules | Consumption-based, covered by credits at demo scale |
| Messaging in/out | Amazon Pinpoint SMS (sandbox) / API Gateway webhook | SMS is the lowest-friction channel for hosts/donors/runners who won't install an app | Free tier / sandbox |
| Data store | DynamoDB (on-demand) | Always-free tier (25GB), single-digit-ms reads for live dashboard | AWS Always Free |
| Compute glue | AWS Lambda | Webhook handlers, scheduled forecast/report jobs | AWS Always Free (1M req/mo) |
| Scheduling | Amazon EventBridge Scheduler | Triggers Forecast Agent and daily digest | Free tier |
| Frontend hosting | S3 static site + CloudFront | Coordinator dashboard | Free tier |
| Observability | Strands built-in OpenTelemetry hooks → CloudWatch | Trace every agent decision for demo + debugging | Free tier |

## 3. Data model (DynamoDB, single table, PK/SK design)

| Entity | PK | SK | Key attributes |
|---|---|---|---|
| Fridge | `FRIDGE#<id>` | `META` | name, lat/lng, capacity, status, last_restocked_at |
| Status event | `FRIDGE#<id>` | `EVENT#<ts>` | status (stocked/low/empty), source (sms/host), raw_text |
| Donor | `DONOR#<id>` | `META` | name, lat/lng, channel, verified |
| Offer | `DONOR#<id>` | `OFFER#<ts>` | food_type, qty_estimate, perishability_window, status (open/matched/expired) |
| Runner | `RUNNER#<id>` | `META` | name, phone, lat/lng, availability, active_dispatch_id |
| Dispatch | `DISPATCH#<id>` | `META` | offer_id, fridge_id, runner_id, status, created_at, completed_at |
| Report snapshot | `REPORT#<range>` | `META` | totals: offers matched, lbs moved, avg response time |

Single-table design keeps the whole system inside DynamoDB's always-free 25GB tier for the life of the hackathon and well beyond typical single-city network scale.

## 4. Agent orchestration pattern

Strands supports a model-driven "agent as tool" pattern: the Orchestrator is itself a lightweight Strands agent whose *tools* are the other agents. Routing is done by the LLM reading the inbound event type rather than hardcoded if/else branching — this is the detail that differentiates the system from a plain webhook router and is the core "Technical Implementation" and "Creativity" argument in the submission: the routing, matching, and prioritization decisions are reasoned, not scripted.

```python
from strands import Agent
from strands.tools import tool

@tool
def intake_agent(payload: dict) -> dict: ...

@tool
def forecast_agent(fridge_id: str | None = None) -> dict: ...

@tool
def match_agent(offer_id: str) -> dict: ...

@tool
def dispatch_agent(match: dict) -> dict: ...

@tool
def report_agent(date_range: dict) -> dict: ...

orchestrator = Agent(
    model="bedrock:amazon.nova-lite-v1",
    tools=[intake_agent, forecast_agent, match_agent, dispatch_agent, report_agent],
    system_prompt=ORCHESTRATOR_PROMPT,   # see AGENTS.md
)
```

Each `@tool` function is itself a Strands `Agent` (or a thin deterministic wrapper for cases where determinism matters more than reasoning — e.g., distance math). This hybrid is deliberate: **parsing and judgment calls are LLM-driven; geo-math and guardrail thresholds are deterministic code**, so the system is auditable where it needs to be and flexible where it needs to be.

## 5. Sequence: fridge goes empty → runner dispatched

```
Host --SMS "EMPTY 5th St fridge"--> API GW --> Lambda --> Orchestrator
Orchestrator -> Intake Agent: parse + validate fridge id, write status event
Orchestrator -> Match Agent: query open offers within radius R of fridge
Match Agent -> scores candidates (distance, freshness window, fridge capacity)
Orchestrator -> Dispatch Agent: build manifest for best match
Dispatch Agent -> guardrail check (food-safety exclusion list)
    -> if flagged: write to "needs approval" queue, notify Coordinator, STOP
    -> if clear: select nearest available Runner, send SMS with manifest + route
Runner --SMS "on it"--> Dispatch Agent updates dispatch status
Dispatch Agent -> writes completion event -> Report Agent aggregates on schedule
```

## 6. Guardrails (human-in-the-loop points)

Per Strands' built-in hooks/interrupts, two decisions are never fully autonomous:

1. **Food-safety exclusion list match** (e.g., raw meat, unlabeled home-canned goods, alcohol) → held for Coordinator approval before any dispatch message goes out.
2. **New, unverified donor's first offer** → held for a one-time Coordinator confirmation; subsequent offers from a verified donor flow automatically.

Everything else — matching, routing, forecasting, report drafting — runs unattended, which is the actual point of the product.

## 7. AgentCore deployment

```bash
pip install strands-agents bedrock-agentcore
agentcore create --name neighbornode-orchestrator
agentcore add memory --name NeighborNodeMemory --strategies SEMANTIC,SUMMARIZATION
agentcore deploy
```

AgentCore Runtime hosts the long-running orchestrator session per active dispatch cycle, uses AgentCore Memory for short-term context (e.g., "which offers have already been considered for this fridge in the last hour" to avoid duplicate dispatch attempts), and AgentCore Observability for the trace views shown in the demo video.

## 8. Security & privacy

- No fridge-visitor data is ever collected — the system only tracks hosts, donors, and runners, all of whom opt in.
- Phone numbers stored hashed at rest; raw numbers only held transiently in Lambda memory for the SMS send.
- Coordinator dashboard behind Cognito auth; public status page (if enabled) shows only aggregate fridge state, never PII.

## 9. Free-tier cost model for hackathon build

| Service | Expected demo usage | Cost |
|---|---|---|
| Bedrock (Nova Micro/Lite) | <500 short calls during build+demo | ~$0, covered by credits |
| AgentCore Runtime | Low-duration sessions during demo | Covered by $200 + $50 credit |
| DynamoDB | <1GB, on-demand | $0 (always-free tier) |
| Lambda | <10K invocations | $0 (always-free tier) |
| Pinpoint SMS sandbox | Demo numbers only | $0 (sandbox) |
| S3 + CloudFront | Static dashboard | $0 (always-free tier) |

Total expected spend: **$0 out of pocket**, comfortably inside AWS's standing free tier plus the hackathon's $50 credit.
