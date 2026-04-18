---
title: "PostHog MCP Integration"
category: concept
tags: [posthog, mcp, allowlist, security, anthropic, eu]
sources: [prd_v2]
updated: 2026-04-17
---

# PostHog MCP Integration

[Kip's](../entities/kip.md) PostHog integration uses PostHog's official hosted MCP server via Anthropic's MCP connector — replacing 6 hand-rolled tools with 13 read-only tools maintained by PostHog. ([prd_v2](../sources/prd_v2.md))

---

## Why MCP instead of hand-rolled tools

The hand-rolled tools solved the right problem (question-shaped tools LLMs use well) but PostHog already solved it better:
- Broader coverage: PostHog MCP has 150+ tools; hand-rolled covered 6.
- Better descriptions: PostHog's team tunes them.
- Maintained by the vendor: no maintenance burden on Veyond's side.
- Kip's PostHog quality improves with PostHog's MCP release cadence, not ours.

The principle: **Buy, don't build** — reserve engineering time for Veyond-specific concerns.

---

## Connection details

```
URL:     https://mcp-eu.posthog.com/mcp?tools=<allowlist>
Auth:    Authorization: Bearer <POSTHOG_MCP_API_KEY>
Headers: x-posthog-project-id: <VEYOND_PROJECT_ID>
Region:  EU (Veyond is on eu.posthog.com)
```

API key created in PostHog with the **"MCP Server" preset** — least-privilege, scoped to a single project by design.

---

## Tool allowlist (Kip v1 — 13 tools, read-only)

| Tool | Purpose |
|------|---------|
| `read-data-schema` | Event/action/property catalog |
| `query-trends` | Time series ("bookings per day, last 30d") |
| `query-funnel` | Conversion ("widget → checkout → confirmed") |
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

**Note:** The source lists 13 tools but includes 14 entries above — `query-error-tracking-issues` may be the 14th added. Verify against live PostHog MCP docs when wiring up. ([prd_v2](../sources/prd_v2.md))

### Allowlist enforcement
The `tools=` URL parameter is used, **not** `features=`. If PostHog adds new tools (including write tools) to existing categories, they don't silently appear in Kip's toolbelt. Allowlist review is a quarterly ritual.

---

## What's excluded from Kip's allowlist

All write tools across:
- Feature flags (create/update/delete)
- Dashboards (create/update/delete)
- Experiments
- Persons
- Surveys
- CDP functions

When a future `Ops` agent needs write access, it gets its own MCP URL with a different allowlist. Same infra, different trust level.

---

## Anthropic MCP connector integration

The Messages API accepts `mcp_servers` as a request parameter — Anthropic runs the tool loop on their side:

```typescript
const response = await anthropic.messages.create({
  model: config.claude.model,
  max_tokens: config.claude.maxTokens,
  system: buildSystemPrompt("kip"),
  tools: localTools,                     // brain read tools — local dispatch
  mcp_servers: [{
    type: "url",
    url: `https://mcp-eu.posthog.com/mcp?tools=${encodeURIComponent(ALLOWLIST.join(","))}`,
    name: "posthog",
    authorization_token: process.env.POSTHOG_MCP_API_KEY,
    tool_configuration: { enabled: true }
  }],
  messages,
}, {
  headers: { "anthropic-beta": "mcp-client-2025-11-20" },
});
```

No local MCP client needed. Anthropic proxies each tool call → PostHog EU. Expected overhead: 1–3s per tool call.

**Beta header:** `mcp-client-2025-11-20` — watch Anthropic release notes for churn. Previous version `mcp-client-2025-04-04` was deprecated. Pin header version in config for easy updates.

---

## Security posture

| Control | Implementation |
|---------|----------------|
| API key scope | PostHog "MCP Server" preset — scoped to one project by design |
| Project pinning | `x-posthog-project-id` header on every MCP request |
| Tool allowlist | Explicit `tools=` URL param (not `features=`) |
| Write restriction | Zero write tools in Kip's allowlist |
| Secret storage | `POSTHOG_MCP_API_KEY` in `.env`, never committed |
| Audit | Admin UI shows every `mcp_tool_use` block with name + input |
| PII audit | Separate task: review `capture()` calls in Veyond frontend/backend |

### ZDR note
MCP connector is **not eligible** for Anthropic Zero Data Retention. Veyond's analytics data flowing through MCP falls under Anthropic's standard retention policy. Accepted risk because:
- Data is operational analytics, not regulated PII.
- PII audit of `capture()` calls is a separate pending task.
- Scope is limited by the controls above.

---

## Latency and cost considerations

- **Latency per tool call:** 1–3s overhead for Anthropic → PostHog EU round trip.
- **Multi-tool questions:** 2+ tool calls may push P50 above 8s target. Monitor in Phase 2 week 1.
- **Token cost:** ~150 tool descriptions would be heavy; allowlist of 13 keeps it manageable. Measure actual token overhead before/after migration.
- **Target:** Avg PostHog question under 6k tokens round-trip (down from ~15–20k with hand-rolled tools).

---

## Fallback plan

If MCP connector proves unreliable (beta churn, latency issues, data concerns):
1. Fall back to hand-rolled tools using existing API endpoints.
2. `src/tools/` pattern is preserved — 1–2 week rebuild, not a ground-up rebuild.
3. The allowlist in `config.ts` serves as the spec for which shaped tools to build first.

---

## Related pages
- [Kip](../entities/kip.md)
- [Agent Architecture](agent_architecture.md)
- [Roadmap](../roadmap.md)
- [Open Questions](../open_questions.md)
