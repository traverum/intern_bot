---
title: "Veyond"
category: entity
tags: [company, travel, posthog, analytics, crew]
sources: [vision, prd_v2]
updated: 2026-04-17
---

# Veyond

Veyond is the travel/hospitality startup that the [Veyond Crew](../concepts/multi_agent_design.md) is being built for. The crew is "AI coworkers, not tools" — a team of named, personality-having Telegram bots that absorb the connective-tissue work of running the company. ([vision](../sources/vision.md), [prd_v2](../sources/prd_v2.md))

> See [`/NORTH_STAR.md`](../../NORTH_STAR.md) for the vision in full.

---

## Domain knowledge

### Core booking model
- **Reservation vs. booking:** These are distinct concepts in Veyond's domain vocabulary. Exact distinction not yet captured — to be extracted into `global_memory/BUSINESS.md`.
- **`hotel_id = null`:** Hotels don't have an ID (or it's null) in some contexts — domain-specific quirk that Kip needs to know.
- **Revenue fields:** Gross revenue and commission are separate fields. When someone asks about revenue, always clarify which they mean.
- **Commission structure:** Veyond earns commission; not all revenue is Veyond's.

### Analytics conventions
- Bookings tracked as `booking_confirmed` (not `order_completed` — migrated early).
- Key named PostHog insights: "Weekly booking digest", "Checkout funnel v3", "Supplier engagement".
- Veyond runs on the EU PostHog region: `https://eu.posthog.com`.
- PostHog project ID: scoped via `x-posthog-project-id` header on MCP requests.
- A **second PostHog project** exists for Traverum platform (hotel-facing analytics) — outside [Kip's](kip.md) scope for now.

### Personas (users in the system)
- Veyond team members — the humans who DM Kip in Telegram.
- Suppliers — appear in analytics (e.g. "top suppliers by bookings").
- (Traverum platform side: hotel-facing metrics — separate project.)

---

## Infrastructure

- **Codebase location:** `/home/hal/projects/veyond_crew`
- **Stack:** Node 22 + TypeScript + grammY + Anthropic SDK + Octokit
- **Process manager:** PM2 (one process hosts the bot)
- **Admin UI:** Port `:3001` — token usage + ops log. Shows MCP tool calls with distinct tag/color (Phase 2+).
- **Secret storage:** `.env` (never committed). Key vars: `KIP_BOT_TOKEN`, `POSTHOG_MCP_API_KEY`, `POSTHOG_PROJECT_ID`.

---

## The crew (current and envisioned)

The vision: six or eight coworkers eventually, each with their own role, voice, and Telegram handle. Humans stay decision-makers; the crew handles the connective tissue. ([vision](../sources/vision.md))

| Agent | Status | Role |
|-------|--------|------|
| [Kip](kip.md) | In development (Phase 1–4) | The intern. PostHog analyst + brain reader. |
| Agent #2 | Planned bootstrap (Phase 4) | TBD role — proves the multi-agent architecture |
| Archivist | Envisioned | Keeps documentation up to date. Brain write access. |
| Ops | Envisioned | Operational tasks. Write access to PostHog (flags, experiments). |
| Supplier-facing | Envisioned | Talks to suppliers. |

Per the [North Star](../../NORTH_STAR.md): "Every choice we make about Kip is really a choice about how the team will work when there are eight of them." The architecture (file-driven agents, per-agent MCP allowlists, shared `global_memory/`) exists to make this feasible.

---

## Related pages
- [Kip](kip.md)
- [Multi-Agent Design](../concepts/multi_agent_design.md)
- [PostHog MCP Integration](../concepts/posthog_mcp.md)
- [Agent Architecture](../concepts/agent_architecture.md)
- [Vision (North Star)](../sources/vision.md)
