---
updated: 2026-04-18
---

# Current State

> What's actively in flight. Updated at the end of every work session via `/wrap-up`.
> Git history of this file = product state over time. Run `git log -p knowledgebase/awareness/current.md` to time-travel.

---

## Where we are

**System prompt now follows OpenClaw's layered model.** Previous session landed PostHog grounding (BUSINESS.md, ANALYTICS_GUIDE.md) — this session fixed a live Kip failure where "search unique visitors and page views for yesterday" went to `brain_search` and returned "nothing in the knowledge base." Root cause: tool-routing rules were crammed into SOUL.md where they competed with personality for attention, and there was no `## Tooling` section telling the model what tools existed in the prompt itself.

Commit `8f372b1` restructures the prompt into hardcoded scaffolding + injected files, following OpenClaw's three-layer separation:

1. **Hardcoded top-of-stable sections** (in [src/agents/buildPrompt.ts](../../src/agents/buildPrompt.ts)): `## Tooling` (generated from live `NormalizedTool[]`), `## Tool Call Style`, `## Execution Bias`, `## Safety`. These are policy, not persona — a user rewriting SOUL.md can't break them.
2. **File-injected `# Project Context`** with preamble telling the model how to weight the files. Order: SOUL → TOOLS → BUSINESS → ANALYTICS_GUIDE → MEMORY (matches OpenClaw's priority map).
3. **Dynamic half below cache boundary**: STATUS.md + single-line Runtime.

**Files authored/scrubbed this session:**
- [agents/kip/TOOLS.md](../../agents/kip/TOOLS.md) (new) — routing rules (metrics → PostHog), known events list.
- [agents/kip/SOUL.md](../../agents/kip/SOUL.md) — scrubbed all tool names out; "Read-only" section removed (now in hardcoded Safety).
- [agents/kip/MEMORY.md](../../agents/kip/MEMORY.md) — populated with concrete seed facts (Kip is first hire, EU host only, clean epoch commit hash, Partner=supplier naming).
- [global_memory/STATUS.md](../../global_memory/STATUS.md) — populated with in-flight caveats (`experience_viewed` PR pending, MCP token not yet provisioned, PostHog tz likely still UTC).

**Wiring changes:**
- `buildPromptString(agentName, tools, mcpServerNames)` — new signature; the prompt now includes a `## Tooling` list built from the actual tools the model will be offered this turn.
- `toolLoop` builds the system prompt internally (it already has the tool list post-`selectTools`); `runAgent` just delegates.
- `admin.ts` updated to pass `tools` + mcp names through when rendering the prompt preview.

---

## What's blocked / waiting

Carried over from last session, unchanged:
- **Widget PR** — `PostHogExperienceViewed` still needs wiring into `apps/widget/src/app/experiences/[experienceSlug]/page.tsx` and `apps/widget/src/app/[hotelSlug]/[experienceSlug]/page.tsx`. Running in the widget repo.
- **Anthropic billing** — still unresolved; the original trigger for the OpenAI path.
- **PostHog MCP auth token** — `POSTHOG_MCP_AUTH_TOKEN` wired but not populated. Required for `TOOL_MODE=mcp`.
- **PostHog project timezone** — still likely UTC. Fix from Kip side once MCP token lands.

New:
- **No live test of the new prompt structure.** Typecheck passes, but nobody has actually sent Kip "search unique visitors yesterday" with the new prompt active. Next session should.

---

## What to build next (ordered)

1. **Live-test the new prompt.** Send Kip the exact failing message ("search unique visitors and page views for yesterday") plus a few other analytics questions. Verify he goes straight to PostHog tools and answers with a number, not a "nothing in the knowledge base" deflection.
2. **Verify the widget PR lands and events fire.** Walk the guest happy path locally (browse → detail → checkout → confirmation) and confirm `$pageview` → `experience_viewed` → `booking_confirmed` are all visible in PostHog EU with `channel` / `hotel_slug` attached.
3. **Get the PostHog MCP API key** and populate `POSTHOG_MCP_AUTH_TOKEN`. Unblocks `TOOL_MODE=mcp` on Anthropic.
4. **Set PostHog project timezone to `Europe/Helsinki`** from Kip side via PostHog MCP.
5. **Smoke-test the 4 Monday questions on Anthropic with `TOOL_MODE=mcp`.**
6. **Write the eval harness** — replayable `evals/posthog/monday.jsonl` with expected tool-call sequences. Baseline both providers.
7. **Phase 3 UX polish** — ack reaction, `/reset`. Not before the eval baseline.

---

## Explicitly deferred (not forgotten, just not now)

Unchanged from last session:
- Local MCP client for provider parity. Rejected; revisit only if OpenAI becomes daily driver.
- More widget events (`checkout_started`, `payment_failed`, `reservation_requested`, identify-at-checkout, `booking_cancelled`). Added only when a real question forces it.
- Backend / supplier / admin capture. Different surface, zero asks yet.
- Internal-traffic filter. Needs IP list or email-domain rule.
- Phase 4 second-agent bootstrap. Architecture is ready; no trigger yet.

New this session:
- **IDENTITY.md, USER.md, AGENTS.md, HEARTBEAT.md.** OpenClaw has them; we don't. Low-value until we have agent #2 or per-user context — skipped intentionally.
- **Sub-agent prompt modes (full/minimal/none).** OpenClaw's pattern; re-evaluate when we spawn our first sub-agent.

---

## Key files touched this session

- [agents/kip/SOUL.md](../../agents/kip/SOUL.md) — tool-name scrub
- [agents/kip/TOOLS.md](../../agents/kip/TOOLS.md) — new file
- [agents/kip/MEMORY.md](../../agents/kip/MEMORY.md) — populated
- [global_memory/STATUS.md](../../global_memory/STATUS.md) — populated
- [src/agents/buildPrompt.ts](../../src/agents/buildPrompt.ts) — full rewrite
- [src/agents/toolLoop.ts](../../src/agents/toolLoop.ts) — builds prompt internally now
- [src/agents/runAgent.ts](../../src/agents/runAgent.ts) — simplified to delegation
- [src/admin.ts](../../src/admin.ts) — updated `buildPromptString` call
- [src/claude/tools.ts](../../src/claude/tools.ts) — reverted `posthog_query` description (known-events list now lives in TOOLS.md)

Commit: `8f372b1 Restructure system prompt along OpenClaw's layered model` (pushed to `main`).
