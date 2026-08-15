# Skills (Tools) — NeighborNode

Each Strands agent is only as good as the tools it can call. This document specifies every `@tool` function in the system: its signature, what it does, and which agent owns it. "Skill" here means a discrete, testable capability an agent can invoke — the building blocks the Agents in `AGENTS.md` are composed from.

---

## Intake skills

### `parse_inbound_message(text: str, sender: str, channel: str) -> ParsedEvent`
Classifies raw text into `status_update | donor_offer | runner_reply | unknown`, extracts structured fields, and resolves fuzzy entity references (fridge nicknames, donor names) against the registry.
**Owner:** Intake Agent

### `resolve_entity(name_guess: str, entity_type: str) -> str | None`
Fuzzy-matches free text against known fridges/donors/runners; returns an ID or `None` if confidence is below threshold (in which case the Orchestrator holds for clarification).
**Owner:** Intake Agent

### `translate_message(text: str, target_lang: str) -> str`
Thin wrapper over the Bedrock model for inbound/outbound translation, used so the whole pipeline stays language-agnostic rather than forking logic per language.
**Owner:** Intake Agent

---

## Forecast skills

### `get_status_history(fridge_id: str, days: int = 30) -> list[Event]`
Reads the event log for a fridge.
**Owner:** Forecast Agent

### `predict_empty_window(fridge_id: str) -> Prediction`
Simple time-series estimate (day-of-week / hour-of-day cadence) of when a fridge is likely to next go empty, with a confidence score. Deliberately not a heavy ML model — a transparent heuristic that a non-technical Coordinator can sanity-check, wrapped so it can be swapped for something heavier later without changing the agent contract.
**Owner:** Forecast Agent

---

## Match skills

### `find_open_offers(near: LatLng, radius_km: float) -> list[Offer]`
Geo-query for open donor offers near a point (fridge or predicted-empty fridge).
**Owner:** Match Agent

### `score_match(offer: Offer, fridge: Fridge) -> MatchScore`
Deterministic scoring function: distance, perishability window, fridge remaining capacity. Returns a breakdown, not just a single number, so the UI can explain "why this match" (see `frontend-design.md`).
**Owner:** Match Agent

### `rank_candidates(offer: Offer, candidates: list[Fridge]) -> list[MatchScore]`
Sorts scored candidates; the LLM layer above this tool only intervenes on close ties or conflicting time windows.
**Owner:** Match Agent

---

## Dispatch skills

### `check_safety_exclusion(offer: Offer) -> ExclusionResult`
Hard-coded rule check against the food-safety exclusion list. Not model-decided — this is the one skill in the system that is intentionally boring, deterministic code, because a hallucinated "this is fine" is unacceptable here.
**Owner:** Dispatch Agent (guardrail)

### `find_nearest_available_runner(near: LatLng) -> Runner | None`
Geo + availability query.
**Owner:** Dispatch Agent

### `build_manifest(match: MatchScore, runner: Runner) -> Manifest`
Assembles the human-readable dispatch message: pickup address, dropoff address, food description, suggested route link, expiry window.
**Owner:** Dispatch Agent

### `send_sms(to: str, message: str) -> DeliveryResult`
Thin wrapper over Amazon Pinpoint SMS.
**Owner:** Dispatch Agent

### `queue_for_approval(item: dict, reason: str) -> None`
Writes a held item to the Coordinator's approval queue with a required, plain-language `reason` field — enforced at the schema level so nothing is ever flagged without an explanation.
**Owner:** Dispatch Agent (guardrail)

---

## Report skills

### `aggregate_events(date_range: DateRange) -> Totals`
Pulls raw counts from the event log: offers matched, dispatches completed, median response time.
**Owner:** Report Agent

### `estimate_impact(totals: Totals) -> ImpactEstimate`
Converts raw counts into funder-legible estimates (e.g., lbs → approximate meals) using a documented, conservative conversion ratio — always returned alongside the raw numbers, never in place of them.
**Owner:** Report Agent

### `render_report(totals: Totals, impact: ImpactEstimate, format: str) -> bytes`
Produces the exportable Markdown/PDF artifact.
**Owner:** Report Agent

---

## Shared/orchestrator-level skills

### `log_event(entity_id: str, event_type: str, payload: dict) -> None`
Single write path to the event log; every skill above that changes state calls through this, so the Report Agent has one consistent source of truth.

### `get_dashboard_state() -> DashboardState`
Read-only aggregation used by the frontend to render the live map/queue without duplicating query logic client-side.
