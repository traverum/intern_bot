# Wiki Log

Append-only record of all wiki operations. Each entry uses the format `## [YYYY-MM-DD] <operation> | <title>` for parseability.

To see recent entries:
```bash
grep "^## \[" wiki/log.md | tail -10
```

---

## [2026-04-18] update | PostHog perfection session — grounding, instrumentation, two-tool-paths

**Trigger:** User session focused on "perfecting PostHog." No new raw source ingested; synthesis + decisions captured directly.

**Decisions captured (all in `awareness/decisions/`):**
- `2026-04-18-posthog-instrumentation-v1.md` — add `experience_viewed` + confirm super-properties; defer everything else (no checkout/payment/cancel events in v1).
- `2026-04-18-two-posthog-tool-paths.md` — Anthropic uses MCP connector, OpenAI uses local tools, accept drift; explicitly **don't** build a local MCP client.
- `2026-04-18-perfecting-posthog-plan.md` — 8-axes framing; grounding matters more than tool access.

**Global memory rewrites:**
- `global_memory/BUSINESS.md` — full rewrite. Channels, commission split (8% platform, ~12% hotel, supplier rest), core nouns, personas, happy path.
- `global_memory/ANALYTICS_GUIDE.md` — full rewrite. 3 real events (`$pageview`, `experience_viewed`, `booking_confirmed`), 4 super-properties, 7 pitfalls (Helsinki tz, multi-currency, `$revenue`=gross, clean epoch at commit `1d787d0`, etc.), Monday-question playbook, known gaps.

**Wiki updates:**
- `wiki/concepts/posthog_mcp.md` — renamed conceptually to "PostHog Tool Access"; rewrote to document both paths and why we don't build a local MCP client.
- `wiki/entities/veyond.md` — domain section rewritten. Fixed stale claims ("Weekly booking digest / Checkout funnel v3 / Supplier engagement" insights — none exist yet). Added channels, commission, nouns, pitfalls. Points at `BUSINESS.md` + `ANALYTICS_GUIDE.md` as sources of truth.
- `wiki/entities/kip.md` — PostHog capabilities rewritten to reflect two tool paths + the 4 Monday questions; current-vs-target table updated to reflect Phase 1 done.
- `wiki/roadmap.md` — added Phase 0 (grounding + instrumentation, mostly ✅). Phase 1 marked done. Phase 2 "delete local tools" tasks reversed (local tools stay permanent). New Phase 2b for evals. Non-goals list now excludes local MCP client.
- `wiki/overview.md` — status updated to 2026-04-18. Decisions table added two rows (two-paths, grounding > tools).
- `wiki/open_questions.md` — Q1 (saved insight governance) superseded. Q6 (internal-traffic exclusion) and Q7 (when to revisit local MCP client) added. Resolved section expanded.
- `wiki/index.md` — link to awareness layer, renamed PostHog page, bumped stats.

**Current state:** `awareness/current.md` rewritten — clear ordered list of what to build next, starting with widget PR verification and the PostHog MCP API key.

**Key insight from session:** The 4 Monday-morning questions the team actually asks mapped against existing instrumentation revealed that 2 of the 4 couldn't be answered — not for lack of tools but for lack of events. "Perfect PostHog" starts at instrumentation and domain grounding, not at MCP vs local. Reframes Phase 2 from "wire up MCP" to "measure the outcome after Phase 0 grounding lands."

**Pages touched:** 11 wiki/awareness + 2 global_memory + 3 new decision files = 16 files.

---

## [2026-04-17] ingest | PRD v2 — Veyond Crew

**Source:** `raw/prd_v2_veyond_crew.md`
**Operation:** Initial wiki setup and first source ingest.

**Pages created:**
- `wiki/overview.md` — top-level synthesis
- `wiki/roadmap.md` — 4-phase roadmap extracted from PRD §8
- `wiki/open_questions.md` — 5 open questions from PRD §11
- `wiki/sources/prd_v2.md` — source summary page
- `wiki/entities/kip.md` — Kip agent entity page
- `wiki/entities/veyond.md` — Veyond company entity page
- `wiki/concepts/agent_architecture.md` — file-driven agent architecture
- `wiki/concepts/posthog_mcp.md` — PostHog MCP integration strategy
- `wiki/concepts/prompt_caching.md` — system prompt assembly + cache boundary
- `wiki/concepts/multi_agent_design.md` — multi-agent scaling design
- `wiki/index.md` — content catalog
- `wiki/log.md` — this file

**Key takeaways from source:**
- PRD v2 is a refactor + capability upgrade, not a rewrite. Existing `intern-bot` codebase is the starting point.
- Big architectural bet: PostHog via MCP connector (13 read-only tools) replaces 6 hand-rolled tools.
- File-driven agents: editing `SOUL.md` + restart = new persona, zero code changes.
- Three decoupling boundaries: agent boundary (pure runAgent), gateway boundary (Telegram-only in telegram.ts), cache boundary (stable content above `<!-- VEYOND_CACHE_BOUNDARY -->`).
- Multi-agent readiness is Phase 4 — agent #2 should take one day to bootstrap.

**Pages touched:** 12 (all new)

---

