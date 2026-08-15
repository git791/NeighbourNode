# Frontend Design System — NeighborNode

## 0. Research notes (why this direction, not a default)

AI-generated product design in 2026 clusters hard around three looks: warm-cream-plus-terracotta-serif, near-black-plus-neon-accent, or broadsheet-hairline-newspaper. None of them are wrong in general — they're just defaults, reached for regardless of subject. This brief has a subject with an unusually specific, real visual world, so we grounded the system in it instead.

**What the actual world of community fridges looks like:** hand-painted enamel doors, often muraled by local artists in flat, high-saturation color blocks; hand-lettered signs ("take what you need, leave what you can") in paint marker or chalk; stacked plastic milk crates as informal shelving and signage; cardboard and wheat-paste flyers for donation drives; screenprinted zine-style mutual-aid posters designed to be legible in sunlight, from a distance, reproduced cheaply. Design guidance for this exact genre of grassroots/activist visual work explicitly recommends a disciplined 3–5 color system with assigned roles (primary/support/neutral/highlight) and typography that "feels public, not precious" — legible over polish.

That's the brief we designed to: **a system that reads as civic infrastructure on the ops side, and as a hand-painted neighborhood object on anything public-facing** — not a generic SaaS dashboard, and not a cosplay of protest-poster aesthetics either.

## 1. Color — 6 named tokens

| Token | Hex | Role | Source in the real world |
|---|---|---|---|
| `enamel` | `#EDEFEA` | Background (ops surfaces) | Fridge steel-enamel white, slightly cool rather than warm-cream |
| `chalkboard` | `#1E2420` | Primary text / ink | Chalkboard-paint black-green used on hand-lettered fridge signs, not pure black |
| `crate-green` | `#2F6B4F` | Primary brand / stocked state | The specific green of stacked plastic milk crates used to shelve donations |
| `flag-red` | `#E4531F` | Urgent / empty state | Hand-painted hazard-orange-red used on "URGENT" fridge signage |
| `dispatch-blue` | `#2C5A82` | Runner / logistics layer | Utility-van blue, distinct register from the food-side greens/reds |
| `marigold` | `#E7A93C` | Donor / abundance highlight | Warm paint-marker gold used across mutual-aid flyer accents |

**Why this avoids the defaults:** no cream-plus-terracotta pairing (we shifted the neutral cooler and swapped the accent to a green pulled from an actual object in this world, not a generic "warm" brand color), no near-black-plus-neon (our dark tone is a specific desaturated chalkboard tone, and there is no single neon accent — there are five roled colors doing distinct jobs), no broadsheet hairlines (structure comes from crate-like blocking, described below, not newspaper rules).

**Assignment discipline (borrowed directly from activist-design practice):** primary = `crate-green` (default/calm/stocked), support = `dispatch-blue` (logistics, never used for status), neutral = `enamel`/`chalkboard`, highlight = `marigold` (donor actions only), alert = `flag-red` (empty/urgent only — never decorative). No token is used outside its assigned role anywhere in the product.

## 2. Typography — 3 roles

| Role | Typeface | Why |
|---|---|---|
| Display | **Big Shoulders** (variable, condensed) | Originally drawn from Chicago civic signage and building lettering — literally a public-infrastructure typeface, not a poster-cliché face like Anton/Bebas. Used only for status words (EMPTY / STOCKED / LOW) and section headers, in caps, tightly tracked — the one place we let type get loud. |
| Body | **Public Sans** | The U.S. Web Design System's own open-source typeface, built specifically for civic/government digital services. Thematically exact for a civic-infrastructure product, and more distinctive in this context than a default humanist sans like Inter or Söhne. Used for all body copy, labels, and the SMS-preview components. |
| Utility / data | **IBM Plex Mono** | For anything numeric or log-like — timestamps, distances, the dispatch manifest, report tables. Plex was designed to carry an engineering/documentation register, which is exactly the tone the ops-side data views need against the warmer public-facing surfaces. |

**Scale (base 16px):** Display 56/40/28px (hero status / section head / card head), Body 16/14px, Utility 13px monospace, all set with generous line-height (1.4+) for one-hand mobile reading — hosts and runners are reading these on a phone, often outdoors.

