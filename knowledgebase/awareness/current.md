---
updated: 2026-04-18
---

# Current State

> What's actively in flight. Updated at the end of every work session via `/wrap-up`.
> Git history of this file = product state over time. Run `git log -p knowledgebase/awareness/current.md` to time-travel.

---

## Where we are

**Phase 1 architectural foundations are done.** `src/agents/`, `src/gateway/telegram.ts`, `agents/kip/` — all wired. Provider abstraction (`src/providers/`) lets Kip run on Anthropic *or* OpenAI, selected by `LLM_PROVIDER`. `TOOL_MODE=local|mcp` switches between hand-rolled PostHog tools and Anthropic's MCP connector.

**Phase 0 — PostHog grounding — is where we spent this session.** Before touching tool access, we fixed the two gaps that were actually hurting Kip:

1. **Instrumentation gaps in the widget** (what events exist). Only `$pageview` and `booking_confirmed` existed; two of the four Monday-morning questions the team asks couldn't be answered. Scope defined; widget repo is wiring `PostHogExperienceViewed` into two detail-page routes. Super-properties (`channel`, `hotel_config_id`, `hotel_slug`, `hotel_name`) were already in `PostHogHotelContext` — no work needed there.
2. **Grounding docs** (what the events mean). [`global_memory/BUSINESS.md`](../../global_memory/BUSINESS.md) and [`global_memory/ANALYTICS_GUIDE.md`](../../global_memory/ANALYTICS_GUIDE.md) are both fully rewritten. Kip now has channels, commission split, the 3 real events, 7 pitfalls (Helsinki tz, multi-currency, `$revenue` = gross, clean PostHog epoch), and a playbook for the 4 Monday questions.

**Architectural decision: two tool paths, not a local MCP client.** Anthropic uses PostHog MCP via the native connector; OpenAI uses the hand-rolled local tools as a fallback; we accept answer-quality drift between providers. See [two-posthog-tool-paths](decisions/2026-04-18-two-posthog-tool-paths.md).

---

## What's blocked / waiting

- **Widget PR** — `PostHogExperienceViewed` needs wiring into `apps/widget/src/app/experiences/[experienceSlug]/page.tsx` and `apps/widget/src/app/[hotelSlug]/[experienceSlug]/page.tsx`. Running in the widget repo.
- **Anthropic billing** — still unresolved; the original trigger for the OpenAI path.
- **PostHog MCP auth token** — `POSTHOG_MCP_AUTH_TOKEN` wired through `config`; not yet populated. Required for `TOOL_MODE=mcp`.
- **PostHog project timezone** — needs to be set to `Europe/Helsinki` (currently probably UTC). Will do this from Kip side via PostHog MCP once the token lands.

Nothing else is blocked on our side.

---

## What to build next (ordered)

1. **Verify the widget PR lands and events fire.** Walk the guest happy path locally (browse → detail → checkout → confirmation) and confirm `$pageview` → `experience_viewed` → `booking_confirmed` are all visible in PostHog EU with `channel` / `hotel_slug` attached.
2. **Get the PostHog MCP API key** (MCP Server preset, scoped to the Veyond project). Populate `POSTHOG_MCP_AUTH_TOKEN` in `.env`. This unblocks `TOOL_MODE=mcp` on Anthropic.
3. **Set PostHog project timezone to `Europe/Helsinki`** — once the MCP key is in, do this from Kip side (`project-update` or equivalent MCP tool). Verify `tz` in responses aligns with Helsinki local.
4. **Smoke-test the 4 Monday questions on Anthropic with `TOOL_MODE=mcp`:**
   - Widget visitors yesterday / today
   - Unique visitors
   - Which hotels drive the most traffic (group `$pageview` by `hotel_slug`, filter `channel='white-label'`)
   - Which experiences get the most interest (group `experience_viewed` by `experience_title`)
5. **Write the eval harness** — turn those 4 questions into a replayable `evals/posthog/monday.jsonl` with expected tool-call sequences. Run against Anthropic (MCP) and OpenAI (local) to baseline both and make drift visible.
6. **Phase 3 UX polish** (roadmap Phase 3) — ack reaction, `/reset`, SOUL.md tuning for 1–3 line replies. Not before the eval baseline; don't tune prompts without a metric.

---

## Explicitly deferred (not forgotten, just not now)

- **Local MCP client for provider parity.** Rejected this session. Revisit only if OpenAI becomes the daily driver or a second agent's PostHog needs diverge. See [decision](decisions/2026-04-18-two-posthog-tool-paths.md).
- **More widget events** — `checkout_started`, `payment_failed`, `reservation_requested`, identify-at-checkout, `booking_cancelled`. Each added only when a real question forces it. See [posthog-instrumentation-v1](decisions/2026-04-18-posthog-instrumentation-v1.md).
- **Backend / supplier / admin capture.** Different surface, different instrumentation story, zero asks yet.
- **Internal-traffic filter.** Needs an IP list or email-domain rule. Kip caveats low-volume answers in the meantime.
- **Phase 4 second-agent bootstrap.** Architecture is ready; no trigger to build agent #2 yet.

---

## Key files touched this session

- [`global_memory/BUSINESS.md`](../../global_memory/BUSINESS.md) — full rewrite
- [`global_memory/ANALYTICS_GUIDE.md`](../../global_memory/ANALYTICS_GUIDE.md) — full rewrite
- `knowledgebase/awareness/decisions/` — three new decision files:
  - [posthog-instrumentation-v1](decisions/2026-04-18-posthog-instrumentation-v1.md)
  - [two-posthog-tool-paths](decisions/2026-04-18-two-posthog-tool-paths.md)
  - [perfecting-posthog-plan](decisions/2026-04-18-perfecting-posthog-plan.md)
- `knowledgebase/wiki/` — see [log.md](../wiki/log.md) entry for 2026-04-18
