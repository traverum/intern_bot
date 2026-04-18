---
title: "Overview — Veyond Crew"
category: synthesis
tags: [overview, crew, kip, vision, architecture, synthesis]
sources: [vision, prd_v2]
updated: 2026-04-17
---

# Overview — Veyond Crew

> **Vision:** [`/NORTH_STAR.md`](../NORTH_STAR.md) — read this first. It's the destination.
> **Workflow:** [`/README.md`](../README.md) — how this repo is organized.
> **Maintenance:** [`/AGENTS.md`](../AGENTS.md) — how the wiki is kept current.

---

## In one paragraph

We are building a team of AI coworkers for [Veyond](entities/veyond.md). Not tools — coworkers. Each has a name, a personality, a Telegram handle, a job. The first hire is [Kip](entities/kip.md), an analytics intern who answers product questions in chat. He has two jobs: **knows the numbers** (PostHog) and **knows the company** (the brain). He's read-only, he doesn't make things up, and he's pleasant to talk to. The architecture is built so the second hire takes one day. ([vision](sources/vision.md), [prd_v2](sources/prd_v2.md))

---

## What we're optimizing for

| Optimize for | Not |
|--------------|-----|
| Coworkers | Tools |
| Voice and personality | Generic chatbot |
| Answers in chat | Dashboard links |
| Reading from sources of truth | Hallucinating numbers |
| Composition (file-driven agents) | Frameworks and abstractions |
| One-day second-agent setup | Refactor-per-agent |
| Read-only, asked-for action | Autonomous behavior |

The personality and the architecture are not separate concerns. The vision says "coworkers, not tools" — that constrains both how Kip talks (voice) and how he's built (each agent has its own SOUL.md, MEMORY.md, config.ts). See [Kip](entities/kip.md) and [Multi-Agent Design](concepts/multi_agent_design.md).

---

## Status as of 2026-04-17

In development. Existing `intern-bot` codebase is the starting point. PRD v2 is being implemented across 4 phases over ~4–5 weeks. See [Roadmap](roadmap.md).

The wiki currently captures: the vision, the PRD, the system prompt architecture pattern, and the ack reaction UX pattern. Three raw sources ingested.

---

## The three-layer build

```
Files (SOUL.md, BUSINESS.md, ANALYTICS_GUIDE.md, etc.)
       ↓
Agent runner (runAgent.ts, buildPrompt.ts, toolLoop.ts)
       ↓
Gateway (telegram.ts — the only file that knows grammY exists)
```

The agent runner is pure: `(agentName, chatId, userText) → reply`. Swap the gateway, get a different delivery channel (cron, HTTP). See [Agent Architecture](concepts/agent_architecture.md).

---

## Kip in one paragraph

[Kip](entities/kip.md) reads Veyond's analytics via PostHog's official MCP server — 13 read-only tools on the EU endpoint — and reads the company brain via 3 local tools. He answers in Telegram in his own voice (DM and group chats with mention/reply gating). He cannot write to PostHog or the brain — by design; future `Archivist` and `Ops` agents will get write access with their own allowlists. His persona lives in `agents/kip/SOUL.md`, his domain knowledge in `global_memory/`, and his prompt is assembled by a `buildSystemPrompt` compiler with a fixed 11-section skeleton.

---

## Key architectural decisions

| Decision | Rationale | Source |
|----------|-----------|--------|
| Coworkers, not tools | Voice → daily use → real value | [vision](sources/vision.md) |
| File-driven agents | Swap `SOUL.md`, get a different agent | [prd_v2](sources/prd_v2.md), [system_prompt_architecture](sources/system_prompt_architecture.md) |
| PostHog via MCP | 13 read tools maintained by vendor; no parallel maintenance | [prd_v2](sources/prd_v2.md) |
| Explicit tool allowlist | New PostHog write tools don't silently appear in Kip's belt | [prd_v2](sources/prd_v2.md) |
| Decouple gateway from agent | One pure runner; multiple callers (Telegram, cron, HTTP) | [prd_v2](sources/prd_v2.md) |
| Cache boundary in prompt | Stable above (persona, domain) cached; dynamic below (status, date) re-tokenized | [prd_v2](sources/prd_v2.md), [system_prompt_architecture](sources/system_prompt_architecture.md) |
| Ack reaction (`👀`) on receipt | Fills the 10–20s tool-call silence | [ack_reaction](sources/ack_reaction.md) |
| Read-only by default | Vision: never acts without being asked | [vision](sources/vision.md), [prd_v2](sources/prd_v2.md) |

---

## What to read next

| If you want to understand... | Read |
|-----------------------------|------|
| The vision (start here) | [`NORTH_STAR.md`](../NORTH_STAR.md) |
| How this repo works | [`README.md`](../README.md) |
| Kip specifically | [Kip](entities/kip.md) |
| How the files and code are structured | [Agent Architecture](concepts/agent_architecture.md) |
| How the system prompt is built | [Prompt Caching](concepts/prompt_caching.md) |
| PostHog tool access | [PostHog MCP Integration](concepts/posthog_mcp.md) |
| The 👀 ack pattern | [Ack Reaction](concepts/ack_reaction.md) |
| How agent #2 gets added | [Multi-Agent Design](concepts/multi_agent_design.md) |
| What's being built and when | [Roadmap](roadmap.md) |
| Unresolved decisions | [Open Questions](open_questions.md) |
| How wiki maintenance works | [`AGENTS.md`](../AGENTS.md) |
