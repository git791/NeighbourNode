# NeighborNode

**An autonomous agent network that keeps community fridges stocked — so organizers stop being full-time dispatchers.**

Built for the [Agents for Humans Hackathon](https://agentsforhumans.devpost.com/) (Good Neighbor Agents track) with the [Strands Agents SDK](https://strandsagents.com/) on AWS.

---

## The motive

Community fridges — public refrigerators where anyone can leave food or take food, no questions asked — now run in the hundreds across cities like New York, Philadelphia, Los Angeles, Toronto, and Austin. They work because they reject bureaucracy: no forms, no eligibility checks, no gatekeeping.

That same simplicity is what breaks behind the scenes. Every fridge is kept alive by a volunteer host, an ad-hoc network of donors, and whoever happens to see an Instagram post asking for a restock. There is no dispatcher. When a fridge goes empty, it usually *stays* empty until someone happens to notice, happens to have food, and happens to have time — all three, at once, by chance.

NeighborNode is the dispatcher that doesn't exist yet. It doesn't replace the fridge, the hosts, or the donors — it just does the noticing, matching, and routing that currently falls through the cracks, and stays completely invisible to the person who just needs a meal.

## What it does

1. A **fridge host** texts "EMPTY" (or anything that means the same thing — the agent understands free text).
2. The system finds the nearest **open donor offer** (a bakery's end-of-day bread, a home garden's surplus, a grocery partner) that fits the fridge's remaining capacity and the food's freshness window.
3. It dispatches the nearest available **runner** with a text: pickup address, dropoff address, what to bring, suggested route.
4. It quietly logs everything, and on request generates a funder-ready **impact report** — no manual spreadsheet, ever.
5. Anything that needs a judgment call (a food-safety flag, a first-time donor) is held for a human **Coordinator** to approve — everything else runs unattended.

No one taking food from a fridge ever touches this system. It only talks to the people keeping the fridge running.

## Why this problem, and why now

We looked for an existing dedicated agent product for mutual-aid fridge operations before building this and didn't find one — the closest things in the market are (a) personal "what's in my fridge" recipe apps, an unrelated category, and (b) static crowd-sourced fridge maps, which solve discovery, not operations. This gap, combined with a real, growing, technically underserved volunteer network, is why we built here instead of in an already-crowded category like inbox triage or invoicing agents.

## Architecture

```
        SMS / webhook
              │
              ▼
      API Gateway + Lambda
              │
              ▼
   ┌─────────────────────┐
   │     Orchestrator      │  (Strands Agent, routes by reasoning, not if/else)
   └──────────┬────────────┘
   ┌──────────┼───────────┬─────────────┬───────────────┐
   ▼          ▼            ▼             ▼               ▼
Intake    Forecast       Match        Dispatch         Report
Agent      Agent         Agent         Agent            Agent
   │          │            │             │               │
   └──────────┴─────┬──────┴─────────────┴───────┬───────┘
                     ▼                            ▼
               DynamoDB (event log,        Coordinator Dashboard
               fridges/donors/runners)     (S3 + CloudFront)
```

Full detail: [`TECHNICAL.md`](./TECHNICAL.md) · Agent-by-agent spec: [`AGENTS.md`](./AGENTS.md) · Tool-by-tool spec: [`SKILLS.md`](./SKILLS.md) · Product requirements: [`PRD.md`](./PRD.md) · Visual design system: [`frontend-design.md`](./frontend-design.md)

Deployed via **Amazon Bedrock AgentCore Runtime**; models served through **Amazon Bedrock (Nova Micro/Lite)**; messaging via **Amazon Pinpoint SMS**; storage via **DynamoDB**; compute glue via **Lambda + EventBridge**. Every service used sits inside AWS's Always Free tier or the hackathon's promotional credit — see the cost table in `TECHNICAL.md`.

## Setup

### Prerequisites
- AWS account with Bedrock model access enabled (Nova Micro/Lite)
- AWS CLI configured
- Python 3.11+
- An AWS Builder ID (required for hackathon submission)

### Local development

```bash
git clone <repo-url>
cd neighbornode
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Configure AWS credentials and region
export AWS_REGION=us-east-1

# Run the orchestrator locally against seed data
python -m neighbornode.local_runner --seed data/seed_demo.json
```

### Deploy to AWS

```bash
pip install strands-agents bedrock-agentcore

# Provision DynamoDB tables, Lambda handlers, API Gateway routes
cd infra && cdk deploy

# Deploy the agent runtime to Bedrock AgentCore
agentcore create --name neighbornode-orchestrator
agentcore add memory --name NeighborNodeMemory --strategies SEMANTIC,SUMMARIZATION
agentcore deploy

# Deploy the coordinator dashboard
cd ../frontend && npm install && npm run build
aws s3 sync dist/ s3://<your-bucket> && aws cloudfront create-invalidation ...
```

### Environment variables

| Variable | Purpose |
|---|---|
| `AWS_REGION` | Region for Bedrock/DynamoDB/Pinpoint |
| `PINPOINT_ORIGINATION_NUMBER` | Sandbox SMS number for demo |
| `FOOD_SAFETY_EXCLUSION_LIST` | Path to the hard-coded exclusion config |
| `SUPPORTED_LANGUAGES` | e.g. `en,es` |

## Bottom-up technical explanation

Start from the bottom and build up — this is the order the system actually gets exercised in, and the order that makes the design decisions legible:

1. **The data layer (DynamoDB).** Everything the system knows lives in one table, keyed so that a fridge's identity and its full event history sit next to each other (`FRIDGE#<id>` partition, `EVENT#<timestamp>` sort key). This means the Report Agent never needs a separate analytics pipeline — it queries the same table everything else writes to.

2. **The tools (`SKILLS.md`).** Above the data layer sit small, single-purpose functions — `find_open_offers`, `score_match`, `check_safety_exclusion`, `send_sms`. Each is independently testable and, critically, each is *deterministic where determinism matters* (distance math, the safety exclusion check) and only hands off to the model where judgment is genuinely required.

3. **The agents (`AGENTS.md`).** Each agent is a Strands `Agent` wrapping a cluster of related tools with a narrow system prompt. An agent's job is to decide *which* tool to call and *how to interpret* an ambiguous input — not to reimplement logic the tools already handle deterministically.

4. **The orchestrator.** A Strands agent whose tools are the other agents ("agents as tools"). It routes inbound events by reasoning about the event content, not a hardcoded switch statement — this is the layer that lets a message like "5th st fridge dead again 😩" get correctly routed to the Intake Agent, resolved to the right fridge ID, and turned into a status update, without anyone writing a regex for it.

5. **The runtime (AgentCore).** The orchestrator and its tool-agents are deployed to Bedrock AgentCore Runtime, which gives the system a durable session per active dispatch cycle (via AgentCore Memory) and full trace observability — so every autonomous decision in the demo video can be shown, not just claimed.

6. **The surfaces.** Two: an SMS channel (hosts, donors, runners — zero app installs) and a coordinator dashboard (map, approval queue, one-click reports). Everything below this layer exists to make these two surfaces feel instant and trustworthy.

## License

MIT — see `LICENSE`.

## Team / hackathon submission notes

Built during the Agents for Humans Hackathon submission window (Aug 10 – Sep 14, 2026). See `PRD.md` §9 for how this submission maps to each judging criterion.
