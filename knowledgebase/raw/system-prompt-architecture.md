# OpenClaw System Prompt Architecture
> Reference notes for Veyond Crew — studied from `src/agents/system-prompt.ts`

---

## The Core Idea

`buildAgentSystemPrompt()` is a **compiler**, not a config file.

It takes parameters (agent name, files, tools, runtime info) and produces a single string — the system prompt. The **structure is always the same**. The **content varies** based on which agent is being built and what files it has on disk.

```
buildAgentSystemPrompt({ agentName: "kip", contextFiles: [...], tools: [...] })
    ↓
One big string → sent as system prompt to the LLM
```

---

## Section Order (fixed skeleton)

Every agent gets these sections in this order:

| # | Section | What it contains |
|---|---------|-----------------|
| 1 | `## Tooling` | List of available tools with one-line descriptions. Tool names are case-sensitive. |
| 2 | `## Tool Call Style` | When to narrate vs. just act. Prevents verbose "I will now read the file..." |
| 3 | `## Execution Bias` | "If you can act, act. Don't just plan or promise." Critical for agentic behavior. |
| 4 | `## Safety` | Hardcoded. No self-preservation, no resource acquisition, stop on conflict. |
| 5 | `## Skills` | How to find and load skill files dynamically (scan → pick one → read it). |
| 6 | `## Memory` | How to use the memory system. |
| 7 | `## Workspace` | Working directory path. |
| 8 | `## Authorized Senders` | Allowlisted user IDs who can give instructions. |
| 9 | `## Messaging` | How to send messages, avoid duplicate replies, use the message tool. |
| 10 | `# Project Context` | **Agent-specific files injected verbatim here** (soul, memory, identity). |
| 11 | `## Runtime` | One dense line: `agent=kip \| model=claude \| channel=telegram \| ...` |

---

## Context File Injection (the key mechanism)

Agent personality and knowledge live in markdown files on disk. They are loaded and injected verbatim into `# Project Context`.

### File priority order (lower number = earlier in prompt = higher weight):

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

**soul.md gets a special instruction injected before it:**
> "If SOUL.md is present, embody its persona and tone. Avoid stiff, generic replies; follow its guidance unless higher-priority instructions override it."

### Result in the prompt:

```
# Project Context
The following project context files have been loaded.
If SOUL.md is present, embody its persona and tone...

## agents/kip/SOUL.md
[full contents of SOUL.md]

## agents/kip/MEMORY.md
[full contents of MEMORY.md]

## global_memory/BUSINESS.md
[full contents of BUSINESS.md]
```

---

## Two Agents = Same Function, Different Files

```
buildSystemPrompt("kip")     → loads agents/kip/SOUL.md    → Kip's personality
buildSystemPrompt("agent2")  → loads agents/agent2/SOUL.md → Agent 2's personality
```

