# Agents — NeighborNode

Five agents, one orchestrator. Each agent is a Strands `Agent` with a narrow mandate, its own tools, and — where a wrong autonomous call would cause real-world harm — a guardrail that stops and asks a human.

---

## Orchestrator

**Mandate:** Route every inbound event to the right specialist agent, in the right order, and decide when to interrupt a human.

**Model:** Nova Lite (needs enough reasoning to route ambiguous inputs — e.g., a text that's part status update, part complaint — without a rigid schema).

**System prompt (intent, abridged):**
> You are the coordination layer for a community fridge and mutual-aid network. You never talk to end users directly. Given an inbound event, decide which specialist agent(s) to invoke and in what order. Default to full autonomy. Only surface a decision to the human Coordinator when a guardrail agent flags it, or when no specialist can confidently classify the event. Prefer one clear action over asking a clarifying question.

**Tools:** `intake_agent`, `forecast_agent`, `match_agent`, `dispatch_agent`, `report_agent`

---

## 1. Intake Agent

**Mandate:** Turn messy, human-written SMS/webhook text into a structured event.

**Inputs:** raw text, sender phone number, channel metadata
**Outputs:** `{type: status_update | donor_offer | runner_reply, entity_id, fields...}`

**Why it needs an LLM, not regex:** hosts don't text in a fixed format — "empty again :(", "5th st fridge dead", "nada left at the crown st one" all mean the same thing. The agent resolves free text to a known fridge/donor/runner ID using fuzzy matching against the registry, and asks the Orchestrator to hold for clarification only if confidence is low.

**Multilingual note:** the same agent handles a configurable second language (e.g., Spanish) by translating on the way in and out — no separate pipeline.

---

## 2. Forecast Agent

**Mandate:** Predict which fridges are likely to go empty soonest, so restocking can be proactive instead of purely reactive.

**Inputs:** historical status-event cadence per fridge (day-of-week, time-of-day patterns), current status
**Outputs:** ranked list of `{fridge_id, predicted_empty_within_hours, confidence}`

**Trigger:** scheduled (EventBridge, every 2 hours) rather than event-driven — this is the one agent that runs on a clock, not a webhook.

**Why this matters for the pitch:** every existing fridge tool is purely reactive (someone reports empty, then something happens). Forecasting is the one piece with no analogue in any tool we found in the field — it's the clearest "non-obvious use" the Creativity criterion is asking for.

---

## 3. Match Agent

**Mandate:** Given an open donor offer (or a fridge predicted to go empty), find the best pairing.

**Scoring inputs:** distance (donor↔fridge, and fridge↔available runners), perishability window on the offer, fridge remaining capacity, whether the fridge already has an incoming match.

**Outputs:** ranked candidate matches with a machine-readable score breakdown (for the dashboard's "why this match" tooltip — a Design-criterion detail, not just a black box).

**Deterministic core, LLM edge:** the distance/capacity scoring is plain code (fast, auditable, no hallucination risk). The LLM layer only handles judgment calls the numbers can't, e.g. weighing "this offer expires in 20 minutes but is further away" against "this offer expires in 3 hours but is closer."

---

## 4. Dispatch Agent

**Mandate:** Turn a match into an actual instruction to a real person, and hold anything that needs a human sign-off.

**Guardrail (hard-coded, not model-decided):** any offer whose `food_type` matches an exclusion list (raw meat, unlabeled home-canned goods, alcohol, anything past its stated safe window) is written to a `needs_approval` queue and never auto-dispatched. The Coordinator dashboard surfaces these with one-tap approve/reject.

**Guardrail (soft, model-assisted):** a brand-new, unverified donor's first-ever offer is held for one confirmation; the agent explains *why* it's holding, in plain language, in the Coordinator's queue.

**Outputs:** SMS to the selected Runner with fridge address, donor address, food description, and a suggested route link; updates dispatch status as the Runner replies.

---

## 5. Report Agent

**Mandate:** Turn the event log into language a funder, city official, or landlord can use, with no manual data entry by the Coordinator.

**Inputs:** date range
**Outputs:** a short narrative + a numbers table (offers matched, estimated lbs of food moved, median empty→restocked time, fridges served), exported as Markdown/PDF.

**Design constraint:** never invents numbers. If the underlying event log doesn't support a claim (e.g., exact meal counts), the agent states an estimate range and shows its assumption, rather than presenting a false-precision figure — this is a deliberate trust decision or the reports lose credibility with the funders they're built for.

---

## Cross-cutting guardrail principles

1. **Autonomy is the default; interruption is the exception.** Every agent is written to complete its job silently unless a specific, named condition fires.
2. **Every held-for-approval item states its reason in plain language** in the Coordinator queue — never a bare "flagged" with no explanation.
3. **No agent ever messages a fridge visitor.** The system's entire surface area is hosts, donors, runners, and the Coordinator.
