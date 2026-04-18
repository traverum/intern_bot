---
date: 2026-04-18
title: "Provider abstraction + TOOL_MODE switch"
status: decided
---

## Decision

Introduce a provider adapter layer (`src/providers/`) so Kip can run on either Anthropic or OpenAI, selected via `LLM_PROVIDER` env var. Introduce a separate `TOOL_MODE` env var (`local` | `mcp`) so we can toggle between hand-rolled PostHog tools and PostHog's official MCP server — enabling direct token-cost comparison between the two. `TOOL_MODE=mcp` is only valid with `LLM_PROVIDER=anthropic` (enforced at startup).

## Why

Immediate trigger: Anthropic billing couldn't accept the user's payment method, blocking all Kip usage. Rather than wait on billing support, we wanted a fallback path.

Secondary motivation: the roadmap already calls for a PostHog MCP swap (Phase 2), and the user wanted an honest way to compare MCP token usage vs. local tool token usage before committing to the MCP path. Two orthogonal knobs is cleaner than one conflated knob.

Constraints honored:
- The tool loop, memory layer, and agent config stay provider-agnostic (one normalized message format).
- Memory files versioned with `.v2.jsonl` suffix so old Anthropic-native sessions are ignored cleanly, no migration script.
- Prompt caching still works on Anthropic via a `<!-- VEYOND_CACHE_BOUNDARY -->` marker split in the adapter.
- OpenAI path does not support MCP; startup throws rather than running in a broken state.

## Alternatives considered

1. **OpenRouter as a drop-in replacement** — point the Anthropic SDK at OpenRouter's base URL. 10-minute fix, zero code changes. Rejected: user explicitly did not want OpenRouter.
2. **`TOOL_MODE` as a derived flag** (MCP auto-on when provider=anthropic) — simpler, but loses the ability to A/B MCP vs local on the same provider. Rejected once the user named the token-comparison use case.
3. **AWS Bedrock / Google Vertex** (Claude via other clouds) — keeps Claude behavior, different billing. Viable but requires AWS/GCP account setup; OpenAI was faster for the user.
4. **Migrate old session JSONL** — would preserve Kip's memory across the swap. Rejected: clean-slate (`.v2.jsonl` suffix) is cheaper and old history is low-value.

## Links

- [current.md](../current.md)
- [roadmap.md](../../wiki/roadmap.md) — Phase 2 (PostHog MCP) is now partially unblocked
- Implementation: `src/providers/{types,anthropic,openai,index}.ts`, `src/agents/toolLoop.ts`, `src/config.ts`
