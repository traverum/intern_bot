# Veyond Crew Wiki — Operating Instructions

> Read this before touching any wiki file. This file tells you (the LLM) how the project is structured, what the workflow is, and how to handle conflicts.

For the **vision** read [`NORTH_STAR.md`](NORTH_STAR.md). For the **human-facing project intro** read [`README.md`](README.md). This file is for the **wiki maintainer**.

---

## The mental model

```
NORTH_STAR.md  ──────►  is the destination (the vision)
       │
       ▼
   raw/         ──────►  decision dump — humans drop things here, immutable
       │
       ▼  (you, the LLM, do this)
   wiki/        ──────►  clean, current, conflict-free synthesis
```

**Your job:** keep `wiki/` a faithful, clean, current synthesis of `raw/` (and only `raw/`) measured against the [`NORTH_STAR`](NORTH_STAR.md). When `raw/` changes, you update `wiki/`.

---

## Hard rules

1. **`NORTH_STAR.md` is the destination.** All wiki content should ultimately serve the vision. If a raw source contradicts the north star, flag it loudly. Don't silently accept drift.
2. **`raw/` is immutable.** You read; you never modify. Files there are a historical record.
3. **Newer decisions win.** When two raw sources disagree, the more recent source is authoritative.
4. **Conflicts must be flagged, not silently resolved.** Surface them in the conversation; mark superseded claims explicitly in the wiki; let the human confirm before overriding important decisions.
5. **The wiki must be clean.** No contradictions. No stale claims. No orphan pages. No broken cross-references.
6. **You own `wiki/` entirely.** You create, update, and delete pages there. You keep `wiki/index.md` and `wiki/log.md` current on every operation.

---

## Directory layout

```
veyond_crew/
├── NORTH_STAR.md            ← vision; humans own; you reference it
├── README.md                ← human-facing project intro
├── AGENTS.md                ← this file
├── raw/                     ← decision dump (immutable)
│   ├── prd_v2_veyond_crew.md
│   ├── ack_reaction.md
│   ├── system-prompt-architecture.md
│   └── vision.md
├── awareness/               ← short-lived, in-flight info (you maintain)
│   ├── current.md           ← what's actively being built; updated each session
│   └── decisions/           ← one file per decision: YYYY-MM-DD-<slug>.md
└── wiki/
    ├── index.md             ← content catalog (you maintain)
    ├── log.md               ← chronological operation log (append-only)
    ├── overview.md          ← top-level synthesis
    ├── roadmap.md           ← current plan
    ├── open_questions.md    ← unresolved decisions
    ├── sources/             ← one page per raw source
    ├── entities/            ← named things (agents, company, systems)
    └── concepts/            ← patterns, ideas, architectural decisions
```

---

## The awareness layer

`awareness/` captures short-lived, in-flight knowledge that doesn't belong in the permanent wiki yet.

### `current.md`

The "where are we right now" snapshot. Three sections:
- **What we're actively building** — specific files, features, in-progress work
- **What's blocked / waiting** — dependencies, open questions, parked items
- **What's next** — immediate next 2–3 steps

Update this file at the end of every work session (via `/wrap-up`). The git history of `current.md` is the product timeline — a future session can run `git log -p knowledgebase/awareness/current.md` to see how the state evolved over days.

### `decisions/YYYY-MM-DD-<slug>.md`

One file per resolved decision, created via `/capture-decision`. Format:

```markdown
---
date: YYYY-MM-DD
title: "Short decision title"
status: decided | superseded
---

## Decision
One sentence: what was decided.

## Why
The reasoning, constraints, tradeoffs.

## Alternatives considered
What else was on the table and why it was rejected.

## Links
- Relevant wiki pages (if any)
```

Decisions stay in `awareness/decisions/` until they're significant enough to promote into the wiki (via a standard ingest). Small implementation calls stay here permanently — that's fine.

---

## Page conventions

### Frontmatter
Every wiki page starts with YAML frontmatter:

