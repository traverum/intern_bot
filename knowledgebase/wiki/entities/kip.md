---
title: "Kip"
category: entity
tags: [agent, telegram, posthog, analytics, claude, ack, intern, persona]
sources: [vision, prd_v2, ack_reaction, system_prompt_architecture]
updated: 2026-04-18
---

# Kip

Kip is the first hire on the [Veyond Crew](../concepts/multi_agent_design.md) — the intern. Twenty-something energy. Quick with a joke. Actually knows what's going on. He answers product questions in Telegram, in his own voice, in seconds. ([vision](../sources/vision.md))

> Per the [North Star](../../NORTH_STAR.md): "If Kip answers correctly but sounds like a robot, people will use it twice and stop. If Kip answers correctly AND feels like a person, people will use it daily." Voice is not decoration — it's what makes the tool get used.

---

## Kip's two jobs (v1)

1. **Knows the numbers.** Bookings, revenue, conversion, errors — answered in chat with the actual number, not a dashboard link. If nuanced, explains the nuance. If unknown, says so. (See PostHog access below.)
2. **Knows the company.** Anything written down — policies, decisions, how the product behaves — readable via brain reads.

That's it. Two jobs. Done well. Pleasant to talk to. ([vision](../sources/vision.md))

---

## Identity

- **Role:** Analytics intern + company brain reader.
- **Vibe:** Twenty-something, quick with a joke, knows the numbers, doesn't lecture.
- **Interface:** Telegram (DMs and group chats; mention/reply gating in groups).
- **Model:** `claude-sonnet-4-6` (configurable per env).
- **Persona file:** `agents/kip/SOUL.md` — ~400–600 words; persona only, no domain knowledge.
- **Ack emoji:** `👀` on receipt (< 100ms); cleared on reply. See [Ack Reaction](../concepts/ack_reaction.md).

---

## What Kip can do

### PostHog analytics (two paths)
Kip has read-only access to Veyond's PostHog EU project. Tool access depends on provider + `TOOL_MODE`:

- **Anthropic + `TOOL_MODE=mcp`:** PostHog's hosted MCP server, 13 vendor-maintained tools (trends, funnels, retention, paths, lifecycle, HogQL, insights, dashboards, error tracking).
- **Anthropic + `TOOL_MODE=local`** or **OpenAI (always local):** 6 hand-rolled local tools covering query/trend/funnel/event-definitions/dashboards/feature-flags.

The four Monday-morning questions Kip must answer on both paths:

1. "How many widget visitors yesterday/today?" — `$pageview` trend
2. "How many unique visitors?" — unique `distinct_id` count
3. "Which hotels drive the most traffic?" — `$pageview` grouped by `hotel_slug` (white-label only)
4. "Which experiences get the most interest?" — `experience_viewed` grouped by `experience_title`

Full detail: [PostHog Tool Access](../concepts/posthog_mcp.md). Playbooks: [`ANALYTICS_GUIDE.md`](../../../global_memory/ANALYTICS_GUIDE.md).

### Brain reads
Kip can read Veyond's internal brain (knowledge base) via 3 local read tools. Brain writes are explicitly excluded for Kip — a future `Archivist` agent handles those.

---

## What Kip cannot do

Per the [North Star](../../NORTH_STAR.md): "It isn't autonomous — the crew never acts without being asked, never spends money, never sends emails on anyone's behalf without checking."

- **Write to PostHog** — zero write tools in allowlist (no flag creation, experiment changes, etc.).
- **Write to the brain** — read-only; `brain_write_files` is not registered. Future `Archivist` agent handles brain writes.
- **Hallucinate numbers** — if PostHog doesn't return it, Kip says so. Every cited metric traces to a tool call.
- **Access Traverum platform analytics** — separate PostHog project; out of scope (revisit after 1 month, per open question).
- **Subagent spawning** — no handoffs to other agents.
- **Voice/canvas/multimodal** — text only.
- **Cron digests** — architecture supports them; not yet implemented (Phase 5+).
- **Take action without being asked** — read-only, asked-for. No background jobs, no proactive messages.

