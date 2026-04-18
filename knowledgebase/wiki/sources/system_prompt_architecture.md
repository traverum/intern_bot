---
title: "OpenClaw System Prompt Architecture"
category: source
tags: [buildPrompt, system-prompt, compiler, cache-boundary, execution-bias, skills, prompt-modes]
sources: [system_prompt_architecture]
updated: 2026-04-17
---

# OpenClaw System Prompt Architecture

**File:** `raw/system-prompt-architecture.md`
**Date ingested:** 2026-04-17
**Origin:** Reference notes studied from OpenClaw `src/agents/system-prompt.ts`

---

## What this document is

Deep technical reference for how `buildAgentSystemPrompt()` works in OpenClaw — the pattern Veyond Crew adapts. Covers the fixed 11-section skeleton, context file priority ordering, prompt modes (full/minimal/none), cache boundary mechanics, and key behavioral sections (Execution Bias, Skills).

---

## Key claims and extracts

### The compiler metaphor
`buildAgentSystemPrompt()` is a **compiler**, not a config file. It takes parameters (agent name, files, tools, runtime info) and produces a single string. The structure is always the same; the content varies by agent and its files on disk.

### The 11-section skeleton (fixed order)
| # | Section | Purpose |
|---|---------|---------|
| 1 | `## Tooling` | Available tools with one-line descriptions. Tool names case-sensitive. |
| 2 | `## Tool Call Style` | When to narrate vs. just act. Prevents "I will now read the file..." verbosity. |
| 3 | `## Execution Bias` | "If you can act, act." Critical for agentic behavior. |
| 4 | `## Safety` | Hardcoded. No self-preservation, no resource acquisition, stop on conflict. |
| 5 | `## Skills` | How to find and load skill files on demand (scan → pick one → read). |
| 6 | `## Memory` | How to use the memory system. |
| 7 | `## Workspace` | Working directory path. |
| 8 | `## Authorized Senders` | Allowlisted user IDs who can give instructions. |
| 9 | `## Messaging` | How to send messages, avoid duplicate replies, use message tool. |
| 10 | `# Project Context` | **Agent-specific files injected verbatim here.** |
| 11 | `## Runtime` | One dense line: `agent=kip \| model=... \| channel=... \| ...` |

### Context file priority ordering
Files injected under `# Project Context`, sorted by priority (lower = earlier = higher weight):
```typescript
const CONTEXT_FILE_ORDER = new Map([
  ["agents.md",    10],   // multi-agent coordination rules
  ["soul.md",      20],   // PERSONA — who the agent is, tone, style
  ["identity.md",  30],   // name, emoji, display settings
  ["user.md",      40],   // facts about the user
  ["tools.md",     50],   // guidance for external tools
  ["bootstrap.md", 60],   // first-run setup instructions
  ["memory.md",    70],   // known facts, ongoing context
]);
```

Soul gets a special instruction before it:
> "If SOUL.md is present, embody its persona and tone. Avoid stiff, generic replies; follow its guidance unless higher-priority instructions override it."

### Prompt modes
```typescript
type PromptMode = "full" | "minimal" | "none"
```
| Mode | Used for | Includes |
|------|----------|---------|
| `"full"` | Main agent (Kip) | All 11 sections |
| `"minimal"` | Subagents spawned by main agent | Tooling + Workspace only |
| `"none"` | Bare completions | Just: `"You are a personal assistant."` |

Subagents get minimal prompts — no messaging/voice/canvas noise. Cheaper and more predictable.

### Cache boundary
```
<!-- OPENCLAW_CACHE_BOUNDARY -->  (Veyond version: <!-- VEYOND_CACHE_BOUNDARY -->)
```
Static files (soul, memory, business) go **above**. Dynamic files (heartbeat.md / STATUS.md) go **below**. Anything that changes per-turn must go below — putting volatile state in SOUL.md breaks caching.

```typescript
const DYNAMIC_CONTEXT_FILE_BASENAMES = new Set(["heartbeat.md"]);
// Veyond equivalent: STATUS.md
```

### Execution Bias section (copy verbatim)
```
## Execution Bias
If the user asks you to do the work, start doing it in the same turn.
Use a real tool call or concrete action first when the task is actionable;
do not stop at a plan or promise-to-act reply.
Commentary-only turns are incomplete when tools are available and the next action is clear.
If the work will take multiple steps or a while to finish, send one short progress 
update before or while acting.
```

### Skills section pattern
```
## Skills (mandatory)
Before replying: scan <available_skills> <description> entries.
- If exactly one skill clearly applies: read its SKILL.md with `read`, then follow it.
- If multiple could apply: choose the most specific one, then read/follow it.
- If none clearly apply: do not read any SKILL.md.
Constraints: never read more than one skill up front; only read after selecting.
```
Skills are NOT pre-loaded. The agent is told they exist and fetches them on demand. This keeps the base prompt lean.

### Runtime line format
```
Runtime: agent=kip | host=myserver | model=claude-opus-4-5 | channel=telegram | capabilities=none | thinking=off
```

### Concrete `buildSystemPrompt` sketch for Veyond Crew
```typescript
function buildSystemPrompt(agentName: string): string {
  const soul     = readFileIfExists(`agents/${agentName}/SOUL.md`)
  const memory   = readFileIfExists(`agents/${agentName}/MEMORY.md`)
  const business = readFileIfExists(`global_memory/BUSINESS.md`)
  const status   = readFileIfExists(`global_memory/STATUS.md`)

  const contextFiles = [
    soul     && { path: `agents/${agentName}/SOUL.md`,   content: soul },
    memory   && { path: `agents/${agentName}/MEMORY.md`, content: memory },
    business && { path: `global_memory/BUSINESS.md`,     content: business },
    status   && { path: `global_memory/STATUS.md`,       content: status },
  ].filter(Boolean)

  return [
    `You are a personal assistant running inside Veyond Crew.`,
    buildToolingSection(),
    buildExecutionBiasSection(),
    buildSafetySection(),
    buildWorkspaceSection(),
    buildProjectContextSection(contextFiles),
    `<!-- VEYOND_CACHE_BOUNDARY -->`,
    buildRuntimeLine(agentName),
  ].join('\n')
}
```
Note: `status` is included in `contextFiles` but goes below the cache boundary because it's dynamic. The sketch above shows the structure; the implementation needs to handle the static/dynamic split for `buildProjectContextSection`.

---

## Pages updated by this source

- [Prompt Caching](../concepts/prompt_caching.md) — major update: full section order, context file priorities, prompt modes, execution bias text, skills pattern
- [Agent Architecture](../concepts/agent_architecture.md) — skills on-demand, prompt modes for subagents
- [Kip](../entities/kip.md) — prompt modes reference
