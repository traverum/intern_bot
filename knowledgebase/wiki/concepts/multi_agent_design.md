---
title: "Multi-Agent Design"
category: concept
tags: [multi-agent, crew, composition, registry, gateway, scaling]
sources: [prd_v2]
updated: 2026-04-17
---

# Multi-Agent Design

How [Veyond Crew](../entities/veyond.md) is designed to scale from one agent ([Kip](../entities/kip.md)) to many — through composition and file-driven configuration, not abstraction or frameworks. ([prd_v2](../sources/prd_v2.md))

---

## The core principle

> "Scale through composition, not abstraction. Add agents by adding folders + config objects. Don't build a framework until a second agent forces it."

The codebase is agnostic to who any individual agent is. Adding agent #2 should take one day.

---

## What each agent owns

Each agent is a directory under `agents/<name>/`:

```
agents/
└── kip/
    ├── SOUL.md       ← persona, tone, identity (< 800 words)
    ├── MEMORY.md     ← seed facts specific to this agent
    └── config.ts     ← model, local tools, MCP servers, display name, ack emoji, bot token env
```

Agent directories are self-contained. No shared state between agent folders. Shared domain knowledge lives in `global_memory/` — injected at startup from files, never mutated mid-conversation.

---

## What's shared across agents

`global_memory/` provides domain knowledge that any Veyond agent would need:
- `BUSINESS.md` — company domain, personas, key terms.
- `ANALYTICS_GUIDE.md` — analytics conventions specific to Veyond.
- `STATUS.md` — current priorities (injected below the cache boundary, so it's always fresh).

**Rule:** Global memory is injected at startup. No agent writes to global memory mid-conversation. (Principle 4: "One writer to shared memory.")

---

## The agent registry (Phase 4)

`src/gateway/telegram.ts` reads `agents/*/config.ts` and spawns **one `Bot` per agent** in the same PM2 process:

```
Two bots, two tokens, two SOULs, two allowlists, same codebase, zero duplicated logic.
```

Each agent gets its own:
- Telegram bot token (`botTokenEnv` env var — e.g. `KIP_BOT_TOKEN`)
- `SOUL.md` (persona)
- MCP tool allowlist (different trust level per agent)
- Local tool set

---

## Per-agent trust levels

Different agents can have different MCP allowlists — same infrastructure, different permissions:

| Agent | PostHog access |
|-------|---------------|
| Kip | 13 read-only tools |
| Ops (future) | Read + write tools (flags, experiments) |
| Archivist (future) | No PostHog; brain write access instead |

This is why the allowlist must be explicit `tools=` params and not category globs — when a new write tool is added to PostHog's MCP, it shouldn't silently appear in a read-only agent's toolbelt.

---

## Planned future agents (mentioned, not specified)

- **Agent #2** — to be bootstrapped in Phase 4 as a proof-of-concept. Deliberately different MCP allowlist from Kip. Purpose TBD.
- **Archivist** — handles brain writes (currently excluded from Kip). Future agent.
- **Ops** — PostHog write access (feature flags, experiments). Future agent.
- **Platform agent** — Traverum hotel-facing analytics (second PostHog project). Revisit after 1 month.

None of these are planned in this PRD — they're mentioned as future possibilities that the architecture enables.

---

## Done-condition for multi-agent readiness (Phase 4)

> "Adding agent #3 is a folder copy + token registration + BotFather chat."

Phase 4 success = two bots running, two tokens, two SOULs, two allowlists, same PM2 process, same codebase. If you can do that, agent #3 is trivially the same.

---

## What NOT to do

- Don't build a framework until a second agent forces the need.
- Don't abstract `runAgent()` until there's actual divergence between agents.
- Don't share state between agent sessions (each agent has its own JSONL session store).
- Don't let any agent write to `global_memory/` mid-conversation.

---

## Related pages
- [Kip](../entities/kip.md)
- [Veyond](../entities/veyond.md)
- [Agent Architecture](agent_architecture.md)
- [PostHog MCP Integration](posthog_mcp.md)
- [Roadmap](../roadmap.md)
