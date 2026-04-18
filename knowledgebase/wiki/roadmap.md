---
title: "Roadmap"
category: synthesis
tags: [roadmap, phases, milestones, kip]
sources: [prd_v2]
updated: 2026-04-18
---

# Roadmap

Plan to get [Kip](entities/kip.md) to "delightful" and prove the [multi-agent architecture](concepts/multi_agent_design.md). ([prd_v2](sources/prd_v2.md))

> **Current state:** [`awareness/current.md`](../awareness/current.md) is the live snapshot — check there for what's actually in flight. Roadmap is the plan; `current.md` is the status.

---

## Phase 0 · Grounding + Instrumentation (done this session, one widget PR pending)
**Goal:** Make Kip useful by fixing what he *knows*, not what tools he has.

**Rationale:** A great tool set on a bad prompt hallucinates event names. The gap that broke Kip's usefulness was (a) two-event instrumentation and (b) thin domain docs, not MCP vs local. See [perfecting-posthog-plan decision](../awareness/decisions/2026-04-18-perfecting-posthog-plan.md).

| Task | Status |
|------|--------|
| Rewrite `global_memory/BUSINESS.md` — channels, commission, core nouns, personas, happy path | ✅ |
| Rewrite `global_memory/ANALYTICS_GUIDE.md` — events, super-properties, pitfalls, Monday-question playbook | ✅ |
| Confirm widget super-properties (`channel`, `hotel_config_id`, `hotel_slug`, `hotel_name`) | ✅ (already in `PostHogHotelContext`) |
| Ship `PostHogExperienceViewed` + wire into both detail-page routes (widget repo) | ⏳ in widget PR |
| Set PostHog project timezone to `Europe/Helsinki` | ☐ (do from Kip side once MCP key lands) |

---

## Phase 1 · Foundations
**Goal:** The refactor that made everything else easy. **Done** — file-driven agents, pure runAgent, Telegram gateway isolation.

| Task | Status |
|------|--------|
| `agents/kip/SOUL.md`, `MEMORY.md`, `config.ts` | ✅ |
| `global_memory/BUSINESS.md`, `ANALYTICS_GUIDE.md` (v1 seeded) | ✅ (Phase 0 rewrite above) |
| `src/agents/buildPrompt.ts` — cache boundary, prompt compiler | ✅ |
| `src/agents/toolLoop.ts` — local tools + MCP handling | ✅ |
| `src/agents/runAgent.ts` — pure `(agent, chatId, text) → reply` | ✅ |
| `src/gateway/telegram.ts` — mention gating + reply only | ✅ |
| Provider abstraction — `LLM_PROVIDER=anthropic|openai` | ✅ (see [decision](../awareness/decisions/2026-04-18-provider-abstraction-and-tool-mode.md)) |
| `TOOL_MODE=local|mcp` switch | ✅ |
| Cache boundary + `cache_control` on stable portion | ✅ |

---

## Phase 2 · PostHog MCP Integration
**Goal:** Wire the MCP connector on Anthropic. No new tool code.

**Done when:** "Which experiences got the most views last week?" returns an accurate answer on Anthropic with `TOOL_MODE=mcp`, visible in admin.

| Task | Status |
|------|--------|
| Create PostHog API key with "MCP Server" preset | ☐ |
| Populate `POSTHOG_MCP_AUTH_TOKEN` in `.env` | ☐ |
| Define `ALLOWLIST` constant in `agents/kip/config.ts` — the 13 tools | ☐ |
| Verify `mcp_servers` param + `anthropic-beta` header work end-to-end | ☐ |
| Log `mcp_tool_use` blocks with name + input to token log | ☐ |
| Admin UI — show MCP tool calls with distinct tag | ☐ |
| Smoke-test the 4 Monday-morning questions | ☐ |
| PII audit: review Veyond's `posthog.capture()` properties | ☐ |