```yaml
---
title: "Page Title"
category: entity | concept | source | synthesis | index
tags: [tag1, tag2]
sources: [prd_v2, vision]    # raw source slugs that inform this page
updated: YYYY-MM-DD
---
```

`sources` is the list of raw sources contributing to this page. When a new raw source updates a page, add its slug here.

### Cross-references
Use standard markdown links: `[Kip](../entities/kip.md)`. Every important claim should link to either another wiki page or its source page. Orphan pages (no inbound links) get flagged on lint.

### Citations
Inline citation format for claims drawn from a source: `([prd_v2](../sources/prd_v2.md))`. Use it on factual claims, not on every sentence.

### Conflict / supersede markers
This is the most important convention.

When a newer source contradicts an older claim, the wiki updates to reflect the newer position **and** marks the supersede explicitly:

```markdown
~~Old claim from older source.~~ **Superseded by [newer-source](../sources/newer-source.md) (YYYY-MM-DD):** New claim. The older claim was [reason it changed].
```

Do **not** silently delete the old claim. The wiki should record what changed and why, so future readers can trace the evolution.

### Status markers
Use sparingly at the top of a section if it's in flux:
- `> **Provisional:** ...` — not yet confirmed
- `> **Stale:** ...` — newer source likely contradicts; not yet reconciled
- `> **Conflict (unresolved):** ...` — two sources disagree, no decision yet

---

## Operations

### Update current state (`/wrap-up`)

At the end of a work session:

1. Read `awareness/current.md`.
2. Read `git diff HEAD` and `git log --oneline -10` to understand what changed.
3. Rewrite `current.md` — updated date, current in-progress work, blockers, next steps. Keep it specific and dense.
4. Scan the conversation for uncaptured decisions. For each one, ask the user if they want it filed.

### Capture a decision (`/capture-decision`)

When the user resolves a tradeoff or makes an architectural choice:

1. Create `awareness/decisions/YYYY-MM-DD-<slug>.md` with the decision, why, and alternatives considered.
2. Confirm the path. No other files need updating.

### Promote a decision to the wiki

When a decision in `awareness/decisions/` is significant enough to be permanent knowledge:

