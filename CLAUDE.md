# CLAUDE.md

> For Claude Code working in this repo. Read this first. Then read [`knowledgebase/NORTH_STAR.md`](knowledgebase/NORTH_STAR.md).

---

## What we're building

A team of **AI coworkers** for [Veyond](knowledgebase/wiki/entities/veyond.md) — not tools, not assistants, coworkers. Each has a name, a personality, a Telegram handle, a job. You message them like you'd message anyone else on the team.

First hire: **Kip**, the intern. Two jobs: *knows the numbers* (PostHog) and *knows the company* (the brain). Read-only, never hallucinates, actually pleasant to talk to.

Full vision lives in [`knowledgebase/NORTH_STAR.md`](knowledgebase/NORTH_STAR.md). If anything in this file contradicts it, the North Star wins.

---

## The two knowledge stores — don't confuse them

This project has **two separate "brains"**. They serve different purposes and live in different places.

### 1. `knowledgebase/` — the *project* wiki (this repo)
The knowledge that drives **building this product**. PRDs, architecture, decisions, roadmap, vision. For humans and AI working *on veyond_crew*.

- `knowledgebase/raw/` — decision dump. Immutable. User drops things here (plans, PRDs, notes).
- `knowledgebase/wiki/` — clean, current synthesis of `raw/` measured against the North Star. **You maintain this.**
- See [`knowledgebase/AGENTS.md`](knowledgebase/AGENTS.md) for the full wiki maintenance protocol (ingest workflow, conflict rules, frontmatter, supersede markers).

### 2. `traverum/brain` — the *company* brain (separate GitHub repo)
What Kip actually reads at runtime to answer company-knowledge questions ("what's our cancellation policy?"). Veyond's internal knowledge base. Not in this repo. Accessed via the GitHub API through `src/tools/brain-read.ts`.

**Rule of thumb:** If it's about *how we build the crew*, it's in `knowledgebase/`. If it's about *how Veyond operates* (policies, product, decisions), it's in `traverum/brain`.

---

## How the project knowledgebase works

The pattern is "LLM Wiki": instead of RAG over raw docs at query time, Claude incrementally builds a persistent, structured wiki that compounds with every source.

```
User drops a doc in knowledgebase/raw/ (or asks you to summarize a decision and add it)
       ↓
User: "ingest raw/<filename>"
       ↓
You read it, discuss takeaways, flag conflicts with existing wiki pages
       ↓
You write wiki/sources/<slug>.md + update affected entity/concept pages
       ↓
You update wiki/index.md and append to wiki/log.md
```

**Your responsibilities as wiki maintainer:**
- `raw/` is **immutable** — read, never modify.
- Newer decisions win. When sources conflict, flag it, propose resolution, wait for confirmation on anything vision-level.
- Mark superseded claims with strikethrough + a bold supersede line — never silently delete.
- Keep `wiki/index.md` and `wiki/log.md` current on every operation.
- Sometimes the user will ask you to skip `raw/` and write directly to the wiki — that's fine when they say so.

Full conventions (frontmatter, citations, conflict markers, log format): [`knowledgebase/AGENTS.md`](knowledgebase/AGENTS.md).

---

## "Memory" — the three kinds in this system

The word "memory" shows up in multiple places. Keep them straight:

| What | Where | Purpose |
|------|-------|---------|
| **Project knowledgebase** | `knowledgebase/` | Why/how we're building the crew. You maintain it. |
| **Active state + decisions** | `knowledgebase/awareness/` | What's in flight right now + decisions captured mid-chat. See below. |
| **Company brain** | `traverum/brain` (external) | What Kip reads to answer questions about Veyond. Read-only for Kip. |
| **Conversation memory** | `data/sessions/kip/<chatId>.jsonl` | Per-chat message history for Kip. Last 15 exchanges. See [src/memory/conversation.ts](src/memory/conversation.ts). |
| **Agent seed facts (target)** | `agents/<name>/MEMORY.md` | Persona-specific seed facts. Not implemented yet. |
| **Global memory (target)** | `global_memory/` | Shared domain knowledge injected into every agent's prompt. Not implemented yet. |

### The awareness layer

```
knowledgebase/awareness/
  current.md          ← what's actively being built right now (updated each session)
  decisions/          ← one file per decision: YYYY-MM-DD-<slug>.md
```

