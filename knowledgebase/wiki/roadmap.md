---
title: "Roadmap"
category: synthesis
tags: [roadmap, phases, milestones, kip]
sources: [prd_v2]
updated: 2026-04-17
---

# Roadmap

4-phase plan to get [Kip](entities/kip.md) to "delightful" and prove the [multi-agent architecture](concepts/multi_agent_design.md). Horizon: 4–5 weeks. ([prd_v2](sources/prd_v2.md))

---

## Phase 1 · Foundations (Week 1)
**Goal:** The refactor that makes everything else easy.

**Done when:** Editing `agents/kip/SOUL.md` and restarting picks up the new persona with zero code changes.

| Task | Status |
|------|--------|
| Create `agents/kip/SOUL.md`, `MEMORY.md`, `config.ts` | ☐ |
| Create `global_memory/BUSINESS.md`, `ANALYTICS_GUIDE.md` (hand-seeded) | ☐ |
| Write `src/agents/buildPrompt.ts` — assembles prompt from files, inserts cache boundary | ☐ |
| Write `src/agents/toolLoop.ts` — local tools + parses `mcp_tool_use`/`mcp_tool_result` | ☐ |
| Write `src/agents/runAgent.ts` — pure `(agent, chatId, text) → reply` | ☐ |
| Slim `src/bot.ts` → `src/gateway/telegram.ts` — mention gating + reply only | ☐ |
| Remove `brain_write_files` from Kip's toolbelt (keep code, skip registration) | ☐ |
| Insert cache boundary marker + `cache_control` on stable portion of prompt | ☐ |

**Key principle enforced:** Files over code. Swap `SOUL.md`, get a different agent.

---

## Phase 2 · MCP PostHog Integration (Week 2)
**Goal:** Wire up the MCP connector. No new tool code.

**Done when:** "How many bookings last week broken down by day?" returns an accurate answer with the MCP tool call visible in admin.

| Task | Status |
|------|--------|
| Create PostHog API key with "MCP Server" preset, scoped to Veyond project | ☐ |
| Add `POSTHOG_MCP_API_KEY` + `POSTHOG_PROJECT_ID` to `.env.example` and config schema | ☐ |
| Define `ALLOWLIST` constant in `agents/kip/config.ts` — the 13 tools | ☐ |
| Update `toolLoop.ts` to add `mcp_servers` param + `anthropic-beta: mcp-client-2025-11-20` header | ☐ |
| Log `mcp_tool_use` blocks with name + input to token log for admin visibility | ☐ |
| **Delete** `src/tools/posthog.ts` | ☐ |
| **Delete** `posthogTools` array from `src/claude/tools.ts` | ☐ |
| **Delete** PostHog-related entries from `src/tools/index.ts` dispatcher | ☐ |
| Update admin UI to show MCP tool calls with distinct tag/color | ☐ |
| PII audit: review Veyond's `posthog.capture()` calls, document sensitive properties | ☐ |

**Key principle enforced:** Buy, don't build. Delete 6 hand-rolled tools; gain 13 better ones.

---

## Phase 3 · UX Polish (Week 3)
**Goal:** Make Kip pleasant to talk to.

**Done when:** Telegram UX feels native — ack is instant, replies are chat-length, errors surface cleanly.

| Task | Status |
|------|--------|
| Add ack reaction (`👀` on receive, clear on reply) per `KIP_ACK_REACTION.md` | ☐ |
| Replace hard-coded `"typing"` action with the ack reaction pattern | ☐ |
| Add `/reset` command (archives session JSONL for current chat) | ☐ |
| Add `/stats` command for chat owners | ☐ |
| Tune `SOUL.md` for 1–3 line Telegram replies by default (current prompt is too "report-y") | ☐ |
| Handle `mcp_tool_result` with `is_error=true` gracefully — surface errors to user | ☐ |

---

## Phase 4 · Second-Agent Readiness (Week 4)
**Goal:** Prove the architecture. If adding agent #2 takes one day, the design is correct.

**Done when:** Adding agent #3 is a folder copy + token registration + BotFather chat.

| Task | Status |
|------|--------|
| Define `agents/<n>/config.ts` schema formally | ☐ |
| Rename `TELEGRAM_BOT_TOKEN` → `KIP_BOT_TOKEN` | ☐ |
| Registry: `gateway/telegram.ts` reads `agents/*/config.ts`, spawns one `Bot` per agent | ☐ |
| Bootstrap stub agent #2 with a deliberately different MCP allowlist | ☐ |
| Verify: two bots, two tokens, two SOULs, two allowlists, same codebase, zero duplicated logic | ☐ |

---

## Non-goals (for this PRD)
These are explicitly out of scope — not forgotten, just not now:

- Brain write PRs — Kip is read-only. Future `Archivist` agent.
- Self-hosting the PostHog MCP server.
- Subagent / handoff between agents.
- Custom HogQL writing by Kip (use `query-generate-hogql-from-question`).
- Skills-on-demand file loading.
- Inter-agent messaging.
- Voice / canvas / multimodal.
- Scheduled cron digests (architecture supports them; Phase 5+).
- Redundant tools (if PostHog MCP covers it, don't build a parallel version).

---

## Success metrics (1 month post-ship)

| Metric | Target |
|--------|--------|
| P50 latency — PostHog questions | Under 8s |
| P50 latency — chat-only | Under 4s |
| Accuracy | Every metric traces to an MCP tool call; zero hallucinated event names |
| Coverage | Bookings by period, by property, funnels, top suppliers, errors, dashboards |
| Vibe | Team members screenshot replies because they're funny or useful |
| Extensibility | Agent #2 takes one day or less |
| Token cost | Avg PostHog question under 6k tokens (down from ~15–20k) |

---

## Related pages
- [Kip](entities/kip.md)
- [Agent Architecture](concepts/agent_architecture.md)
- [PostHog MCP Integration](concepts/posthog_mcp.md)
- [Multi-Agent Design](concepts/multi_agent_design.md)
- [Open Questions](open_questions.md)
