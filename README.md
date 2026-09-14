# NeighborNode

**An autonomous agent network that keeps community fridges stocked — so organizers stop being full-time dispatchers.**

Built for the [Agents for Humans Hackathon](https://agentsforhumans.devpost.com/) (Good Neighbor Agents track) with the [Strands Agents SDK](https://strandsagents.com/) on AWS.

---

## The problem

Community fridges — public refrigerators where anyone can leave or take food, no questions asked — now run in the hundreds across cities like New York, Philadelphia, Los Angeles, Toronto, and Austin. They work because they reject bureaucracy: no forms, no eligibility checks, no gatekeeping.

That same simplicity is what breaks behind the scenes. Every fridge is kept alive by a volunteer **Host**, an ad-hoc network of **Donors**, and whoever happens to see an Instagram post asking for a restock. There is no dispatcher. When a fridge goes empty, it usually *stays* empty until someone happens to notice, happens to have food, and happens to have time — all three, at once, by chance.

NeighborNode is the dispatcher that doesn't exist yet. It doesn't replace the fridge, the hosts, or the donors — it just does the noticing, matching, and routing that currently falls through the cracks, and stays completely invisible to the person who just needs a meal.

---

## What it does — end to end

1. A **Fridge Host** texts "EMPTY" (or anything that means the same thing — the Intake Agent understands free text in English and Spanish, and resolves fridge nicknames like "5th st fridge" to their database ID).
2. The **Orchestrator** receives the SMS via API Gateway → Lambda, runs it through the Intake Agent to classify and structure it, then chains to the **Match Agent**.
3. The **Match Agent** finds nearby open donor offers from DynamoDB, scores each one by distance, food freshness window, and fridge capacity — and returns a ranked list with a machine-readable score breakdown.
4. The **Dispatch Agent** runs a hard-coded food-safety exclusion check (raw meat, unlabeled home-canned goods, alcohol, expired items). If the offer passes, it finds the nearest available **Runner** and sends an SMS via Amazon Pinpoint: pickup address, dropoff address, what to bring, and a Google Maps route link. If the offer is flagged, or if it's from a first-time unverified donor, it is written to a `needs_approval` queue — never auto-dispatched.
5. The **Coordinator** sees everything live on a React dashboard: a map of all fridge statuses, the approval queue with one-tap approve/reject, active dispatches, and open donor offers. They can generate a funder-ready **impact report** (Markdown or PDF) for any date range in one click — no manual spreadsheet.
6. The **Forecast Agent** runs on an EventBridge schedule every 2 hours, scanning every fridge's historical event cadence to predict which ones are likely to go empty before anyone reports it. This proactive pass is the one piece with no analogue in any existing fridge tool.

No one taking food from a fridge ever touches this system. It only communicates with Hosts, Donors, Runners, and the Coordinator.

---

## Personas and their surfaces

| Persona | Who | How they interact with NeighborNode |
|---|---|---|
| **Fridge Host** | Volunteer managing one physical fridge | Texts any status update (free text, English or Spanish) to the Pinpoint number. Can also use the Host view in the dashboard to update fridge count. |
| **Donor** | Bakery, restaurant, home gardener, grocery partner | Texts a donation offer or fills the Donor form in the dashboard. First-time donors are held for Coordinator verification. |
| **Runner** | Volunteer with a car or bike who restocks | Receives SMS dispatch with route and manifest. Replies "ON IT" or "CANT". Can check their active deliveries in the Runner view. |
| **Coordinator** | Unpaid organizer running the network | Dashboard: live map, approval queue, active dispatches, report export. The only human the system interrupts — and only when a guardrail fires. |

---

## Architecture

```
SMS / Web form
      │
      ▼
API Gateway (HTTP API)
      │
      ├── POST /inbound    → WebhookFunction (Lambda)
      ├── POST /offer      → ActionFunction  (Lambda)
      ├── POST /fridge/*   → ActionFunction  (Lambda)
      ├── POST /approve    → ApprovalFunction (Lambda)
      ├── POST /reject     → ApprovalFunction (Lambda)
      ├── GET  /dashboard  → DashboardFunction (Lambda)
      ├── GET  /report     → DashboardFunction (Lambda)
      └── POST /auth/*     → AuthFunction (Lambda) → Amazon Cognito
                │
                ▼
       ┌────────────────────┐
       │    Orchestrator    │  ← Strands Agent (Nova Lite)
       │  (agents-as-tools) │     routes by LLM reasoning,
       └─────────┬──────────┘     not hardcoded if/else
  ┌──────────────┼──────────────┬────────────────┬──────────────┐
  ▼              ▼              ▼                ▼              ▼
Intake        Forecast        Match          Dispatch        Report
Agent          Agent          Agent           Agent           Agent
(Nova Micro)  (Nova Micro)  (Nova Lite)    (Nova Lite)    (Nova Lite)
  │              │              │                │              │
  └──────────────┴──────────────┴────────────────┴──────────────┘
                                │
                                ▼
              DynamoDB (single-table, PK/SK design)
              fridges | donors | offers | runners
              dispatches | events | approvals

EventBridge (rate: 2h) ──────────────────► SchedulerFunction → Forecast Agent

Frontend (React + Vite)
  ├── Coordinator view: live map + approval queue + report modal
  ├── Host view: fridge status panel + crate count update
  ├── Donor view: donation form + donor leaderboard
  └── Runner view: active dispatches + delivery completion
           │
           ▼
  VITE_API_BASE_URL → API Gateway base URL
```

Deployed via **AWS SAM** (`template.yaml`); models served through **Amazon Bedrock (Nova Micro / Nova Lite)**; optional runtime deployment via **Amazon Bedrock AgentCore Runtime**; messaging via **Amazon Pinpoint SMS**; storage via **DynamoDB single-table**; compute via **Lambda + EventBridge Scheduler**; frontend hosting via **S3 + CloudFront**.

---

## Agent system — how the five agents wire together

The Orchestrator is a Strands `Agent` whose *tools are the other agents* (agents-as-tools pattern). When an inbound event arrives at `POST /inbound`, the Lambda calls `process_event()`, which passes the raw JSON to the Orchestrator. The Orchestrator reads the event content and decides which tool to call — no hardcoded routing switch.

### Orchestrator
- **Model:** Nova Lite (reasoning needed for ambiguous routing, e.g. a text that is both a status update and a complaint)
- **Tools:** `intake_agent_tool`, `forecast_agent_tool`, `match_agent_tool`, `dispatch_agent_tool`, `report_agent_tool`
- **Default chain for a fridge-empty event:** intake → match → dispatch
- **Stops and logs** if intake confidence < 0.5 or type = unknown; does not guess

### 1 — Intake Agent
- **Model:** Nova Micro (classification task, low token cost)
- **Skills:** `parse_inbound_message`, `resolve_entity`, `translate_message`, `log_event`
- Classifies free text into `status_update | donor_offer | runner_reply | unknown`
- Fuzzy-matches fridge nicknames and donor names to known DynamoDB entity IDs (string match first, Bedrock fallback for low-confidence cases)
- Handles Spanish input by translating on the way in/out — no separate pipeline
- Writes a structured event to DynamoDB via `log_event`

### 2 — Forecast Agent
- **Model:** Nova Micro
- **Skills:** `get_status_history`, `predict_empty_window`, `log_event`
- Triggered by **EventBridge every 2 hours** (SchedulerFunction) — the only agent that runs on a clock, not a webhook
- Reads each fridge's 30-day event history from DynamoDB; computes average interval between empty events
- Returns `{fridge_id, predicted_empty_within_hours, confidence, reasoning}` per fridge
- Requires ≥ 5 historical empty events for a reliable prediction; reports low confidence otherwise

### 3 — Match Agent
- **Model:** Nova Lite (judgment needed for close ties and conflicting freshness windows)
- **Skills:** `find_open_offers`, `score_match`, `rank_candidates`
- Queries DynamoDB for open offers within a configurable radius (default 10 km)
- **Deterministic scoring:** distance (40%) + freshness window remaining (40%) + fridge capacity status (20%)
- Returns a score breakdown per candidate — the UI uses this for the "why this match" tooltip
- LLM only intervenes on close ties the numbers cannot resolve

### 4 — Dispatch Agent
- **Model:** Nova Lite
- **Skills:** `check_safety_exclusion`, `find_nearest_available_runner`, `build_manifest`, `send_sms`, `queue_for_approval`, `log_event`
- **Hard guardrail (deterministic code, not model-decided):** `check_safety_exclusion` checks `config/food_safety_exclusions.json` — any match writes to the approval queue and stops; no dispatch message ever goes out
- **Soft guardrail (model-assisted):** first-time unverified donors are held for one Coordinator confirmation; reason is always stated in plain language in the queue
- Builds a human-readable manifest: pickup address, drop address, food description, freshness window, Google Maps route link
- Sends SMS via Amazon Pinpoint; updates dispatch status as the runner replies

### 5 — Report Agent
- **Model:** Nova Lite
- **Skills:** `aggregate_events`, `estimate_impact`, `render_report`
- Reads dispatch records from DynamoDB; computes offers matched, dispatches completed, median empty→restocked time, fridges served
- Converts raw counts to funder-legible estimates (kg moved, meals enabled) using documented USDA conversion ratios — always shown alongside the raw numbers, never in place of them
- Renders Markdown or PDF (via `reportlab` + `markdown2`)
- Called on demand from `GET /report?from=YYYY-MM-DD&to=YYYY-MM-DD&format=markdown|pdf`

---

## Backend → frontend integration

All backend endpoints are defined in `template.yaml` (AWS SAM) and served through a single API Gateway HTTP API. The frontend reads `VITE_API_BASE_URL` from `frontend/.env.local`; when that variable is unset the frontend automatically falls back to mock data so the UI can be previewed without a deployed backend.

| Frontend action | API call | Lambda handler | Agent/skill invoked |
|---|---|---|---|
| Dashboard load (polls every 15 s) | `GET /dashboard` | `DashboardFunction` | `get_dashboard_state()` (shared skill, reads DynamoDB directly) |
| User sign up / register | `POST /auth/register` | `AuthFunction` | Calls Cognito `SignUp` |
| Email verification | `POST /auth/confirm` | `AuthFunction` | Calls Cognito `ConfirmSignUp` |
| User sign in | `POST /auth/signin` | `AuthFunction` | Calls Cognito `InitiateAuth` (USER_PASSWORD_AUTH flow) |
| Profile update | `PUT /auth/profile` | `AuthFunction` | Calls Cognito `UpdateUserAttributes`, syncs to DynamoDB |
| Host marks fridge empty | `POST /fridge/empty` | `ActionFunction` | Updates DynamoDB status |
| Host marks fridge low | `POST /fridge/low` | `ActionFunction` | Updates DynamoDB status |
| Host updates crate count | `POST /fridge/update` | `ActionFunction` | Sets status to empty/low/stocked based on count |
| Donor submits offer | `POST /offer` | `ActionFunction` | Saves offer; runs `check_safety_exclusion`; queues for approval if flagged |
| Coordinator approves item | `POST /approve` | `ApprovalFunction` | Marks approved in DynamoDB; triggers `run_dispatch_agent` |
| Coordinator rejects item | `POST /reject` | `ApprovalFunction` | Marks rejected in DynamoDB; logs event |
| Coordinator generates report | `GET /report` | `DashboardFunction` | `aggregate_events` → `estimate_impact` → `render_report` (direct, no LLM) |
| Inbound SMS | `POST /inbound` | `WebhookFunction` | Full Orchestrator chain: intake → match → dispatch |
| Runner completes delivery | `POST /dispatch/complete` | `ActionFunction` | Marks dispatch completed in DynamoDB |

### Key integration highlights

- **Cognito Auth Integration:** The dashboard is secured by a free-tier Amazon Cognito User Pool. The `AuthFunction` Lambda handles registration (with role/transport selection), email confirmation, sign-in, and profile updates. User progress (donations, deliveries) is synced to DynamoDB.
- **Runner Auto-Retry:** If a runner replies "CANT" to an SMS, the `webhook_handler` immediately intercepts it and triggers `retry_dispatch`. The system finds the next nearest available runner and attempts dispatch up to 3 times before queuing it for the Coordinator.
- **PDF Generation Layer:** The SAM template now automatically provisions a Lambda Layer containing `reportlab` and `markdown2`, allowing the Report Agent to generate and return downloadable PDF impact reports from the `/report` endpoint.
- **AgentCore Memory Wiring:** The `Orchestrator` agent checks for `AGENTCORE_AGENT_ID`. If set, it seamlessly routes events through the `AgentCoreClient` to leverage persistent `SEMANTIC` and `SUMMARIZATION` memory and per-sender sessions, while maintaining a smooth fallback to the direct Strands Agent if not configured.
- **Dashboard Forecast Integration:** The Forecast Agent's predictions are written to DynamoDB and successfully surfaced on the Coordinator dashboard via `get_dashboard_state()`.

---


## Data model (DynamoDB, single table)

| Entity | PK | SK | Key attributes |
|---|---|---|---|
| User | `USER#<sub>` | `META` | `cognito_sub`, `role`, `display_name`, `donation_count`, `delivery_count` |
| Fridge | `FRIDGE#<id>` | `META` | `name`, `address`, `lat`, `lng`, `capacity`, `status`, `last_restocked_at`, `host_phone` |
| Status event | `FRIDGE#<id>` | `EVENT#<iso-ts>` | `event_type`, `status`, `raw_text`, `source` |
| Donor | `DONOR#<id>` | `META` | `name`, `address`, `lat`, `lng`, `phone`, `channel`, `verified` |
| Offer | `DONOR#<id>` | `OFFER#<iso-ts>` | `food_type`, `qty_estimate`, `perishability_window_hours`, `status` (`open/matched/flagged/expired`) |
| Runner | `RUNNER#<id>` | `META` | `name`, `phone`, `lat`, `lng`, `availability`, `active_dispatch_id`, `transport` |
| Dispatch | `DISPATCH#<id>` | `META` | `offer_id`, `fridge_id`, `runner_id`, `status`, `created_at`, `completed_at` |
| Approval | `APPROVAL#<id>` | `META` | `item_type`, `item_id`, `reason`, `status` (`pending/approved/rejected`), `coordinator_note` |
| Report snapshot | `REPORT#<range>` | `META` | `offers_matched`, `lbs_moved`, `avg_response_minutes` |
| Forecast | `FORECAST#<fridge_id>` | `<iso-ts>` | `predicted_empty_within_hours`, `confidence`, `reasoning` |

---

## Repository structure

```
NeighborNode/
├── neighbornode/               # Python package — the agent system
│   ├── agents/                 # Strands Agent wrappers (one file per agent)
│   │   ├── orchestrator.py     # Routes events; tools = the five agents below
│   │   ├── intake_agent.py     # Parses/classifies inbound SMS; fuzzy entity resolve
│   │   ├── forecast_agent.py   # Predicts empty windows from historical cadence
│   │   ├── match_agent.py      # Scores donor-offer × fridge pairs deterministically
│   │   ├── dispatch_agent.py   # Builds manifest + SMS + food-safety guardrail
│   │   └── report_agent.py     # Aggregates events, renders Markdown/PDF report
│   ├── skills/                 # @tool functions (deterministic + LLM hybrid)
│   │   ├── intake.py           # parse_inbound_message, resolve_entity, translate_message
│   │   ├── forecast.py         # get_status_history, predict_empty_window
│   │   ├── match.py            # find_open_offers, score_match, rank_candidates
│   │   ├── dispatch.py         # check_safety_exclusion, find_nearest_available_runner,
│   │   │                       #   build_manifest, send_sms, queue_for_approval
│   │   ├── report.py           # aggregate_events, estimate_impact, render_report
│   │   └── shared.py           # log_event, get_dashboard_state
│   ├── prompts/                # System prompts for each agent
│   ├── config.py               # Pydantic settings — reads .env
│   ├── db.py                   # DynamoDB helpers: get / put / query / scan / update
│   └── local_runner.py         # CLI: seed DynamoDB + fire demo event locally
│
├── lambda/                     # Lambda entry points (thin HTTP adapters)
│   ├── webhook_handler.py      # POST /inbound → Orchestrator chain
│   ├── action_handler.py       # POST /offer  /fridge/*  /dispatch/complete
│   ├── approval_handler.py     # POST /approve  /reject
│   ├── dashboard_handler.py    # GET  /dashboard  /report
│   └── scheduler_handler.py    # EventBridge trigger → Forecast Agent per fridge
│
├── frontend/                   # React + Vite coordinator dashboard
│   ├── src/
│   │   ├── App.jsx             # Root: role-based view switching
│   │   ├── api/
│   │   │   ├── client.js       # fetch wrappers for all API endpoints; mock fallback
│   │   │   └── mockData.js     # Realistic seed data used when API URL is unset
│   │   ├── hooks/
│   │   │   ├── useDashboardState.js   # Polls GET /dashboard every 15 s
│   │   │   └── useApprovalQueue.js    # approve/reject with loading + error state
│   │   └── components/
│   │       ├── LoginPage.jsx          # Role selector (host/donor/runner/coordinator)
│   │       ├── Map.jsx                # Fridge status map
│   │       ├── Queue.jsx              # Approval queue + active dispatches
│   │       ├── DataStrip.jsx          # Summary stats bar
│   │       ├── ReportModal.jsx        # Date-range picker → GET /report → download
│   │       ├── HostPage.jsx           # Host: fridge selector + crate count update
│   │       ├── DonorForm.jsx          # Donor: donation offer form
│   │       ├── RunnerPage.jsx         # Runner: active deliveries + complete button
│   │       └── ...                    # Supporting components
│   └── .env.local              # VITE_API_BASE_URL (not committed)
│
├── config/
│   └── food_safety_exclusions.json    # Hard-coded safety exclusion rules
│
├── data/
│   └── seed_demo.json          # 4 fridges, 3 donors, 2 runners, 2 offers, 1 demo event
│
├── template.yaml               # AWS SAM: DynamoDB + 5 Lambda fns + API Gateway + EventBridge
├── requirements.txt            # strands-agents, boto3, geopy, pydantic-settings,
│                               # reportlab, markdown2
├── AGENTS.md                   # Agent mandates, model choices, guardrail spec
├── SKILLS.md                   # @tool function signatures and ownership
├── TECHNICAL.md                # Architecture deep-dive, data model, cost table
└── PRD.md                      # Product requirements, personas, success metrics
```

---

## Setup — local development

### Prerequisites
- Python 3.11+
- AWS account with Bedrock model access enabled (Nova Micro + Nova Lite in `us-east-1`)
- AWS CLI configured (`aws configure`)
- Node 18+ (for the frontend)

### 1. Clone and install

```bash
git clone <repo-url>
cd NeighborNode

python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Minimum required for local runs:
#   AWS_REGION=us-east-1
#   DYNAMODB_TABLE_NAME=NeighborNodeTable
#   BEDROCK_MODEL_ID=amazon.nova-lite-v1
#   BEDROCK_MODEL_ID_MICRO=amazon.nova-micro-v1
```

### 3. Create the DynamoDB table

```bash
aws dynamodb create-table \
  --table-name NeighborNodeTable \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 4. Seed data and run the demo

```bash
# Seed fridges, donors, runners, and offers into DynamoDB:
python -m neighbornode.local_runner --seed data/seed_demo.json --seed-only

# Fire the full orchestrator chain with the demo event:
python -m neighbornode.local_runner --seed data/seed_demo.json

# Or pass a custom event:
python -m neighbornode.local_runner --seed data/seed_demo.json \
  --event "Crown st fridge dead again"
```

### 5. Run the frontend (works without a backend)

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
# All dashboard views work with mock data when VITE_API_BASE_URL is not set
```

---

## Setup — deploy to AWS

### Deploy the backend (AWS SAM)

```bash
# Build the PDF Lambda Layer first (installs reportlab + markdown2 into layer/)
# On Windows:
powershell -ExecutionPolicy Bypass -File scripts\build_layer.ps1
# On macOS/Linux:
bash scripts/build_layer.sh

sam build

# First deploy (guided):
sam deploy --guided
# Parameters:
#   PinpointAppId              — Pinpoint Application ID (or leave blank)
#   PinpointOriginationNumber  — E.164 phone number
#   CoordinatorPhone           — E.164 number for approval notifications

# Copy ApiBaseUrl from the deploy output
```

### Deploy the frontend

```bash
cd frontend
# Create frontend/.env.local:
echo "VITE_API_BASE_URL=https://<your-api-id>.execute-api.us-east-1.amazonaws.com" > .env.local

npm run build
aws s3 sync dist/ s3://<your-bucket> --delete
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

### Optional — deploy to Bedrock AgentCore Runtime

```bash
pip install bedrock-agentcore
agentcore create --name neighbornode-orchestrator
agentcore add memory --name NeighborNodeMemory --strategies SEMANTIC,SUMMARIZATION
agentcore deploy
# Copy the Agent ID to AGENTCORE_AGENT_ID in .env
```

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AWS_REGION` | Yes | Region for Bedrock / DynamoDB / Pinpoint (`us-east-1` required for Nova models) |
| `DYNAMODB_TABLE_NAME` | Yes | DynamoDB table name (`NeighborNodeTable`) |
| `BEDROCK_MODEL_ID` | Yes | Nova Lite — Orchestrator, Match, Dispatch, Report agents |
| `BEDROCK_MODEL_ID_MICRO` | Yes | Nova Micro — Intake and Forecast agents |
| `PINPOINT_APP_ID` | SMS only | Pinpoint Application ID |
| `PINPOINT_ORIGINATION_NUMBER` | SMS only | E.164 originating phone number |
| `COORDINATOR_PHONE` | Guardrails | E.164 number for approval-needed notifications |
| `FOOD_SAFETY_EXCLUSION_LIST` | Yes | Path to `config/food_safety_exclusions.json` |
| `SUPPORTED_LANGUAGES` | Yes | Comma-separated BCP 47 codes, e.g. `en,es` |
| `AGENTCORE_AGENT_ID` | No | AgentCore agent ID (optional, for production runtime) |
| `LOG_LEVEL` | No | `DEBUG` for full Strands traces; `INFO` for demo runs |

Frontend only (`frontend/.env.local`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API Gateway base URL from `sam deploy`. When unset, mock data is used. |

---

## How the guardrails work

Two conditions pause the autonomous chain and write to the Coordinator's approval queue — everything else runs unattended:

1. **Food-safety exclusion list match.** `check_safety_exclusion()` in `neighbornode/skills/dispatch.py` is deterministic code — it reads `config/food_safety_exclusions.json` and blocks dispatch if any pattern matches. A hallucinated "this is fine" is unacceptable here, so this check is intentionally boring and not model-decided.

2. **First-time unverified donor.** The Dispatch Agent checks `donor.verified` before building a manifest. Unverified first-time donors are held via `queue_for_approval()` with a plain-language reason. Subsequent offers from verified donors flow automatically.

Every queued item includes a human-readable `reason` — enforced at the schema level: `queue_for_approval()` raises `ValueError` if `reason` is blank. Nothing is ever flagged with a bare "flagged."

---

## Cost model (hackathon / demo scale)

| Service | Expected demo usage | Cost |
|---|---|---|
| Bedrock (Nova Micro / Lite) | < 500 short calls during build + demo | ~\$0, covered by credits |
| AgentCore Runtime | Low-duration sessions during demo | Covered by \$200 + \$50 credit |
| DynamoDB | < 1 GB, on-demand | \$0 (always-free 25 GB tier) |
| Lambda | < 10K invocations | \$0 (always-free 1M req/mo) |
| Pinpoint SMS sandbox | Demo numbers only | \$0 (sandbox) |
| S3 + CloudFront | Static dashboard | \$0 (always-free tier) |
| EventBridge Scheduler | 1 rule, fires every 2 h | \$0 (free tier) |

---

## Technical stack quick reference

| Layer | Choice |
|---|---|
| Agent framework | Strands Agents SDK (Python, Apache 2.0) |
| Orchestration pattern | Agents-as-tools — Orchestrator's tools are the specialist agents |
| Models | Nova Micro (Intake, Forecast) · Nova Lite (Orchestrator, Match, Dispatch, Report) |
| Agent runtime | Amazon Bedrock AgentCore Runtime (optional) |
| Messaging | Amazon Pinpoint SMS + API Gateway webhook |
| Data store | DynamoDB single-table (PK/SK) |
| Compute | AWS Lambda (Python 3.13) |
| Scheduling | Amazon EventBridge Scheduler (`rate(2 hours)`) |
| Infrastructure as code | AWS SAM (`template.yaml`) |
| Observability | Strands OpenTelemetry hooks → CloudWatch X-Ray |
| Frontend | React 18 + Vite |
| Geo math | `geopy` (deterministic, no hallucination risk) |
| PDF generation | `reportlab` + `markdown2` |

---

## License

MIT — see `LICENSE`.

---

## Team / hackathon submission notes

Built during the Agents for Humans Hackathon submission window (Aug 10 – Sep 14, 2026).  
Track: Good Neighbor Agents.