Same skeleton. Different soul. The model always knows where to find the persona (it's always in the same place in the prompt).

---

## Prompt Modes (important for multi-agent)

```typescript
type PromptMode = "full" | "minimal" | "none"
```

| Mode | Used for | What's included |
|------|----------|-----------------|
| `"full"` | Main agent (Kip) | Everything — all sections |
| `"minimal"` | Subagents spawned by main agent | Tooling + Workspace only. No messaging, voice, canvas, self-update |
| `"none"` | Bare completions | Just: `"You are a personal assistant."` |

**Why this matters:** Subagents should be focused workers. They don't need to know about Telegram channels or model aliases. Stripping them down keeps them cheaper and more predictable.

---

## The Cache Boundary (cost optimization)

```
<!-- OPENCLAW_CACHE_BOUNDARY -->
```

The prompt is split at this marker into two halves:

```
[STABLE HALF]
  - Identity, tools, safety, skills, workspace
  - Same every turn for a given agent config
  - → Gets cached by Anthropic's API (prompt caching)
  
<!-- OPENCLAW_CACHE_BOUNDARY -->

[DYNAMIC HALF]  
  - heartbeat.md (changes frequently)
  - Group/session-specific context
  - Per-turn additions
  - → Always re-processed, never cached
```

**Benefit:** The stable half is only processed once even across many turns. Significant token savings on long conversations.

**Rule:** Anything that changes per-turn goes below the boundary. Everything stable goes above.

---

## Dynamic vs Static Context Files

```typescript
const DYNAMIC_CONTEXT_FILE_BASENAMES = new Set(["heartbeat.md"]);
```

- **Static files** (soul.md, memory.md, etc.) → injected **above** the cache boundary
- **Dynamic files** (heartbeat.md) → injected **below** the cache boundary

This is why you never put volatile state in SOUL.md — it would break caching.

---

## The Runtime Line

Always the last thing in the prompt. Dense, one line:

```
Runtime: agent=kip | host=myserver | model=claude-opus-4-5 | channel=telegram | capabilities=none | thinking=off
```

This gives the model a precise self-awareness snapshot without wasting tokens on a verbose section.

---

## Execution Bias Section (copy this verbatim)

This is one of the most important behavioral nudges. Without it, agents tend to describe what they'll do instead of doing it:

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

## Skills Section Pattern

```
## Skills (mandatory)
Before replying: scan <available_skills> <description> entries.
- If exactly one skill clearly applies: read its SKILL.md with `read`, then follow it.
- If multiple could apply: choose the most specific one, then read/follow it.
- If none clearly apply: do not read any SKILL.md.
Constraints: never read more than one skill up front; only read after selecting.
```

**Key insight:** Skills are NOT pre-loaded. The agent is told they exist and told to fetch them on demand. This keeps the base prompt lean.

---

## What to Build for Veyond Crew

### Minimal `buildSystemPrompt(agentName)`:

```typescript
function buildSystemPrompt(agentName: string): string {
  const soul     = readFileIfExists(`agents/${agentName}/SOUL.md`)
  const memory   = readFileIfExists(`agents/${agentName}/MEMORY.md`)
  const business = readFileIfExists(`global_memory/BUSINESS.md`)
  const status   = readFileIfExists(`global_memory/STATUS.md`)

  const contextFiles = [
    soul     && { path: `agents/${agentName}/SOUL.md`,     content: soul },
    memory   && { path: `agents/${agentName}/MEMORY.md`,   content: memory },
    business && { path: `global_memory/BUSINESS.md`,       content: business },
    status   && { path: `global_memory/STATUS.md`,         content: status },
  ].filter(Boolean)

  return [
    `You are a personal assistant running inside Veyond Crew.`,
    ``,
    buildToolingSection(),         // list of grammY tools
    buildExecutionBiasSection(),   // copy from OpenClaw verbatim
    buildSafetySection(),          // basic safety rules
    buildWorkspaceSection(),       // session dir, data paths
    buildProjectContextSection(contextFiles),  // soul + memory injected here
    `<!-- VEYOND_CACHE_BOUNDARY -->`,
    buildRuntimeLine(agentName),   // agent=kip | channel=telegram | model=...
  ].join('\n')
}
```

### File layout per agent:
```
agents/
  kip/
    SOUL.md      ← persona, tone, style (< 1000 words)
    MEMORY.md    ← seed facts (products, users, decisions)
global_memory/
  BUSINESS.md   ← company context injected into all agents
  STATUS.md     ← current priorities (changes often → goes below cache boundary)
```

---

## Key Takeaways

1. **The function is a compiler** — fixed structure, variable content
2. **Personality lives in files, not code** — swap SOUL.md, get a different agent
3. **Sort context files by priority** — soul before memory before tools
4. **Split stable vs dynamic** at the cache boundary
5. **Subagents get minimal prompts** — no messaging/voice/canvas noise
6. **Execution bias is critical** — without it agents plan instead of act
7. **Skills are fetched on demand** — don't pre-load everything into the prompt
8. **The runtime line** gives the model precise self-awareness cheaply