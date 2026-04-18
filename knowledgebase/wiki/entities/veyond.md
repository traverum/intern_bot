---
title: "Veyond"
category: entity
tags: [company, travel, posthog, analytics, crew]
sources: [vision, prd_v2]
updated: 2026-04-18
---

# Veyond

Veyond is a **booking platform for local experiences** — tours, tastings, rentals, activities. Suppliers list experiences, guests book and pay, the platform earns commission. Operated by **Traverum** (the parent company); Veyond is the product. ([vision](../sources/vision.md), [prd_v2](../sources/prd_v2.md))

> Full business context for Kip (and any other agent): [`global_memory/BUSINESS.md`](../../../global_memory/BUSINESS.md). That's the source of truth. This page is the high-level wiki view.
> Vision in full: [`/NORTH_STAR.md`](../../NORTH_STAR.md).

---

## Business model

Commission-based. Every booking splits three ways:

- **Platform (Traverum): 8%**
- **Hotel: ~12%** on white-label (default; distribution-configurable)
- **Supplier: the rest**

Direct bookings skip the hotel cut. No subscription, no markup. Guest pays the experience price; commission comes out before settlement.

---

## Two distribution channels

| Channel | What it is | In events |
|---|---|---|
| White-label | Veyond widget embedded on a hotel's website (guest sees hotel branding) | `channel = 'white-label'`, `hotel_config_id` set |
| Direct | Veyond-branded storefront at `/experiences/*` | `channel = 'direct'`, `hotel_config_id = ''` |

Super-properties (`channel`, `hotel_config_id`, `hotel_slug`, `hotel_name`) are attached to every PostHog event automatically by `PostHogHotelContext`. Group by these to answer channel- or hotel-level questions.

---

## Core nouns

| Noun | What it is |
|---|---|
| Experience | An activity a supplier offers. `pricing_type='per_person'` → session-based; `per_day` → rental. Same detail page, same events. |
| Session | A scheduled time slot on a per-person experience. |
| Reservation | A booking request — exists before approval/payment. |
| Booking | A confirmed, paid (or card-guaranteed) reservation. |
| Partner | Database name for a supplier. Events expose this as `supplier_id`. |
| Distribution | A hotel + experience pairing with its commission split. |
| Hotel | Reseller embedding the widget. Invisible to the guest. |
| Guest | The traveler who books. |

---

## Personas and surfaces

| Persona | Surface | App |
|---|---|---|
| Guest | Widget (browse + book) | `apps/widget` |
| Supplier | Dashboard | `apps/dashboard` |
| Hotel / receptionist | Receptionist widget | `apps/dashboard` subset |
| Platform admin | Admin app | `apps/admin` |

All surfaces share one API layer (`apps/widget/src/app/api/`). **Only `apps/widget` emits PostHog events today** — supplier, hotel, admin, and backend actions are invisible to analytics. That's by design for now; expand only when a real question forces it.

---

## Analytics — what's captured today

Minimal on purpose. Only three events:

| Event | Fires when |
|---|---|
| `$pageview` | Any widget page nav |
| `experience_viewed` | Experience detail page mount (v1, wiring in progress in widget PR) |
| `booking_confirmed` | Confirmation page mount |

Plus the four super-properties above on every event. Detail in [`global_memory/ANALYTICS_GUIDE.md`](../../../global_memory/ANALYTICS_GUIDE.md).

### Pitfalls worth knowing
- **Timezone: Europe/Helsinki.** The team thinks in Helsinki local; PostHog's project tz should match.
- **`$revenue` is gross**, not commission. Platform take is ~8% of it (+ hotel cut on white-label).
- **Multi-currency.** `currency` is per-experience — never sum `total_cents` across bookings without filtering or grouping by currency.
- **Clean PostHog epoch** at commit `1d787d0`. No data before that.
- **No internal-traffic filter** yet — team browsing inflates counts.
- **Identity is cookie-level** until checkout submits email; `person_profiles: 'identified_only'`.

### What's not tracked (deliberate gaps)
- `checkout_started`, `payment_failed`, `reservation_requested`, `booking_cancelled`.
- Any supplier-dashboard, admin, or backend event.
- Commission realization (pay-on-site settlement).

Each is unblocked-on-demand when a real question forces it. See [posthog-instrumentation-v1 decision](../../awareness/decisions/2026-04-18-posthog-instrumentation-v1.md).

### Out of scope
- A **second PostHog project** exists for Traverum platform (hotel-facing analytics) — outside Kip's scope for now. See [Open Question #2](../open_questions.md).

---

## Infrastructure

- **Codebase location:** `C:\Users\elias\projects\veyond_crew` (this repo — the crew).
- **Product codebase:** separate repo — `apps/widget` (guest), `apps/dashboard` (supplier + receptionist), `apps/admin` (platform admin).
- **Stack (crew):** Node 22 + TypeScript + grammY + Anthropic/OpenAI SDKs + Octokit.
- **Process manager:** PM2.
- **Admin UI:** port `:3001` — token usage + ops log.
- **PostHog:** EU host `https://eu.posthog.com`.
- **Secret storage:** `.env` (never committed). Key vars: `TELEGRAM_BOT_TOKEN`, `LLM_PROVIDER`, `LLM_MODEL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_MCP_AUTH_TOKEN`, `TOOL_MODE`.

---

## The crew (current and envisioned)

| Agent | Status | Role |
|---|---|---|
| [Kip](kip.md) | In development | The intern. PostHog analyst + brain reader. |
| Agent #2 | Planned (Phase 4) | TBD — proves the multi-agent architecture. |
| Archivist | Envisioned | Keeps documentation up to date. Brain write access. |
| Ops | Envisioned | Operational tasks. PostHog writes (flags, experiments). |
| Supplier-facing | Envisioned | Talks to suppliers. |

Per the [North Star](../../NORTH_STAR.md): "Every choice we make about Kip is really a choice about how the team will work when there are eight of them."

---

## Related pages
- [Kip](kip.md)
- [BUSINESS.md](../../../global_memory/BUSINESS.md) — full business context
- [ANALYTICS_GUIDE.md](../../../global_memory/ANALYTICS_GUIDE.md) — how Kip reads the numbers
- [PostHog Tool Access](../concepts/posthog_mcp.md)
- [Multi-Agent Design](../concepts/multi_agent_design.md)
- [Vision (North Star)](../sources/vision.md)