### Task changes vs. original PRD v2 plan
- ~~**Delete `src/tools/posthog.ts`**~~ — **reversed.** The 6 local tools stay as OpenAI's fallback and Anthropic's escape hatch. See [two-posthog-tool-paths decision](../awareness/decisions/2026-04-18-two-posthog-tool-paths.md).
- ~~**Delete `posthogTools` from `src/claude/tools.ts`**~~ — **reversed**, same reason.
- ~~**Delete PostHog dispatcher entries**~~ — **reversed**, same reason.

---

## Phase 2b · Evals (new)
**Goal:** Measurement that makes every subsequent change falsifiable.

**Done when:** `pnpm eval:posthog` runs the 4 Monday questions against both providers, diffs tool-call sequences and reply correctness against a baseline.

| Task | Status |
|------|--------|
| Write `evals/posthog/monday.jsonl` — 4 questions, expected tool sequences, expected facts | ☐ |
| Eval harness runner | ☐ |
| Baseline Anthropic (MCP) + Anthropic (local) + OpenAI (local) | ☐ |

Deferred until Phase 2 lands — no point evaluating an unreleased tool path.

---

## Phase 3 · UX Polish
**Goal:** Make Kip pleasant to talk to.

**Done when:** Telegram UX feels native — ack is instant, replies are chat-length, errors surface cleanly.

| Task | Status |
|------|--------|
| Ack reaction (`👀` on receive, clear on reply) per `KIP_ACK_REACTION.md` | ☐ |
| Replace hard-coded `"typing"` action with the ack pattern | ☐ |
| `/reset` command (archives session JSONL for current chat) | ☐ |
| `/stats` command for chat owners | ☐ |
| Tune `SOUL.md` for 1–3 line Telegram replies by default | ☐ |
| Handle `mcp_tool_result` with `is_error=true` gracefully | ☐ |

Not before the eval baseline — don't tune prompts without a metric.

---

## Phase 4 · Second-Agent Readiness
**Goal:** Prove the architecture. If adding agent #2 takes one day, the design is right.

**Done when:** Adding agent #3 is a folder copy + token registration + BotFather chat.

| Task | Status |
|------|--------|
| Define `agents/<n>/config.ts` schema formally | ☐ |
| Rename `TELEGRAM_BOT_TOKEN` → `KIP_BOT_TOKEN` | ☐ |
| Registry: `gateway/telegram.ts` reads `agents/*/config.ts`, spawns one `Bot` per agent | ☐ |
| Bootstrap stub agent #2 with deliberately different MCP allowlist | ☐ |
| Verify: two bots, two tokens, two SOULs, two allowlists, same codebase | ☐ |

---

## Non-goals (for now)

- Brain write PRs — Kip is read-only. Future `Archivist`.
- Self-hosting PostHog MCP.
- Subagent handoff between agents.
- Custom HogQL authoring by Kip (use `query-generate-hogql-from-question`).
- Skills-on-demand file loading.
- Inter-agent messaging.
- Voice / canvas / multimodal.
- Scheduled cron digests.
- **Local MCP client for provider parity** (explicitly rejected this session — see [decision](../awareness/decisions/2026-04-18-two-posthog-tool-paths.md)).

---

## Success metrics (1 month post-ship)

| Metric | Target |
|--------|--------|
| P50 latency — PostHog questions | Under 8s |
| P50 latency — chat-only | Under 4s |
| Accuracy | Every metric traces to a tool call; zero hallucinated event names |
| Coverage | The 4 Monday questions + bookings/funnels/errors/dashboards |
| Vibe | Team members screenshot replies because they're funny or useful |
| Extensibility | Agent #2 takes one day or less |
| Token cost | Avg PostHog question under 6k tokens |

---

## Related pages
- [`awareness/current.md`](../awareness/current.md) — live status
- [Kip](entities/kip.md)
- [Agent Architecture](concepts/agent_architecture.md)
- [PostHog Tool Access](concepts/posthog_mcp.md)
- [Multi-Agent Design](concepts/multi_agent_design.md)
- [Open Questions](open_questions.md)