---

## Prompt structure

Kip's system prompt is assembled by `src/agents/buildPrompt.ts` — a compiler with a fixed 11-section skeleton. The content varies by agent files, but the structure is always the same. Kip runs in `"full"` mode; any future subagents Kip spawns would run in `"minimal"` mode (tooling + workspace only).

Condensed output:

```
[Tooling] [Tool Call Style] [Execution Bias] [Safety] [Skills] [Workspace]

# Project Context
## agents/kip/SOUL.md      ← priority 20 (highest)
## agents/kip/MEMORY.md    ← priority 70
## global_memory/BUSINESS.md
## global_memory/ANALYTICS_GUIDE.md

<!-- VEYOND_CACHE_BOUNDARY -->

## global_memory/STATUS.md   ← dynamic, re-tokenized every turn
Runtime: agent=kip | model=claude-sonnet-4-6 | channel=telegram | ...
```

Everything above the cache boundary is stable and cached. See [Prompt Caching](../concepts/prompt_caching.md) for the full section order, context file priority map, and execution bias text.

---

## Session storage

- JSONL at `data/sessions/kip/<chatId>.jsonl`.
- Survives restarts.
- Session pruning handles tool-use/tool-result ordering correctly.
- `/reset` command (Phase 3) archives the JSONL for the current chat.

---

## What "good Kip" looks like

From the [North Star](../../NORTH_STAR.md), concrete success scenarios:

- Group chat: "how did bookings go this week?" → answer in 8s with the number, the WoW change, and a tiny piece of commentary. Someone screenshots it because it's funny.
- DM: "what's our cancellation policy for group bookings?" → answer pulled from the actual policy doc, not hallucinated.
- Tone in chat: 1–3 line replies by default. Reports only when asked for a report.

These map to measurable [success metrics](../roadmap.md#success-metrics-1-month-post-ship): P50 < 8s for analytics, < 4s for chat-only, every metric traces to an MCP tool call, team members screenshot replies.

---

## Current state vs. target state

| Dimension | Current | Target |
|-----------|---------|--------|
| Persona | ✅ `agents/kip/SOUL.md` markdown file | Same |
| Provider | ✅ Anthropic *or* OpenAI (`LLM_PROVIDER`) | Anthropic primary, OpenAI fallback |
| PostHog | ✅ 6 local tools; MCP connector wired but token not populated | Anthropic on `TOOL_MODE=mcp`, OpenAI on local (permanent) |
| Global memory | ✅ `global_memory/BUSINESS.md` + `ANALYTICS_GUIDE.md` (rewritten 2026-04-18) | Same, expand as questions force it |
| Widget events | ⏳ `experience_viewed` wiring in progress | 3 events + 4 super-properties |
| Cache | ✅ Boundary at `<!-- VEYOND_CACHE_BOUNDARY -->` | Same |
| Ack | ☐ Hard-coded `"typing"` today | `👀` reaction on receive (Phase 3) |
| Gateway | ✅ Pure `runAgent()` + `gateway/telegram.ts` | Same |

---

## Config file

`agents/kip/config.ts` shape:

```typescript
{
  botTokenEnv: "KIP_BOT_TOKEN",
  model: "claude-sonnet-4-6",
  localTools: [...],           // brain read tools
  mcpServers: [...],           // posthog MCP
  displayName: "Kip",
  ackEmoji: "👀"
}
```

---

## Related pages
- [Veyond](veyond.md)
- [Agent Architecture](../concepts/agent_architecture.md)
- [PostHog MCP Integration](../concepts/posthog_mcp.md)
- [Prompt Caching](../concepts/prompt_caching.md)
- [Ack Reaction](../concepts/ack_reaction.md)
- [Multi-Agent Design](../concepts/multi_agent_design.md)
- [Roadmap](../roadmap.md)
