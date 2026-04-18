---
title: "PRD v2 — Veyond Crew"
category: source
tags: [prd, architecture, kip, posthog, mcp, roadmap]
sources: [prd_v2]
updated: 2026-04-17
---

# PRD v2 — Veyond Crew

**File:** `raw/prd_v2_veyond_crew.md`
**Date ingested:** 2026-04-17
**Status:** Active — current architecture doc. v2 replaces hand-rolled PostHog tools with MCP.

---

## What this document is

The foundational product requirements document for [Veyond Crew](../entities/veyond.md) — specifically for building [Kip](../entities/kip.md) (agent #1) in a way that scales to a full multi-agent crew. Scoped to a 4–5 week horizon. Authored as an internal draft.

The v2 change from v1: PostHog integration moves to PostHog's official hosted MCP server via Anthropic's MCP connector, replacing 6 hand-rolled tools.

---

## Key claims and extracts

### Purpose and north star
> "Build a team of AI agents that help run Veyond. Each agent is a Telegram bot backed by Claude, with its own persona, its own toolbelt, and access to shared company memory."

North star:
> "Anyone at Veyond can ask Kip a product analytics question in Telegram — solo DM, team group chat, or via a scheduled cron — and get an accurate, well-framed answer in under 30 seconds, in Kip's voice."

### Guiding principles (priority-ordered)
1. Files over code — personality and memory are markdown files, not code constants.
2. Buy, don't build — use official MCP servers rather than hand-rolling vendor integrations.
3. Decouple from Telegram — `runAgent(agentName, chatId, userMessage) → reply` is pure; Telegram is one caller.
4. One writer to shared memory — global memory is injected at startup, not mutated mid-conversation.
5. Cache boundary from day one — stable content above, dynamic below.
6. Scale through composition, not abstraction — add agents by adding folders, not by building frameworks.
7. Explicit allowlists over category globs — list tools by name; don't accept what a vendor adds silently.

### Current state (before refactor)
- Stack: Node 22 + TypeScript + grammY + Anthropic SDK + Octokit.
- 6 hand-rolled PostHog tools (to be deleted).
- System prompt is a 3,000-word hardcoded `.ts` constant.
- Sessions: JSONL at `data/sessions/kip/<chatId>.jsonl`.
- Admin UI on `:3001`.
- Model: `claude-sonnet-4-6` (EU PostHog host: `https://eu.posthog.com`).

### Gaps driving the refactor
| Gap | Impact |
|-----|--------|
| Prompt in code, not files | Can't add agent #2 without duplicating infrastructure |
| Hand-rolled PostHog tools | 6 tools covering a fraction of PostHog; PostHog MCP has 150+ |
| No ack reaction | 10–20s silence during tool loops |
| No cache boundary | Full prompt re-tokenized every turn |
| Telegram/agent logic tangled | Can't add cron gateway without surgery |
| Global memory inside Kip prompt | Won't survive multi-agent |

### Target file structure
See [Agent Architecture](../concepts/agent_architecture.md) for the full breakdown.

### PostHog MCP
See [PostHog MCP Integration](../concepts/posthog_mcp.md) for the full strategy, allowlist, and security posture.

### SOUL.md extraction
The current 3,000-word system prompt gets split into three files:
- `agents/kip/SOUL.md` — persona, tone, identity (~400–600 words)
- `global_memory/BUSINESS.md` — Veyond domain knowledge (shared across agents)
- `global_memory/ANALYTICS_GUIDE.md` — Veyond-specific analytics conventions (event names, named insights, revenue fields)

See [Prompt Caching](../concepts/prompt_caching.md) for `buildSystemPrompt` details.

### Roadmap
See [Roadmap](../roadmap.md) for the phase breakdown.

### Success metrics (1 month post-ship)
- P50 reply under 8s for PostHog questions, under 4s for chat-only.
- Every cited metric traces to an MCP tool call in admin log — zero hallucinated event names.
- Kip answers the standard question set without code changes (see §10 of source).
- Team members screenshot replies because they're funny or useful.
- Adding agent #2 takes one day or less.
- Avg PostHog question under 6k tokens round-trip (down from ~15–20k).

### Open questions
See [Open Questions](../open_questions.md).

---

## Pages updated by this source

- [Kip](../entities/kip.md) — created
- [Veyond](../entities/veyond.md) — created
- [Agent Architecture](../concepts/agent_architecture.md) — created
- [PostHog MCP Integration](../concepts/posthog_mcp.md) — created
- [Prompt Caching](../concepts/prompt_caching.md) — created
- [Multi-Agent Design](../concepts/multi_agent_design.md) — created
- [Roadmap](../roadmap.md) — created
- [Open Questions](../open_questions.md) — created
- [Overview](../overview.md) — created
