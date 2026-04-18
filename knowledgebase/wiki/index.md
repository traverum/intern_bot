---
title: "Wiki Index"
category: index
updated: 2026-04-17
---

# Wiki Index

All pages in this wiki, organized by category. Updated on every ingest.

> **Above the wiki:** [`/NORTH_STAR.md`](../NORTH_STAR.md) (vision), [`/README.md`](../README.md) (project intro), [`/AGENTS.md`](../AGENTS.md) (wiki maintenance instructions).

---

## Synthesis

| Page | Description | Sources |
|------|-------------|---------|
| [Overview](overview.md) | What we're building, key decisions, where to start | 2 |
| [Roadmap](roadmap.md) | 4-phase plan: Foundations → MCP → UX → Multi-agent readiness | 1 |
| [Open Questions](open_questions.md) | Unresolved decisions: insight governance, Traverum scope, MCP latency | 1 |

---

## Entities

Named things: agents, companies, systems.

| Page | Description | Sources |
|------|-------------|---------|
| [Kip](entities/kip.md) | The intern. PostHog analyst + brain reader. Voice matters. | 4 |
| [Veyond](entities/veyond.md) | The company + the envisioned crew (Kip, Archivist, Ops, etc.) | 2 |

---

## Concepts

Architectural patterns, decisions, and ideas.

| Page | Description | Sources |
|------|-------------|---------|
| [Agent Architecture](concepts/agent_architecture.md) | File-driven agents, three boundaries, tool loop, skills on-demand, prompt modes | 2 |
| [PostHog MCP Integration](concepts/posthog_mcp.md) | 13-tool read-only allowlist, Anthropic MCP connector, security posture | 1 |
| [Prompt Caching](concepts/prompt_caching.md) | buildSystemPrompt compiler, 11-section skeleton, context file priorities | 2 |
| [Multi-Agent Design](concepts/multi_agent_design.md) | Composition, global memory, per-agent trust levels, future crew roster | 1 |
| [Ack Reaction](concepts/ack_reaction.md) | grammY pattern for `👀` ack on receipt; removes on reply | 1 |

---

## Sources

Raw source summaries — one page per ingested document.

| Page | Description | Date ingested |
|------|-------------|---------------|
| [Vision — North Star](sources/vision.md) | The destination: AI coworkers (not tools) for Veyond. Defines Kip's two jobs, voice, non-autonomy | 2026-04-17 |
| [PRD v2 — Veyond Crew](sources/prd_v2.md) | Foundational PRD: Kip architecture, PostHog MCP strategy, 4-phase roadmap | 2026-04-17 |
| [Ack Reaction Pattern](sources/ack_reaction.md) | grammY ack implementation, OpenClaw reference, removeAfterReply decision | 2026-04-17 |
| [OpenClaw System Prompt Architecture](sources/system_prompt_architecture.md) | buildSystemPrompt compiler, 11-section skeleton, prompt modes, execution bias verbatim | 2026-04-17 |

---

## Stats

- **Total pages:** 14
- **Sources ingested:** 4 (1 vision + 3 raw)
- **Last updated:** 2026-04-17