1. Treat it like a source: create `wiki/sources/<slug>.md`, update affected entity/concept pages.
2. Append to `wiki/log.md` with operation `promote | <title>`.
3. The decision file in `awareness/decisions/` can be left as-is (it's a record, not a source of truth).

### Ingest a new source

When the human says "ingest `raw/<filename>`":

1. **Read the source in full.**
2. **Discuss key takeaways** with the human in the conversation. Don't just dump everything into files. Surface what's interesting, what's surprising, what's missing.
3. **Cross-reference against existing wiki pages.** Search the wiki for related claims. For each claim in the new source:
   - **Net-new claim** → integrate into the relevant page.
   - **Reinforces existing claim** → add a citation to the new source on the existing page.
   - **Contradicts existing claim** → **STOP and flag**. Show the human both claims, the dates, and propose the resolution (default: newer wins). Wait for confirmation before applying.
4. **Check against [`NORTH_STAR`](NORTH_STAR.md).** If the source proposes something that drifts from the vision, flag it. Don't silently accept.
5. **Write a source-summary page** at `wiki/sources/<slug>.md` — extracts key claims, lists pages updated.
6. **Update affected wiki pages** — entity pages, concept pages, roadmap, open questions.
7. **Update `wiki/index.md`** with the new source page entry and incremented source count for any updated pages.
8. **Append to `wiki/log.md`** with a `## [YYYY-MM-DD] ingest | <title>` header listing pages touched, key takeaways, and any conflicts surfaced.

A typical ingest touches 3–10 wiki pages.

### Answer a query

When the human asks a question:

1. Read `wiki/index.md` first to find candidate pages.
2. Read those pages.
3. Synthesize an answer with inline citations to wiki pages (and through them, to raw sources).
4. If the answer is non-trivial (a comparison, an analysis, a connection), **offer to file it** as a new wiki page or section. Good answers shouldn't disappear into chat history.

### Lint the wiki

When the human says "lint the wiki":

1. **Broken links** — internal links that point to non-existent pages.
2. **Orphan pages** — pages with no inbound links from any other page.
3. **Stale claims** — pages where a newer source has likely superseded a claim that wasn't marked.
4. **Conflicts** — claims across pages that disagree.
5. **Missing concepts** — terms mentioned across multiple pages but lacking their own page.
6. **Coverage gaps** — open questions, raw sources not yet ingested, areas where the wiki is thin relative to its sources.
7. **Drift from `NORTH_STAR`** — wiki content that no longer serves the vision.

Append a `## [YYYY-MM-DD] lint | <summary>` entry to `wiki/log.md` with findings.

---

## Conflict resolution — the core workflow

This is the part that makes the dump-to-wiki pipeline work. Get this right.

### The default rule
**Newer raw source wins** when two sources disagree. Date is determined by:
1. Explicit date in the source frontmatter or content.
2. File creation/modification date as fallback.
3. If unknown — **ask the human**.

### When to apply automatically
- **Implementation detail changes** (e.g. "we now use MCP instead of hand-rolled tools"). Apply, mark old version superseded.
- **Refinements** (e.g. "the allowlist is now 13 tools, not 6"). Apply, note the change.
- **Renaming / restructuring** (e.g. file paths, directory names). Apply.

### When to STOP and ask
- **Vision-level shifts** that may conflict with [`NORTH_STAR`](NORTH_STAR.md).
- **Reversed decisions** (e.g. "actually we're going back to hand-rolled tools").
- **Strategic pivots** (e.g. agent #2 is now a different role).
- **Unclear which source is newer** — ask the human to clarify dates or intent.
- **The change would invalidate >3 existing pages** — large blast radius warrants confirmation.

### How to mark a supersede in the wiki

```markdown
### PostHog tools

~~Kip uses 6 hand-rolled PostHog tools (`src/tools/posthog.ts`).~~
**Superseded by [prd_v2](../sources/prd_v2.md) (2026-04-17):** Kip uses
PostHog's official MCP server with a 13-tool read-only allowlist.
Hand-rolled tools are deleted. See [PostHog MCP](../concepts/posthog_mcp.md).
```

The strikethrough preserves history; the bold supersede line explains the why and where; a link points to the new authoritative content.

---

## Log format

Each log entry uses a parseable header:

```
## [YYYY-MM-DD] <operation> | <title>
```

Operations: `ingest`, `query`, `lint`, `edit`, `conflict-resolved`.

Quick recent-entries grep:
```bash
grep "^## \[" wiki/log.md | tail -10
```

Each entry should include: source(s) involved, pages touched, key takeaways, and any conflicts surfaced or resolved.

---

## Index format

`wiki/index.md` lists every wiki page with:
- Link
- One-line description
- Source count (how many raw sources inform this page)

Organized by category. Update on every page creation, deletion, or source addition.

---

## Style guidelines

- Pages are dense but scannable. Headers, bullet lists, tables freely.
- Short, precise sentences. No filler. No "in this section we will discuss".
- Every factual claim from a source gets a citation: `([source-slug](../sources/source-slug.md))`.
- A 150-word complete page beats a 500-word repetitive one.
- The wiki is for you and the human — not for publication. Write for clarity and precision.
- Match the tone of the [`NORTH_STAR`](NORTH_STAR.md) where appropriate — direct, opinionated, not corporate.

---

## What you do NOT do

- Do not edit files in `raw/` ever.
- Do not silently resolve conflicts — flag them.
- Do not write documentation files (READMEs, etc.) outside `wiki/` unless explicitly asked.
- Do not invent sources or claims that aren't in `raw/` or [`NORTH_STAR`](NORTH_STAR.md).
- Do not let the wiki drift from the [`NORTH_STAR`](NORTH_STAR.md) without flagging.
