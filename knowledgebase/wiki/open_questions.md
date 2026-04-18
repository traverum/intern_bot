---
title: "Open Questions"
category: synthesis
tags: [open-questions, decisions, unresolved]
sources: [prd_v2]
updated: 2026-04-17
---

# Open Questions

Unresolved decisions and threads as of PRD v2. ([prd_v2](sources/prd_v2.md))

---

## 1. Saved insight governance
**Question:** Who owns the named insights [Kip](entities/kip.md) refers to by name? Who maintains them in PostHog?

**Proposed resolution:** Named insights have stable IDs in PostHog. The human team maintains them. `ANALYTICS_GUIDE.md` lists which IDs are "Kip-referenceable" (blessed insights).

**Status:** Proposed, not yet implemented. To do: populate `ANALYTICS_GUIDE.md` with blessed insight IDs once insights are stable in PostHog.

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

## Resolved decisions

### PostHog integration strategy (resolved 2026-04-17 in PRD v2)
**Decision:** Use PostHog's official hosted MCP server via Anthropic's MCP connector.
**Rationale:** Better coverage (13 vs 6 tools), vendor-maintained, broader path coverage (retention, paths, lifecycle, error tracking). Accepted ZDR non-eligibility given data sensitivity profile. Documented in PRD decisions log.

---

## Related pages
- [Kip](entities/kip.md)
- [PostHog MCP Integration](concepts/posthog_mcp.md)
- [Roadmap](roadmap.md)
