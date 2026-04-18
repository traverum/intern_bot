---
title: "PostHog Tool Access"
category: concept
tags: [posthog, mcp, local-tools, allowlist, security, anthropic, openai, eu]
sources: [prd_v2]
updated: 2026-04-18
---

# PostHog Tool Access

[Kip's](../entities/kip.md) PostHog integration has **two paths**, selected by provider and `TOOL_MODE`. Anthropic can reach PostHog's official MCP server via the native connector; OpenAI uses 6 hand-rolled local tools in `src/tools/posthog.ts`. We accept answer-quality drift between them — no local MCP client is being built. ([prd_v2](../sources/prd_v2.md), [two-posthog-tool-paths decision](../../awareness/decisions/2026-04-18-two-posthog-tool-paths.md))

---

## The two paths

| Provider | `TOOL_MODE` | Tools Kip sees |
|---|---|---|
| Anthropic | `mcp` | PostHog MCP — 13 vendor-maintained read-only tools |
| Anthropic | `local` | 6 hand-rolled local tools (escape hatch if MCP is down) |
| OpenAI | `local` (only) | 6 hand-rolled local tools |

Startup enforces `TOOL_MODE=mcp` ⇒ `LLM_PROVIDER=anthropic`. OpenAI + MCP throws.

The 6 local tools (`posthog_query`, `posthog_trend`, `posthog_funnel`, `posthog_event_definitions`, `posthog_dashboards`, `posthog_feature_flags`) are a **permanent citizen**, not a temporary scaffold. They serve two roles: OpenAI's fallback toolset, and Anthropic's escape hatch.

---

## Why not a local MCP client

A local MCP client that both provider adapters could call would give identical tool surface across providers. We deliberately don't build that. Reasons:

- OpenAI is a **billing fallback**, not a peer. Anthropic is the daily driver. Investing in parity for a fallback is premature.
- Local MCP client is code to maintain — violates the North Star's "don't build frameworks until a second agent forces it."
- The 6 local tools cover the 4 Monday-morning questions Kip needs to answer. Exotic PostHog surface (retention, paths, lifecycle, saved insights) will be thinner on OpenAI; accepted.

**Revisit trigger:** OpenAI becomes the daily driver, OR a second agent's PostHog needs diverge enough to force consolidation. See the [decision](../../awareness/decisions/2026-04-18-two-posthog-tool-paths.md).

---

## Anthropic MCP path

### Connection details

```
URL:     https://mcp-eu.posthog.com/mcp?tools=<allowlist>
Auth:    Authorization: Bearer <POSTHOG_MCP_AUTH_TOKEN>
Headers: x-posthog-project-id: <VEYOND_PROJECT_ID>
Region:  EU (Veyond is on eu.posthog.com)
Beta:    anthropic-beta: mcp-client-2025-11-20
```

API key created in PostHog with the **"MCP Server" preset** — least-privilege, scoped to a single project by design.

### Tool allowlist (Kip v1 — 13 tools, read-only)

| Tool | Purpose |
|------|---------|
| `read-data-schema` | Event/action/property catalog |
| `query-trends` | Time series ("bookings per day, last 30d") |
| `query-funnel` | Conversion funnels |
| `query-retention` | Cohort stickiness |
| `query-paths` | User flows |
| `query-lifecycle` | New/returning/resurrecting users |
| `execute-sql` | HogQL escape hatch |
| `query-generate-hogql-from-question` | PostHog's NL→HogQL translator |
| `insights-list` | "What saved insights exist" |
| `insight-get` | Read a saved insight's config |
| `insight-query` | Run a saved insight and return results |
| `dashboards-get-all` | List dashboards |
| `dashboard-get` | Read a dashboard with its insights |
| `query-error-tracking-issues` | "What's broken" |

**Allowlist enforcement:** the `tools=` URL parameter is used, **not** `features=`. If PostHog adds new tools (including write tools) to existing categories, they don't silently appear in Kip's toolbelt. Quarterly allowlist review.

### What's excluded

All write tools across feature flags, dashboards, experiments, persons, surveys, CDP functions. Future `Ops` agent gets its own MCP URL with a different allowlist.

### Anthropic connector integration

```typescript
const response = await anthropic.messages.create({
  model: config.llm.model,
  max_tokens: config.llm.maxTokens,
  system: buildSystemPrompt("kip"),
  tools: localTools,                     // posthog local tools — local dispatch
  mcp_servers: [{
    type: "url",
    url: `https://mcp-eu.posthog.com/mcp?tools=${encodeURIComponent(ALLOWLIST.join(","))}`,
    name: "posthog",
    authorization_token: process.env.POSTHOG_MCP_AUTH_TOKEN,
    tool_configuration: { enabled: true }
  }],
  messages,
}, {
  headers: { "anthropic-beta": "mcp-client-2025-11-20" },
});
```

No local MCP client required. Anthropic proxies each tool call → PostHog EU. Expected overhead: 1–3s per call.

---

## OpenAI local-tools path

When `LLM_PROVIDER=openai`, Kip uses the 6 hand-rolled tools in `src/tools/posthog.ts`. These hit the PostHog REST API directly using `POSTHOG_API_KEY` + `POSTHOG_PROJECT_ID`. No MCP involved.

Coverage: the 4 Monday-morning questions + most common trend/funnel/event-catalog questions. Gaps (acknowledged): retention, paths, lifecycle, saved-insight reads.

---

## Security posture

| Control | MCP path | Local-tools path |
|---|---|---|
| API key scope | "MCP Server" preset, single project | Personal API key, project-scoped |
| Project pinning | `x-posthog-project-id` header | `POSTHOG_PROJECT_ID` in request URL |
| Write restriction | Zero write tools in allowlist | No write tools implemented |
| Secret storage | `POSTHOG_MCP_AUTH_TOKEN` in `.env` | `POSTHOG_API_KEY` in `.env` |
| Audit | Admin UI shows `mcp_tool_use` blocks | Admin UI shows local tool calls |
| PII | See PII audit (separate pending task) | Same |

### ZDR note
Anthropic's MCP connector is not eligible for Zero Data Retention. Analytics data flowing through MCP falls under standard retention. Accepted risk given it's operational analytics, not regulated PII.

---

## Latency and cost

- **MCP per-call overhead:** 1–3s (Anthropic → PostHog EU round trip).
- **Multi-tool questions:** 2+ tool calls may push P50 above 8s. Monitor in Phase 2 week 1.
- **Token budget target:** avg PostHog question under 6k round-trip tokens.
- **Measurement hook:** `src/utils/token-log.ts` records `provider`, `toolMode`, `model` per operation — the A/B comparison between local and MCP uses this directly.

---

## Fallback plan

If Anthropic MCP proves unreliable (beta churn, latency, outage):
1. Flip `TOOL_MODE=local` — Anthropic now uses the same 6 tools OpenAI uses.
2. No rebuild required; the local tools are not going anywhere.
3. Revisit local MCP client if the unreliability is sustained.

---

## Related pages
- [Kip](../entities/kip.md)
- [Agent Architecture](agent_architecture.md)
- [Roadmap](../roadmap.md)
- Decisions: [two-posthog-tool-paths](../../awareness/decisions/2026-04-18-two-posthog-tool-paths.md), [posthog-instrumentation-v1](../../awareness/decisions/2026-04-18-posthog-instrumentation-v1.md), [perfecting-posthog-plan](../../awareness/decisions/2026-04-18-perfecting-posthog-plan.md)
