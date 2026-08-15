# PRD — NeighborNode
**An autonomous agent network for community fridges and mutual-aid pantries**

Status: Draft for Agents for Humans Hackathon (AWS × Strands Agents SDK)
Track: Good Neighbor Agents

---

## 1. Problem

Community fridges and mutual-aid pantries — public refrigerators where anyone can leave or take food, no questions asked — now exist by the hundreds across major cities. They run entirely on volunteer labor and ad-hoc tools: an Instagram post when a fridge goes empty, a group chat to find someone with a car, a shared spreadsheet nobody updates. Three failure modes repeat everywhere:

1. **Empty fridges stay empty.** A host notices a fridge is empty, posts about it, and the post is seen too late or by the wrong people.
2. **Surplus food and empty fridges don't find each other.** A bakery has end-of-day bread; three fridges nearby are empty; nobody makes the connection in the 30–60 minute window before the bread goes stale or the bakery closes.
3. **No one can prove impact.** Organizers applying for a grant, or asking a landlord for permission to keep a fridge on their block, have no numbers — because nothing was ever logged.

None of this is a technology-access problem — organizers are not short on smartphones. It's a coordination-and-memory problem: nobody has time to be the dispatcher, and no dispatcher currently exists in software.

## 2. Why an agent, not an app

A conventional app assumes someone opens it, checks a queue, and acts. Mutual-aid volunteers do not have that time. The product needs to be the opposite of another app to check — it needs to run in the background, notice things, act on them, and only interrupt a human when a judgment call is genuinely required (e.g., "food safety flag on this donation — approve or reject?"). That's the brief this hackathon is built around, and it's also the actual shape of this problem.

## 3. Goals

- **G1** — Cut the average "fridge reported empty → fridge restocked" time.
- **G2** — Convert surplus food that would otherwise go to waste into fridge stock, automatically matched by distance and freshness window.
- **G3** — Remove the dispatcher role from a human volunteer's plate entirely.
- **G4** — Give organizers a standing, exportable record of impact for grant applications and city permit renewals, with zero manual logging.
- **G5** — Never require the people taking food from the fridge to interact with any software.

## 4. Non-goals

- Not a consumer nutrition/recipe app (unrelated "smart fridge" category).
- Not a donation-tax-receipt/accounting platform for large food banks (adjacent, not this problem).
- Not a public map/directory product — several already exist (freedge.org, city-specific fridge maps); NeighborNode assumes a network already exists and instruments its *operations*, not its discovery.
- No PII collection from fridge visitors, ever.

## 5. Personas

| Persona | Who | What they need |
|---|---|---|
| **Fridge Host** | Volunteer responsible for one physical fridge | A near-zero-effort way to report status |
| **Donor** | Bakery, restaurant, home gardener, grocery partner | A near-zero-effort way to offer surplus, confidence it'll be used |
| **Runner (Volunteer)** | Person with a car/bike who restocks | A clear "go here, bring this, by when" instruction |
| **Coordinator** | Unpaid organizer running the network | A live view of the whole system + reports they can hand to a funder |

## 6. Core user stories

- As a **Fridge Host**, I text "EMPTY" to a number and I'm done — I don't open an app.
- As a **Donor**, I text or fill a 10-second form describing what I have and when it needs to move; I get a confirmation when it's been picked up.
- As a **Runner**, I get a text with the donor address, the fridge address, distance, and a suggested route, and I can reply "on it" or "can't."
- As a **Coordinator**, I see a live map of fridge status (stocked / low / empty / flagged) and can generate a report for any date range in one tap.
- As a **Coordinator**, if a donation looks like it might violate food-safety norms (e.g., raw meat, home-canned goods without labeling), the agent holds it for my approval instead of dispatching it automatically.

## 7. Functional requirements (MVP for hackathon submission)

| ID | Requirement | Agent responsible |
|---|---|---|
| FR1 | Parse an inbound SMS/webhook into a structured event (fridge status, donor offer, runner reply) | Intake Agent |
| FR2 | Maintain live status per fridge (stocked/low/empty) with timestamp | Intake Agent |
| FR3 | Score and match open donor offers to open fridge needs by distance, perishability window, and fridge capacity | Match Agent |
| FR4 | Forecast which fridges are likely to go empty soonest, using historical restock cadence | Forecast Agent |
| FR5 | Select the nearest available runner and send a dispatch message with route + manifest | Dispatch Agent |
| FR6 | Hold any donation matching a food-safety exclusion list for human approval before dispatch | Dispatch Agent (guardrail) |
| FR7 | Log every event to a durable store | Orchestrator |
| FR8 | Generate a plain-language, exportable impact report on demand (meals estimated, lbs of food moved, response time) | Report Agent |
| FR9 | Support English + at least one additional language on the SMS intake path | Intake Agent |
| FR10 | Coordinator dashboard shows live fridge map, open donor offers, active dispatches, and a one-click report export | Frontend |

## 8. Success metrics (what the demo proves)

- Time from "EMPTY" text to a dispatched runner: **under 2 minutes** in the live demo.
- A single donor offer correctly matched to the *nearest eligible* fridge, not just the first one, shown against at least two candidate fridges.
- One auto-generated report artifact (PDF/Markdown) with numbers a coordinator could paste directly into a grant application.
- Zero fridge-visitor data collected or displayed anywhere in the system.

## 9. Judging-criteria alignment (internal scoring checklist)

- **Technical Implementation** — multi-agent Strands system (not a single prompt), deployed on Bedrock AgentCore, live demo link.
- **Design** — a real coordinator product (map + queue + report), not just a chat window.
- **Potential Impact** — named, specific, real audience (existing mutual-aid networks); demonstrable time-to-restock improvement.
- **Creativity & Originality** — no existing dedicated agent product for mutual-aid fridge operations (validated by search prior to build).
- **Presentation** — video structured around problem → who → why, agent shown acting autonomously end-to-end.

## 10. Roadmap beyond hackathon (not built now, stated for credibility)

- Voice-call intake for hosts without SMS-capable phones or with literacy barriers.
- WhatsApp channel (dominant in many diaspora communities running fridges).
- Health-department-aligned donation guidelines module, adjustable per city.
- Multi-network federation (a coordinator dashboard across cities for umbrella orgs).
