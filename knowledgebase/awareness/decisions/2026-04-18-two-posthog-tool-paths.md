---
date: 2026-04-18
title: "Two PostHog tool paths, not a local MCP client"
status: decided
---

## Decision

Keep PostHog accessible through **two paths** and accept the answer-quality drift between them:

| Provider | Tool access | Role |
|---|---|---|
| Anthropic (daily driver) | PostHog MCP via Anthropic's native connector (13 vendor-maintained tools) | Best quality |
| OpenAI (fallback) | The 6 hand-rolled local tools in `src/tools/posthog.ts` | Billing insurance |

**Do not build a local MCP client** that would give both providers identical tool access. Revisit only if (a) OpenAI becomes the daily driver, or (b) a second agent's PostHog needs diverge enough to force provider-agnostic tooling.

## Why

Earlier in the same session I had proposed building a local MCP client so both adapters could serve the same MCP-derived tools. User pushed back: "keep it simple." They're right.

- Local MCP client is **code we'd build and maintain** — exactly the framework-first move [`NORTH_STAR.md`](../../../NORTH_STAR.md) warns against ("don't build frameworks until a second agent forces it").
- OpenAI is a **fallback**, not a peer. Anthropic is the daily driver; OpenAI exists because of the billing incident that triggered the provider abstraction. Investing in parity for a fallback is premature.
- The 6 local tools already cover the 4 Monday-morning questions. Exotic PostHog surface (retention, paths, lifecycle, saved insights) will be thinner on OpenAI — acceptable floor.
- Keeping `src/tools/posthog.ts` alive also serves Anthropic as an **escape hatch** if the MCP beta header churns or PostHog MCP has an outage. `TOOL_MODE=local` / `TOOL_MODE=mcp` already switches cleanly.

## What we give up

- Answer-quality parity across providers. Accepted.
- A single source of truth for Kip's PostHog tool surface. If PostHog MCP adds a tool we want reachable from OpenAI, we either port it to local tools or accept the gap.

## Roadmap consequence

[Roadmap Phase 2](../../wiki/roadmap.md) had a task: **Delete `src/tools/posthog.ts`**. That task's done-condition changes:

- **Was:** delete once MCP works.
- **Now:** delete only if (a) we stop supporting OpenAI, AND (b) Anthropic MCP is proven stable in production. Neither is true yet.

Interpretation: the local tools are a **permanent citizen**, not a temporary scaffold, until one of those conditions flips.

## Revisit triggers

- OpenAI becomes the primary provider (not just a fallback) for a sustained period.
- Agent #2 has PostHog needs that diverge from Kip's and needs its own tool path — consider consolidating both through a local MCP client at that point.
- PostHog MCP adds a tool whose absence on OpenAI causes real user pain.

## Links

- [current.md](../current.md)
- [posthog_mcp.md](../../wiki/concepts/posthog_mcp.md)
- [roadmap.md](../../wiki/roadmap.md)
- Earlier decision: [provider abstraction + TOOL_MODE](2026-04-18-provider-abstraction-and-tool-mode.md)