## [2026-04-17] ingest | Kip — Ack Reaction Pattern

**Source:** `raw/ack_reaction.md`

**Pages created:**
- `wiki/sources/ack_reaction.md` — source summary
- `wiki/concepts/ack_reaction.md` — grammY implementation, OpenClaw comparison, decision log

**Pages updated:**
- `wiki/entities/kip.md` — ack implementation detail, link to concept page
- `wiki/index.md` — new entries

**Key takeaways:**
- The `👀` ack pattern solves the 10–20s UX dead zone during tool calls.
- Fire `ctx.react()` non-blocking; remove in `finally`; catch errors on both sides.
- `ctx.react("")` is the grammY way to clear a reaction.
- OpenClaw's `didAck` check is worth adopting if Kip gets used in groups with variable bot permissions.
- Emoji should come from `agentConfig.ackEmoji`, not be hardcoded.
- Decision: `removeAfterReply: true` — reaction is a transient "working" signal, not a permanent marker.

**Pages touched:** 4

---

## [2026-04-17] ingest | OpenClaw System Prompt Architecture

**Source:** `raw/system-prompt-architecture.md`

**Pages created:**
- `wiki/sources/system_prompt_architecture.md` — source summary

**Pages updated:**
- `wiki/concepts/prompt_caching.md` — major rewrite: compiler metaphor, full 11-section skeleton, context file priority map, static vs dynamic split, prompt modes (full/minimal/none), Execution Bias verbatim text, Skills on-demand pattern, implementation sketch
- `wiki/concepts/agent_architecture.md` — skills on-demand section, prompt modes section
- `wiki/entities/kip.md` — richer prompt structure description, prompt modes reference
- `wiki/index.md` — updated source count and entries

**Key takeaways:**
- `buildSystemPrompt` is a **compiler** — fixed structure, variable content. This framing matters.
- The 11-section skeleton is fixed across all agents; only `# Project Context` varies.
- Context file priority: soul.md=20 (highest), memory.md=70 (lowest). Soul gets a special instruction.
- Prompt modes: `full` for main agents, `minimal` for subagents (tooling+workspace only), `none` for bare completions.
- Static files above cache boundary; dynamic files (STATUS.md equivalent) below. Never volatile state in SOUL.md.
- Execution Bias section is critical behavioral nudge — without it agents plan instead of act. Copied verbatim.
- Skills are fetched on demand (scan → pick one → read), not pre-loaded. Keeps base prompt lean.
- Runtime line: dense, one line, covers agent/host/model/channel/capabilities/thinking.

**Pages touched:** 5

---

## [2026-04-17] ingest | Vision — North Star

**Source:** `/NORTH_STAR.md` (lives at repo root, not in `raw/` — special status as the project's vision/destination)

**Project-level changes (outside the wiki):**
- Created `/NORTH_STAR.md` — the vision document.
- Created `/README.md` — human-facing project intro explaining the dump→wiki workflow.
- Rewrote `/AGENTS.md` to reflect the new operating model: `raw/` is an immutable decision dump; `wiki/` is the clean synthesized view; conflicts must be flagged not silently resolved; newer decisions win by default; `NORTH_STAR.md` is authoritative when other sources drift.

**Wiki pages created:**
- `wiki/sources/vision.md` — source-summary page with key claims, "what it isn't" non-negotiables, future crew roster, and a constraints table mapping vision claims to build implications.

**Wiki pages updated:**
- `wiki/overview.md` — rewritten with vision-first framing. Added "What we're optimizing for" table (coworkers vs tools, voice vs generic chatbot, etc.). Added decisions table linking each architectural choice to its source.
- `wiki/entities/kip.md` — added vision framing: "the intern, twenty-something energy, quick with a joke." Promoted Kip's "two jobs" (knows the numbers, knows the company) to a top section. Added "what good looks like" with concrete success scenarios. Strengthened the "what Kip cannot do" with non-autonomy as a hard constraint per north star.
- `wiki/entities/veyond.md` — reframed as the company + the envisioned crew. Expanded agent roster table to include Archivist, Ops, Supplier-facing as envisioned roles per vision.
- `wiki/index.md` — added vision source, updated source counts, added preamble linking to root-level files.

**Conflicts surfaced:** None. The vision is consistent with PRD v2 — the PRD is essentially the implementation plan for the vision. The PRD's "files over code" and "scale through composition" principles directly serve the vision's "adding agent #2 takes a day."

**Key takeaways:**
- Vision is now the **authoritative anchor**. PRD v2 and other sources are implementation detail in service of it.
- The "personality is not decoration" claim is load-bearing: it justifies investment in voice/UX (ack reaction, SOUL.md tuning, chat-length replies) — not just accuracy.
- Hard non-negotiables from vision: not autonomous, never spends money, never sends emails without checking. These constrain every future agent design, not just Kip.
- Future crew roster is now documented: Kip (analyst), Archivist (docs), Ops (operations), Supplier-facing.
- New project workflow: `raw/` = dump anything, `wiki/` = clean synthesis, `NORTH_STAR.md` = the destination, `AGENTS.md` = operating instructions for the LLM maintainer.

**Pages touched:** 8 (3 root files + 1 new wiki source + 4 wiki updates)
