# Veyond Crew

> A team of AI coworkers for [Veyond](wiki/entities/veyond.md). Read [`NORTH_STAR.md`](NORTH_STAR.md) for the vision.

This repo holds two things:
1. The **knowledge** that drives the project (vision, decisions, plans, architecture).
2. The **code** that implements it (agent runners, gateways, tool integrations).

This README is for any agent — human or AI — that opens this repo. Read it first.

---

## How this project is organized

```
veyond_crew/
├── NORTH_STAR.md           ← The vision. Lives at the root. Everything aims at this.
├── README.md               ← You are here.
├── AGENTS.md               ← Operating instructions for the LLM wiki maintainer.
│
├── raw/                    ← DECISION DUMP. Drop anything here. Raw thoughts, plans, PRDs,
│                              meeting notes, screenshots, slack threads. No structure required.
│                              Files here are immutable inputs — never edited after drop.
│
├── wiki/                   ← THE CLEAN, CURRENT VIEW. Synthesized from raw/.
│   ├── index.md            ← Catalog of all wiki pages.
│   ├── log.md              ← Chronological record of all wiki operations.
│   ├── overview.md         ← Top-level synthesis.
│   ├── roadmap.md          ← Current plan.
│   ├── open_questions.md   ← Unresolved decisions.
│   ├── sources/            ← One page per ingested raw doc.
│   ├── entities/           ← Named things (agents, company, systems).
│   └── concepts/           ← Patterns, ideas, architectural decisions.
│
└── (code lives here when implementation starts: src/, agents/, global_memory/)
```

---

## The two-layer model

### `raw/` — the decision dump
Drop things here as they happen. Plans. PRDs. Meeting notes. "Here's what I'm thinking." Screenshots from a Slack thread. A scribbled paragraph after a phone call. Anything.

**Rules:**
- Files in `raw/` are **immutable**. Once dropped, they're never edited. They're a historical record.
- No structure required. Filename should hint at the date or topic. That's enough.
- Don't worry about contradictions, duplications, or messiness. That's the wiki's job to resolve.

### `wiki/` — the clean view
The wiki is the **current, synthesized, conflict-free view** of everything in `raw/` plus the [`NORTH_STAR`](NORTH_STAR.md). Maintained by an LLM agent (instructions in [`AGENTS.md`](AGENTS.md)).

**Rules:**
- The wiki should always be **clean** — no contradictions, no stale claims, no orphan pages.
- **Newer decisions win.** When two raw sources disagree, the more recent one is authoritative. The wiki reflects the newer position; the older claim is marked `~~superseded~~` with a citation.
- Conflicts must be **flagged** when ingesting, not silently resolved. The human reviews before anything overrides anything.
- The wiki is for humans to read and LLMs to query. Pages are dense, scannable, and well-cross-referenced.

---

## The workflow

```
You drop a thing into raw/
       ↓
You tell the LLM: "ingest raw/<filename>"
       ↓
LLM reads it, discusses key takeaways with you
       ↓
LLM writes a source-summary page in wiki/sources/
       ↓
LLM scans existing wiki pages for related claims
       ↓
If there's a conflict with an older source:
   → LLM flags it explicitly, asks before deciding
   → Default: newer wins, older marked superseded
       ↓
LLM updates entities, concepts, roadmap, etc.
       ↓
LLM updates wiki/index.md and appends to wiki/log.md
```

Other operations:
- **Query.** "What's our PostHog allowlist?" → LLM reads `wiki/index.md`, drills into relevant pages, answers with citations.
- **Lint.** "Lint the wiki." → LLM checks for contradictions, stale claims, orphan pages, missing concepts, broken links.
- **Promote a query result.** Useful answers can be filed back into the wiki as new pages so the knowledge compounds.

Full schema and conventions live in [`AGENTS.md`](AGENTS.md).

---

## What humans own
- The [`NORTH_STAR`](NORTH_STAR.md) — the vision. Edit when the vision genuinely shifts.
- `raw/` — the dump. Add to it freely.
- `AGENTS.md` — co-evolved with the LLM as conventions mature.
- Strategic direction: what to investigate, what questions to ask, what the synthesis should emphasize.

## What the LLM owns
- Everything under `wiki/`. Creates pages, updates them, maintains cross-references, deletes stale pages.
- Keeps `wiki/index.md` and `wiki/log.md` current.
- Flags conflicts explicitly; never silently overrides.

## What nobody owns yet
- Implementation code. The wiki describes the target architecture (see [Agent Architecture](wiki/concepts/agent_architecture.md)); the code that implements it lives elsewhere or hasn't been written yet.

---

## Quick reference

| If you want to... | Read |
|-------------------|------|
| Understand the vision | [`NORTH_STAR.md`](NORTH_STAR.md) |
| Get the high-level picture of where we are | [`wiki/overview.md`](wiki/overview.md) |
| See the current plan | [`wiki/roadmap.md`](wiki/roadmap.md) |
| See what's unresolved | [`wiki/open_questions.md`](wiki/open_questions.md) |
| Know how to maintain the wiki | [`AGENTS.md`](AGENTS.md) |
| Browse all wiki pages | [`wiki/index.md`](wiki/index.md) |
| See what was decided when | [`wiki/log.md`](wiki/log.md) |

---

## A note on the model

This setup follows the "LLM Wiki" pattern: instead of RAG over raw documents at query time, an LLM incrementally builds a persistent, structured wiki that compounds with every source you add. The wiki is the artifact; `raw/` is the substrate; the LLM is the maintainer. You curate and ask; the LLM does the bookkeeping.

The wiki gets richer over time. Stale claims get marked. Contradictions get surfaced. The synthesis stays current because the cost of maintenance is near zero.
