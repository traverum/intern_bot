---
title: "Agent Architecture"
category: concept
tags: [architecture, file-driven, runAgent, gateway, toolLoop, buildPrompt, skills, prompt-modes]
sources: [prd_v2, system_prompt_architecture]
updated: 2026-04-17
---

# Agent Architecture

The core structural pattern for [Veyond Crew](multi_agent_design.md): agents are defined by files, not code. Adding a new agent means adding a folder and a config object — not a refactor. ([prd_v2](../sources/prd_v2.md))

---

## Target directory layout

```
veyond_crew/
├── agents/
│   └── kip/
│       ├── SOUL.md          ← persona, tone, identity (< 800 words)
│       ├── MEMORY.md        ← seed facts (products, known users, ongoing context)
│       └── config.ts        ← { model, localTools, mcpServers, displayName, ackEmoji, botTokenEnv }
├── global_memory/
│   ├── BUSINESS.md          ← Veyond domain: personas, terms, hotel_id=null
│   ├── ANALYTICS_GUIDE.md   ← thin guide: common questions, named insights, HogQL tips
│   └── STATUS.md            ← current priorities (injected BELOW cache boundary)
├── src/
│   ├── agents/
│   │   ├── runAgent.ts      ← pure (agent, chatId, text) → reply
│   │   ├── buildPrompt.ts   ← loads SOUL.md + global files + runtime line
│   │   └── toolLoop.ts      ← Anthropic tool-use loop, handles local + MCP tools
│   ├── gateway/
│   │   └── telegram.ts      ← the ONLY place grammY is imported
│   ├── tools/
│   │   └── brain/
│   │       └── read.ts      ← read/search brain (writes excluded for Kip)
│   ├── memory/
│   │   └── conversation.ts  ← unchanged JSONL session handling
│   └── admin/
│       └── server.ts        ← admin UI, shows mcp_tool_use blocks
└── data/
    └── sessions/
        └── kip/             ← JSONL per chatId
```

No `src/tools/posthog.ts`. PostHog lives entirely in the MCP config.

---

## The three architectural boundaries

### A. Agent boundary
`runAgent({ agentName, chatId, userText }) → reply` is pure. No `ctx`, no Telegram types. This enables:
- Telegram as one caller of `runAgent`.
- Cron as another caller (`gateway/cron.ts`).
- HTTP as another (`gateway/http.ts`).

The agent runner knows nothing about delivery channel.

### B. Gateway boundary
`src/gateway/telegram.ts` is the **only** file that imports grammY. Responsibilities:
- Receive Telegram update.
- Apply mention/reply gating for group chats.
- Call `runAgent()`.
- Send the reply.
- Handle ack reactions (Phase 3).

Swapping to a different channel = writing a new gateway file, zero changes to `src/agents/`.

### C. Cache boundary
Inside the compiled system prompt, `<!-- VEYOND_CACHE_BOUNDARY -->` is inserted. Anthropic prompt caching applies to everything **above** the boundary:
- SOUL.md
- BUSINESS.md
- ANALYTICS_GUIDE.md
- Tool descriptions

**Below** the boundary (dynamic, not cached):
- STATUS.md (current priorities)
- Runtime line: `agent=kip | model=... | channel=... | date=...`

See [Prompt Caching](prompt_caching.md) for implementation detail.

---

## File-driven agents

The codebase is agnostic to who [Kip](../entities/kip.md) is. Everything agent-specific lives in `agents/kip/`:

- **`SOUL.md`** — identity, voice, formatting rules, personality. Editing this file and restarting picks up the new persona with zero code changes. This is the done-condition for Phase 1.
- **`MEMORY.md`** — seed facts injected into context (known users, product context, ongoing threads).
- **`config.ts`** — specifies model, local tools, MCP servers, display name, ack emoji, bot token env var.

**Global memory** (`global_memory/`) is shared across all agents — domain knowledge about [Veyond](../entities/veyond.md) that any agent would need. Injected at startup, never mutated mid-conversation.

---

## Tool handling in `toolLoop.ts`

The tool loop iterates `response.content` by block type:

| Block type | Handler |
|-----------|---------|
| `text` | Accumulate reply chunks |
| `tool_use` | Dispatch to local tool (brain reads) |
| `mcp_tool_use` | Already routed by Anthropic; log for admin |
| `mcp_tool_result` | Already executed; log for admin, don't re-dispatch |

Local tool loop is our responsibility. Anthropic handles PostHog's MCP loop transparently.

---

## Skills — on-demand, not pre-loaded

Skills are NOT injected into the base prompt. The agent is told they exist and fetches them when a task matches:

```
Before replying: scan <available_skills> entries.
- If one clearly applies: read its SKILL.md, then follow it.
- If multiple: choose the most specific one.
- If none: do not read any skill.
Never read more than one skill up front.
```

This keeps the base prompt lean. Skill content only enters context when actually needed. See [Prompt Caching](prompt_caching.md) for the full Skills section text.

---

## Prompt modes

When subagents are eventually spawned by a main agent, they get a stripped-down prompt:

| Mode | Used for | Includes |
|------|----------|---------|
| `"full"` | Main agent (Kip) | All sections — tooling, persona, domain, messaging |
| `"minimal"` | Subagents | Tooling + Workspace only — no Telegram channel knowledge, no voice |
| `"none"` | Bare completions | Just: `"You are a personal assistant."` |

Subagents should be focused workers. Stripping them to `"minimal"` makes them cheaper and more predictable. [Kip](../entities/kip.md) v1 doesn't spawn subagents, so this is forward-looking. ([system_prompt_architecture](../sources/system_prompt_architecture.md))

---

## Agent config schema (Phase 4)

```typescript
interface AgentConfig {
  botTokenEnv: string;        // e.g. "KIP_BOT_TOKEN"
  model: string;
  localTools: Tool[];
  mcpServers: McpServer[];
  displayName: string;
  ackEmoji: string;
}
```

The Telegram gateway reads `agents/*/config.ts` and spawns one `Bot` per agent in the same PM2 process. Two bots, two tokens, two SOULs, two allowlists — same codebase, zero duplicated logic.

---

## Related pages
- [Kip](../entities/kip.md)
- [Multi-Agent Design](multi_agent_design.md)
- [PostHog MCP Integration](posthog_mcp.md)
- [Prompt Caching](prompt_caching.md)
- [Roadmap](../roadmap.md)
