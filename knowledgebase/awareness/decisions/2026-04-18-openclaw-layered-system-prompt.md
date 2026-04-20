---
date: 2026-04-18
title: "Adopt OpenClaw's layered system-prompt model"
status: decided
---

## Decision

Restructure Kip's system prompt along OpenClaw's three-layer model: hardcoded scaffolding sections live in code, a `# Project Context` block injects files in priority order, and tool-routing rules own their own file (`TOOLS.md`) separate from persona (`SOUL.md`).

Concretely, the stable half of the prompt is now assembled in this order:

1. One-line intro
2. `## Tooling` — generated from the live `NormalizedTool[]` the model will actually see this turn
3. `## Tool Call Style` — don't narrate routine tool calls
4. `## Execution Bias` — act immediately, don't promise to act
5. `## Safety` — read-only, no self-preservation
6. `# Project Context` with preamble → SOUL → TOOLS → BUSINESS → ANALYTICS_GUIDE → MEMORY

All four hardcoded policy sections live in [src/agents/buildPrompt.ts](../../../src/agents/buildPrompt.ts) as string constants. A user editing SOUL.md cannot weaken them.

## Why

Kip failed a live analytics question ("search unique visitors and page views for yesterday") by reaching for `brain_search` and returning "nothing in the knowledge base." Root cause: tool-routing rules were crammed into SOUL.md competing with personality text, and the prompt had no `## Tooling` section listing tool names inline — the model only saw them through the API schema, separated from the rest of the prompt.

OpenClaw's separation solves the exact failure mode:
- **TOOLS.md** (layer 2, user-editable) — "when to use which tool" is the only thing in the file, so routing rules don't have to compete with persona or domain knowledge for attention.
- **`## Tooling`** (layer 1, code-generated) — lists the tool names *in the prompt*, right next to the routing file that references those names, reinforcing the association.
- **`## Execution Bias`** (layer 3, hardcoded) — prevents the "I can totally run those queries for you, just let me know what you need" non-action reply that models drift into when the bias isn't stated as a framing principle.

Hardcoding the policy sections also prepares us for agent #2: persona swaps by changing `SOUL.md`, but safety/execution discipline stays identical across agents without relying on each one's markdown files getting it right.

## Alternatives considered

- **Keep routing in SOUL.md, just state it more clearly.** Rejected — this was the initial fix attempt and it's architecturally wrong. SOUL.md should be pure persona per OpenClaw's strict test; mixing tool routing in means sub-agents that load SOUL inherit tool-shaped framing they may not need, and any future SOUL rewrite silently breaks routing.
- **Programmatic tool router (code pre-selects tools per message).** Rejected — the model still has to understand *why* a tool applies. OpenClaw does not do this either. Prompt engineering (Tooling + TOOLS.md + Execution Bias) is the entire routing mechanism; the model makes the decision, we give it the scaffolding.
- **Build our own prompt framework.** Rejected — OpenClaw's model is battle-tested for exactly this shape of problem (Telegram-native agent with tool access), and we have one agent. No reason to invent.
- **Adopt OpenClaw wholesale (IDENTITY.md, USER.md, AGENTS.md, HEARTBEAT.md, full/minimal/none prompt modes).** Deferred, not rejected. Those files matter when we have a second agent, per-user context, or sub-agents. We adopted the parts that directly fix the tool-selection failure and skipped the parts that solve problems we don't have yet.

## Links

- [agents/kip/SOUL.md](../../../agents/kip/SOUL.md) — persona only after scrub
- [agents/kip/TOOLS.md](../../../agents/kip/TOOLS.md) — new routing file
- [src/agents/buildPrompt.ts](../../../src/agents/buildPrompt.ts) — hardcoded scaffolding
- Commit `8f372b1` — restructure landed on `main`
