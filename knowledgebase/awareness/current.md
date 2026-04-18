---
updated: 2026-04-18
---

# Current State

> What's actively in flight. Updated at the end of every work session via `/wrap-up`.
> Git history of this file = product state over time. Run `git log -p knowledgebase/awareness/current.md` to time-travel.

---

## What we're actively building

**Phase 1 foundations are in place.** `src/agents/` (runAgent, buildPrompt, toolLoop), `src/gateway/telegram.ts`, and `agents/kip/` (SOUL, MEMORY, config) are all wired up. The bot runs end-to-end on the new architecture.

**Provider abstraction landed this session** (see [decisions/2026-04-18-provider-abstraction-and-tool-mode.md](decisions/2026-04-18-provider-abstraction-and-tool-mode.md)):

- `src/providers/` — `types.ts` (normalized message format), `anthropic.ts`, `openai.ts`, `index.ts` (router)
- `LLM_PROVIDER=anthropic|openai` selects provider; model/key resolved accordingly
- `TOOL_MODE=local|mcp` toggles hand-rolled PostHog tools vs MCP (MCP requires Anthropic)
- Memory format migrated to `NormalizedMessage`; files versioned `.v2.jsonl` (old sessions archived on disk, not read)
- Prompt caching preserved on Anthropic via `<!-- VEYOND_CACHE_BOUNDARY -->` marker split in the adapter
- `src/utils/token-log.ts` now records `provider`, `toolMode`, `model` per operation — ready for MCP-vs-local comparison

---

## What's blocked / waiting

- **OpenAI path smoke test** — code compiles clean, not yet exercised against a live OpenAI key. Need to confirm text-only + local tool round-trip works on a real model (gpt-5 / gpt-4o).
- **PostHog MCP auth token** — `POSTHOG_MCP_AUTH_TOKEN` env var wired through but not populated. Required before `TOOL_MODE=mcp` can activate.
- **Anthropic billing** — still the trigger that motivated the provider work. Unblocked independently of this codebase.
- `global_memory/` files — `BUSINESS.md`, `ANALYTICS_GUIDE.md`, `STATUS.md` still thin (pre-existing gap).

---

## What's next

1. Populate `.env` with an OpenAI key + `LLM_PROVIDER=openai` + `LLM_MODEL=<model>` and smoke-test Kip end-to-end (text reply, brain tool call, posthog local tool call).
2. Once Anthropic billing is unblocked OR a PostHog MCP token is available: run a side-by-side comparison — same question, both modes, diff the `token-log.jsonl` entries by `toolMode`.
3. Start Phase 2 proper: evaluate whether MCP's 13-tool read-only allowlist justifies retiring `src/tools/posthog.ts`, or whether local tools remain competitive on tokens.
