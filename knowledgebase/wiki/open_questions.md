---
title: "Open Questions"
category: synthesis
tags: [open-questions, decisions, unresolved]
sources: [prd_v2]
updated: 2026-04-18
---

# Open Questions

Unresolved decisions and threads. ([prd_v2](sources/prd_v2.md))

---

## 1. Saved insight governance (superseded — no insights exist yet)
~~**Question:** Who owns the named insights [Kip](entities/kip.md) refers to by name?~~

**Superseded 2026-04-18:** PostHog was added recently (commit `1d787d0`) and the team hasn't built any canonical saved insights or dashboards yet. The question will re-emerge once insights exist; until then there's nothing to govern. `ANALYTICS_GUIDE.md` documents the actual event surface instead.

---

## 2. Traverum platform project scope
**Question:** A second PostHog project exists for Traverum's hotel-facing analytics. When someone asks Kip about platform-side metrics, does he:
- **(a)** Tell them it's out of scope.
- **(b)** Get a second MCP config pointing at the other project.
- **(c)** Wait for a dedicated Platform agent.

**Starting position:** (a). Tell users it's out of scope.

**Revisit:** After 1 month of Kip usage. If platform questions come up frequently, evaluate (b) or (c).

---

## 3. MCP beta header churn
**Question:** How stable is the `anthropic-beta: mcp-client-2025-11-20` header? The previous version (`mcp-client-2025-04-04`) was deprecated.

**Mitigation:** Pin the header version in config (not hardcoded in business logic) for easy updates. Monitor Anthropic release notes. Historical pattern: low-cost migrations.

**Status:** Accepted risk. Header version pinned in `toolLoop.ts` config.

---

## 4. MCP latency with multiple tool calls
**Question:** Anthropic proxies each tool call → PostHog EU. Expected overhead: 1–3s per call. For questions requiring 2+ tool calls, does P50 exceed the 8s target?

**Status:** Unknown until measured. Monitor in Phase 2, week 1. If latency is a problem, evaluate:
- Whether fewer tool calls can answer common questions (query design).
- Whether parallel tool calls are available via the MCP connector.
- Fallback to hand-rolled tools if latency consistently exceeds 8s.

---

## 5. Cost of MCP tool descriptions in context
**Question:** How many tokens do the 13 PostHog tool descriptions add to each turn?

**Context:** PostHog MCP has 150+ total tools; the allowlist of 13 is specifically to keep this manageable. But "manageable" hasn't been measured yet.

**Status:** Measure before/after Phase 2 migration. Compare against the 6 hand-rolled tool descriptions. If overhead is large, evaluate whether any allowlist tools can be trimmed without losing coverage.

---

## 6. Internal-traffic exclusion
**Question:** How do we filter team browsing from guest analytics? Options: IP list, email-domain rule on identified users, feature-flag-based bot-mode.

**Status:** Unbuilt. Kip caveats low-volume answers in the meantime (documented in `ANALYTICS_GUIDE.md`). Revisit when inflated counts cause confusion.

---

## 7. When (if ever) to build a local MCP client
**Question:** We deliberately rejected building a provider-agnostic local MCP client this session. When should that decision flip?

**Revisit triggers:**
- OpenAI becomes the primary provider (not just a fallback) for sustained use.
- Agent #2's PostHog needs diverge from Kip's enough that two tool surfaces aren't sustainable.
- PostHog MCP adds a tool whose absence on OpenAI causes real user pain.

**Status:** Accepted decision, documented [here](../awareness/decisions/2026-04-18-two-posthog-tool-paths.md). No action until a trigger fires.

---

## Resolved decisions

### PostHog tool-access strategy (resolved 2026-04-18)
**Decision:** Two paths — PostHog MCP via Anthropic's native connector on `TOOL_MODE=mcp`; 6 hand-rolled local tools for OpenAI and as Anthropic's escape hatch. No local MCP client. See [decision](../awareness/decisions/2026-04-18-two-posthog-tool-paths.md).

### PostHog instrumentation v1 (resolved 2026-04-18)
**Decision:** Add `experience_viewed` + confirm super-properties on every event. Nothing else. Everything else is deferred. See [decision](../awareness/decisions/2026-04-18-posthog-instrumentation-v1.md).

---

## Related pages
- [Kip](entities/kip.md)
- [PostHog MCP Integration](concepts/posthog_mcp.md)
- [Roadmap](roadmap.md)
