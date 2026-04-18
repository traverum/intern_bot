---
date: 2026-04-18
title: "'Perfecting PostHog' — eight axes, grounding first"
status: decided
---

## Decision

"Perfect PostHog" is not one axis. It's eight, and **grounding (#4) moves the needle most** — more than tool access, more than model choice. Kip with 6 tools and a real event catalog beats Kip with 13 tools and no context.

The eight axes:

| # | Axis | Action |
|---|---|---|
| 1 | Capability — can Kip answer the question at all | Instrumentation gap fix (see [posthog-instrumentation-v1](2026-04-18-posthog-instrumentation-v1.md)) |
| 2 | Accuracy — numbers are right | Eval harness (deferred until post-instrumentation) |
| 3 | Tool selection — picks the right tool fast | Eval harness |
| 4 | **Grounding — knows Veyond's event catalog + business** | **`global_memory/BUSINESS.md` + `ANALYTICS_GUIDE.md`** — done this session |
| 5 | Latency — P50 under 8s | Measured via token log, Phase 2 |
| 6 | Cost — under 6k tokens/question | Measured via token log, Phase 2 |
| 7 | Error recovery — tool errors handled cleanly | Phase 4 polish |
| 8 | Provider parity — Anthropic ≈ OpenAI answer quality | Explicitly accepted drift — see [two-posthog-tool-paths](2026-04-18-two-posthog-tool-paths.md) |

## Why

Before this session, "perfect PostHog" implicitly meant "wire up MCP." That framing was wrong:

- MCP alone doesn't make Kip useful. A great tool set on a bad domain prompt still hallucinates event names or picks the wrong aggregation.
- The gap that actually broke Kip's promise was **instrumentation** — two events total (`$pageview`, `booking_confirmed`), no way to answer "which hotels drive the most traffic" or "which experiences get the most interest."
- The second-biggest gap was **context** — `global_memory/BUSINESS.md` and `ANALYTICS_GUIDE.md` existed but were thin/wrong.

Both of those are fixable without touching the tool access story at all.

## What shipped this session

1. [`global_memory/BUSINESS.md`](../../../global_memory/BUSINESS.md) — full rewrite. Channels, commission split, core nouns, personas, happy path.
2. [`global_memory/ANALYTICS_GUIDE.md`](../../../global_memory/ANALYTICS_GUIDE.md) — full rewrite. 3 real events, super-properties, 7 pitfalls (Helsinki tz, multi-currency, gross-vs-commission), playbook for the 4 Monday questions, known gaps.
3. Widget instrumentation gap list — shipped to the widget repo Claude as a scoped prompt. `PostHogExperienceViewed` component built; wiring into the two detail-page routes completes v1. Captured in [posthog-instrumentation-v1](2026-04-18-posthog-instrumentation-v1.md).
4. Architectural decision: keep two tool paths, don't build a local MCP client — see [two-posthog-tool-paths](2026-04-18-two-posthog-tool-paths.md).

## Sequencing

1. **Now:** wait for widget PR merging `PostHogExperienceViewed` on the two detail routes.
2. **When Anthropic billing unblocks + PostHog MCP key lands:** flip `TOOL_MODE=mcp` on Anthropic, smoke-test the 4 Monday questions, set PostHog project timezone to Europe/Helsinki from Kip side.
3. **Then:** eval harness for the 4 Monday questions (axes #2, #3, #5, #6 measured in one go).
4. **Deferred until signal:** Phase 4 polish (error recovery, admin-UI tool-call chain).

## Links

- [current.md](../current.md)
- [BUSINESS.md](../../../global_memory/BUSINESS.md)
- [ANALYTICS_GUIDE.md](../../../global_memory/ANALYTICS_GUIDE.md)
- Related decisions: [posthog-instrumentation-v1](2026-04-18-posthog-instrumentation-v1.md), [two-posthog-tool-paths](2026-04-18-two-posthog-tool-paths.md)