## 3. Layout concept — two registers, one system

The product has a real duality: a public/host/donor-facing register (should feel like the fridge itself — direct, warm, low-friction) and a coordinator ops register (should feel like a dispatch board — dense, legible, fast to scan). Rather than pick one aesthetic and stretch it over both, we designed two registers sharing one token system, switched by context, not by user preference.

**Street register** (SMS previews, public status page, donor/runner confirmation screens):

```
┌──────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← flag-red block, full-bleed
│  EMPTY                            │     Big Shoulders, 56px caps
│  5th & Alder Fridge                │
│                                    │
│  a runner is on the way            │  Public Sans, 16px
│  ~12 min                           │
└──────────────────────────────────┘
```
Full-bleed color blocks (not cards with borders/shadows), big single-word status, minimal chrome — reads like a hand-painted sign photographed and put on a screen, not like a SaaS notification.

**Ops register** (Coordinator dashboard):

```
┌─────────────┬──────────────────────────────────────────┐
│  MAP          │  QUEUE                                    │
│               │  ▸ needs approval (1)   flag-red dot       │
│  [●][●][●]    │    Home-canned jam — 5th & Alder            │
│   fridge      │    reason: unlabeled home preserve          │
│   dots,       │    [ approve ] [ reject ]                   │
│   colored by  │  ─────────────────────────────────────      │
│   status      │  ▸ in progress (3)      dispatch-blue        │
│               │    Bakery → Crown St · runner: J. · 8 min    │
│               │  ─────────────────────────────────────      │
│               │  ▸ stocked (11)          crate-green         │
├─────────────┴──────────────────────────────────────────┤
│  IBM Plex Mono data strip: 14 fridges · 92% uptime this wk│
└──────────────────────────────────────────────────────────┘
```
Dense two-pane layout, monospace data strip along the bottom (deliberately unstyled/utilitarian, like a manifest printout), status communicated by the assigned color role, never by icon alone (accessibility — see §5).

## 4. Signature element: the crate stack

The one memorable element, spent deliberately in a single place: fridge fullness is shown as a **literal stack of crate glyphs** filling up (□□□■■■■, five simple stacked-rectangle units) instead of a circular progress ring or percentage bar — because that's what actually happens at a real fridge: donations are stacked in crates until it's full. It appears exactly twice: on the street-register public status page, and as the fridge icon on the ops map. Everywhere else in the product stays quiet and disciplined around it, per the "spend your boldness in one place" principle — no gradients, no shadows, no rounded-glass cards competing for attention.

## 5. Motion

Minimal and functional only: the crate stack animates filling up (one crate per confirmed restock, ~200ms ease-out) — the single orchestrated moment in the product. Status color transitions (flag-red → crate-green on the map) cross-fade over 300ms. No ambient motion, no hover-triggered decoration, no page-load choreography — the audience is often reading this outdoors, one-handed, and extra motion reads as noise, not delight, in that context. Reduced-motion preference disables the crate-fill animation and uses an instant state swap instead.

## 6. Accessibility

- Status is never color-only: every status token pairs with a word (EMPTY/LOW/STOCKED) and, on the map, a distinct dot pattern (solid/half/hollow) so color-blind users aren't relying on hue alone.
- Minimum contrast: `chalkboard` on `enamel` = AAA; `flag-red`/`crate-green`/`dispatch-blue` all checked at AA-large minimum for text use, reserved for backgrounds/blocks rather than small text where contrast is tighter.
- Touch targets on the street register sized for outdoor, one-handed, possibly-gloved use: 48px minimum.
- SMS-first design means the "real" product for hosts/donors/runners has no visual UI at all — the design system's job there is to make the confirmation *web page* (for those who tap the link) feel like a continuation of the text, not a context switch.

## 7. Do / Don't

**Do:** use `flag-red` only for the empty/urgent state, keep the ops register data-dense and unglamorous, let the crate-stack be the only playful element, set status words in Big Shoulders caps every time.

**Don't:** introduce a second display face, use `marigold` for anything except donor-side actions, add card shadows/gradients to the ops dashboard, animate anything beyond the crate-fill and the color cross-fade, or ever put a real fridge-visitor identity anywhere in either register.
