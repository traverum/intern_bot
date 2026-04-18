---
title: "Prompt Caching & System Prompt Assembly"
category: concept
tags: [prompt, caching, buildPrompt, cache-boundary, SOUL, anthropic, execution-bias, skills, prompt-modes]
sources: [prd_v2, system_prompt_architecture]
updated: 2026-04-17
---

# Prompt Caching & System Prompt Assembly

How [Kip's](../entities/kip.md) system prompt is built from files and how the cache boundary reduces token cost on every turn. Pattern derived from OpenClaw's `buildAgentSystemPrompt()`. ([prd_v2](../sources/prd_v2.md), [system_prompt_architecture](../sources/system_prompt_architecture.md))

---

## The compiler metaphor

`buildSystemPrompt(agentName)` is a **compiler**, not a config file. It takes parameters (agent name, files, tools, runtime info) and produces one string — the system prompt. The **structure is always the same**; the **content varies** based on which agent is being built and what files exist on disk.

```
buildSystemPrompt("kip")
    ↓
One big string → sent as system prompt to the LLM
```

---

## The 11-section skeleton (fixed order)

Every agent gets these sections in this order:

| # | Section | Purpose |
|---|---------|---------|
| 1 | `## Tooling` | Available tools with one-line descriptions. Tool names are case-sensitive. |
| 2 | `## Tool Call Style` | When to narrate vs. just act. Prevents "I will now read the file..." verbosity. |
| 3 | `## Execution Bias` | "If you can act, act." Critical for agentic behavior. |
| 4 | `## Safety` | Hardcoded. No self-preservation, no resource acquisition, stop on conflict. |
| 5 | `## Skills` | How to find and load skill files on demand. |
| 6 | `## Memory` | How to use the memory system. |
| 7 | `## Workspace` | Working directory path. |
| 8 | `## Authorized Senders` | Allowlisted user IDs who can give instructions. |
| 9 | `## Messaging` | How to send messages, avoid duplicate replies. |
| 10 | `# Project Context` | **Agent-specific files injected verbatim here.** |
| 11 | `## Runtime` | One dense line with agent/model/channel/date. |

For Veyond Crew's initial implementation, sections that don't apply (Skills, Authorized Senders) can be omitted or simplified — the key sections are Tooling, Execution Bias, Safety, Project Context, and Runtime.

---

## Context file injection

Agent personality and domain knowledge live in markdown files. They are injected verbatim under `# Project Context`, sorted by priority (lower number = earlier = higher weight):

```typescript
const CONTEXT_FILE_ORDER = new Map([
  ["agents.md",    10],   // multi-agent coordination rules
  ["soul.md",      20],   // PERSONA — who the agent is, tone, style  ← highest weight
  ["identity.md",  30],   // name, emoji, display settings
  ["user.md",      40],   // facts about the user
  ["tools.md",     50],   // guidance for external tools
  ["bootstrap.md", 60],   // first-run setup instructions
  ["memory.md",    70],   // known facts, ongoing context
]);
```

`soul.md` gets a special instruction injected before it:
> "If SOUL.md is present, embody its persona and tone. Avoid stiff, generic replies; follow its guidance unless higher-priority instructions override it."

**For Veyond Crew,** the context files are:
- `agents/kip/SOUL.md` → priority 20 (persona)
- `agents/kip/MEMORY.md` → priority 70 (seed facts)
- `global_memory/BUSINESS.md` → shared domain knowledge
- `global_memory/ANALYTICS_GUIDE.md` → analytics conventions
- `global_memory/STATUS.md` → current priorities (**dynamic** — goes below cache boundary)

---

## Static vs. dynamic files

This is the critical split for caching:

```
STATIC (above cache boundary)       DYNAMIC (below cache boundary)
───────────────────────────         ──────────────────────────────
SOUL.md                             STATUS.md  (changes frequently)
MEMORY.md                           Runtime line (date changes daily)
BUSINESS.md
ANALYTICS_GUIDE.md
```

**Rule:** Never put volatile state in SOUL.md — it breaks caching. If content changes per-turn or per-day, it goes below the boundary.

OpenClaw uses a `DYNAMIC_CONTEXT_FILE_BASENAMES` set:
```typescript
const DYNAMIC_CONTEXT_FILE_BASENAMES = new Set(["heartbeat.md"]);
// Veyond equivalent: STATUS.md
```

---

## The cache boundary

```
<!-- VEYOND_CACHE_BOUNDARY -->
```

Everything **above**: stable content, cached via Anthropic prompt caching. Tokenized once; reused across all turns in a session.

Everything **below**: dynamic content, re-tokenized every turn.

**Benefit:** Significant token savings on long conversations and repeated questions. The stable half (persona, domain, analytics guide) is processed once; only STATUS.md + runtime line change turn-to-turn.

---

## Prompt modes (important for multi-agent)

```typescript
type PromptMode = "full" | "minimal" | "none"
```

| Mode | Used for | Includes |
|------|----------|---------|
| `"full"` | Main agent (Kip, Agent #2) | All 11 sections |
| `"minimal"` | Subagents spawned by a main agent | Tooling + Workspace only |
| `"none"` | Bare completions | Just: `"You are a personal assistant."` |

Subagents should be focused workers — no Telegram channel knowledge, no voice guidance, no canvas. Stripping them to `"minimal"` makes them cheaper and more predictable. Kip v1 doesn't spawn subagents, so this is forward-looking.

---

## Execution Bias section (copy verbatim)

One of the most important behavioral nudges. Without it, agents tend to describe what they'll do instead of doing it:

```
## Execution Bias
If the user asks you to do the work, start doing it in the same turn.
Use a real tool call or concrete action first when the task is actionable;
do not stop at a plan or promise-to-act reply.
Commentary-only turns are incomplete when tools are available and the next action is clear.
If the work will take multiple steps or a while to finish, send one short progress 
update before or while acting.
```

---

## Skills section pattern

Skills are NOT pre-loaded into the prompt. The agent is told they exist and fetches them on demand:

```
## Skills (mandatory)
Before replying: scan <available_skills> <description> entries.
- If exactly one skill clearly applies: read its SKILL.md with `read`, then follow it.
- If multiple could apply: choose the most specific one, then read/follow it.
- If none clearly apply: do not read any SKILL.md.
Constraints: never read more than one skill up front; only read after selecting.
```

This keeps the base prompt lean — skill content only enters the context when actually needed.

---

## Runtime line format

Always the last element in the prompt. Dense, one line:

```
Runtime: agent=kip | host=veyond-crew | model=claude-sonnet-4-6 | channel=telegram | capabilities=none | thinking=off
```

Gives the model a precise self-awareness snapshot without wasting tokens on a verbose section.

---

## Concrete implementation sketch

```typescript
function buildSystemPrompt(agentName: string): string {
  const soul     = readFileIfExists(`agents/${agentName}/SOUL.md`)
  const memory   = readFileIfExists(`agents/${agentName}/MEMORY.md`)
  const business = readFileIfExists(`global_memory/BUSINESS.md`)
  const analytics = readFileIfExists(`global_memory/ANALYTICS_GUIDE.md`)
  const status   = readFileIfExists(`global_memory/STATUS.md`)

  const staticFiles = [
    soul      && { path: `agents/${agentName}/SOUL.md`,     content: soul },
    memory    && { path: `agents/${agentName}/MEMORY.md`,   content: memory },
    business  && { path: `global_memory/BUSINESS.md`,       content: business },
    analytics && { path: `global_memory/ANALYTICS_GUIDE.md`, content: analytics },
  ].filter(Boolean)

  return [
    `You are a personal assistant running inside Veyond Crew.`,
    buildToolingSection(),
    buildExecutionBiasSection(),   // verbatim from above
    buildSafetySection(),
    buildWorkspaceSection(),
    buildProjectContextSection(staticFiles),
    `<!-- VEYOND_CACHE_BOUNDARY -->`,
    status ? `## global_memory/STATUS.md\n${status}` : '',
    buildRuntimeLine(agentName),
  ].filter(Boolean).join('\n\n')
}
```

---

## Token economics

| State | Behavior |
|-------|---------|
| Before (current) | Full 3,000-word prompt re-tokenized every turn |
| After (target) | ~2,000-word stable prefix cached; only STATUS + runtime re-tokenized |
| PostHog MCP tools | 13-tool allowlist keeps tool description overhead manageable |
| Target avg | PostHog question under 6k tokens round-trip (down from ~15–20k) |

---

## Related pages
- [Kip](../entities/kip.md)
- [Agent Architecture](agent_architecture.md)
- [Multi-Agent Design](multi_agent_design.md)