**`current.md`** is the "where are we" snapshot. Git history of this file is the product timeline — `git log -p knowledgebase/awareness/current.md` answers "how did things look 2 days ago."

**`decisions/`** captures choices mid-chat before context is lost: what was decided, why, what was rejected. These stay here until significant enough to promote into the wiki.

**Slash commands:**
- `/wrap-up` — end of session: updates `current.md`, prompts to file pending decisions
- `/capture-decision` — writes a decision file immediately when something is resolved

---

## Where we are vs. where we're going

We're **mid-build**, heading toward the architecture described in the wiki. The current `src/` is the original `intern-bot` code; the target architecture (file-driven agents, MCP PostHog, per-agent configs) is the destination.

**Current state** (`src/`):
- Hardcoded system prompt in [src/claude/system-prompt.ts](src/claude/system-prompt.ts)
- Hand-rolled PostHog tools in [src/tools/posthog.ts](src/tools/posthog.ts)
- Single Telegram bot in [src/bot.ts](src/bot.ts), grammY coupled to the agent
- Brain read/write via GitHub API in [src/tools/brain-read.ts](src/tools/brain-read.ts) and [src/tools/brain-write.ts](src/tools/brain-write.ts)
- Session JSONL in [src/memory/conversation.ts](src/memory/conversation.ts)

**Target state** (not built yet — see [Agent Architecture](knowledgebase/wiki/concepts/agent_architecture.md)):
- `agents/kip/SOUL.md` + `MEMORY.md` + `config.ts` — persona and tools in files, not code
- `global_memory/BUSINESS.md` + `ANALYTICS_GUIDE.md` + `STATUS.md` — shared domain knowledge
- `src/agents/runAgent.ts` — pure `(agent, chatId, text) → reply`
- `src/agents/buildPrompt.ts` — assembles prompt with a cache boundary
- `src/agents/toolLoop.ts` — local tools + Anthropic MCP handling
- `src/gateway/telegram.ts` — the only file that imports grammY
- PostHog served entirely via official MCP (13 read-only tools); `src/tools/posthog.ts` gets deleted

**The 4-phase plan:** Foundations → MCP → UX polish → Multi-agent readiness. Full task list in [Roadmap](knowledgebase/wiki/roadmap.md). All phases currently ☐.

---

## How to work in this repo

**When making changes:**
- Code changes should move us toward the target architecture — don't entrench the current shape.
- Before a non-trivial architectural change, check the relevant wiki concept page. If the change contradicts it, flag that before coding.
- When the user makes a decision, offer to capture it: summarize → add to `knowledgebase/raw/` → ingest into wiki. Decisions that only live in chat are lost.

**When answering questions about the project:**
- Start from [`knowledgebase/wiki/index.md`](knowledgebase/wiki/index.md) and drill in.
- Cite wiki pages (and through them, raw sources).
- If the answer is a useful synthesis, offer to file it as a wiki page.

**What to read when:**

| To understand... | Read |
|-------------------|------|
| The vision | [`knowledgebase/NORTH_STAR.md`](knowledgebase/NORTH_STAR.md) |
| **What's actively in flight** | [`knowledgebase/awareness/current.md`](knowledgebase/awareness/current.md) |
| **Recent decisions** | [`knowledgebase/awareness/decisions/`](knowledgebase/awareness/decisions/) |
| Current state of the project | [`knowledgebase/wiki/overview.md`](knowledgebase/wiki/overview.md) |
| What we're building next | [`knowledgebase/wiki/roadmap.md`](knowledgebase/wiki/roadmap.md) |
| Open design decisions | [`knowledgebase/wiki/open_questions.md`](knowledgebase/wiki/open_questions.md) |
| Target code architecture | [`knowledgebase/wiki/concepts/agent_architecture.md`](knowledgebase/wiki/concepts/agent_architecture.md) |
| How the wiki is maintained | [`knowledgebase/AGENTS.md`](knowledgebase/AGENTS.md) |

---

## Principles to hold on to

- **Coworkers, not tools.** Personality is not decoration — it's what makes the product get used.
- **Files over code.** Swap `SOUL.md`, get a different agent. Don't build frameworks until a second agent forces it.
- **Read-only by default.** The crew never acts without being asked. Writes go through PRs, not silent edits.
- **Never hallucinate.** If Kip doesn't know, he says so and checks. Same rule applies to you.
- **The North Star wins.** If a decision drifts from it, flag it — don't silently accept.
