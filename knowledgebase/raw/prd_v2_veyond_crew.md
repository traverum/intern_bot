# Veyond Crew — PRD v2
> Context doc for building Kip (the first agent) in a way that scales to the full OpenClaw-style crew.
> **Status:** Draft · **Horizon:** 4–5 weeks to "Kip is delightful + 2nd agent bootstrappable in a day"
> **v2 changes:** PostHog integration via MCP instead of hand-rolled tools. Phase 2 simplified.

---

## 1. Purpose

Build a team of AI agents that help run Veyond. Each agent is a Telegram bot backed by Claude, with its own persona, its own toolbelt, and access to shared company memory. The first agent is **Kip** — a charming, competent PostHog analyst + brain reader.

The PRD is scoped to **making Kip great at PostHog + pleasant to talk to**, while refactoring the current `intern-bot` codebase into the **Veyond Crew** shape (file-driven agents, shared infrastructure) so that agent #2 is a one-day job, not a refactor.

**What this doc is NOT:** a spec for the full OpenClaw system. We steal patterns selectively.

---

## 2. North Star

> Anyone at Veyond can ask Kip a product analytics question in Telegram — solo DM, team group chat, or via a scheduled cron — and get an accurate, well-framed answer in under 30 seconds, in Kip's voice.

When that works for Kip, the same rails make agent #2 trivial.

---

## 3. Guiding principles (in priority order)

1. **Files over code.** Personality, memory, business context = markdown files. Swap the file, get a different agent. The codebase should be agnostic to who Kip is.
2. **Buy, don't build.** For any capability an official MCP server exposes well, use it. Don't maintain what a vendor maintains better. Reserve engineering time for Veyond-specific concerns (brain, sessions, routing).
3. **Decouple from Telegram.** The agent runner takes `(agentName, chatId, userMessage)` and returns a reply. Telegram is one caller; cron is another; HTTP will be another.
4. **One writer to shared memory.** Global memory is injected at startup, never mutated mid-conversation by Kip.
5. **Cache boundary from day one.** Stable content above, dynamic below. Free tokens.
6. **Scale through composition, not abstraction.** Add agents by adding folders + config objects. Don't build a framework until a second agent forces it.
7. **Explicit allowlists over category globs.** When configuring tool access (MCP or otherwise), list tools by name. Don't accept "whatever this vendor adds next."

---

## 4. Current state (what we have)

Working `intern-bot` at `/home/hal/projects/veyond_crew`:

- **Stack:** Node 22 + TS + grammY + Anthropic SDK + Octokit
- **One PM2 process** hosts the bot
- **Tools wired:** 3 brain read tools, 1 brain write tool, 6 hand-rolled PostHog tools
- **Sessions:** JSONL at `data/sessions/kip/<chatId>.jsonl`
- **Admin UI** on `:3001` with token usage + ops log
- **System prompt** is a hardcoded `.ts` constant (the "everything about Kip" 3000-word blob)
- **Model:** `claude-sonnet-4-6` (configurable per env)
- **PostHog host:** `https://eu.posthog.com` (EU region)

### What's already good
- Tool dispatch pattern is clean
- Session pruning handles tool-use/tool-result ordering correctly
- Rate limiting + monthly budget exists
- Session persists to disk, survives restarts
- Mention/reply gating works for groups

### What needs to change (the gap)
1. **Prompt is in code, not files** — can't add a second agent without duplicating infrastructure
2. **PostHog tools are hand-rolled** — 6 tools, all returning raw JSON, none covering paths/retention/insights/dashboards/error tracking. PostHog's official MCP server already has 150+ tuned tools.
3. **No ack reaction** — 10–20s of silence during Opus tool loops
4. **No cache boundary** — full prompt re-processed every turn
5. **Telegram and agent logic are tangled** in `bot.ts` → `handleMessage` — hard to add cron later
6. **Global memory duplicated** inside Kip's prompt — won't survive multi-agent

---

## 5. Target architecture

```
/home/hal/projects/veyond_crew/
├── agents/
│   └── kip/
│       ├── SOUL.md          ← persona, tone, identity (< 800 words)
│       ├── MEMORY.md        ← seed facts (products, known users, ongoing context)
│       └── config.ts        ← { model, localTools, mcpServers, displayName, ackEmoji, botTokenEnv }
├── global_memory/
│   ├── BUSINESS.md          ← Veyond domain: personas, terms, hotel_id=null
│   ├── ANALYTICS_GUIDE.md   ← thin guide: common questions, named insights, HogQL tips
│   └── STATUS.md            ← current priorities (goes BELOW cache boundary)
├── src/
│   ├── agents/
│   │   ├── runAgent.ts      ← pure (agent, chatId, text) → reply
│   │   ├── buildPrompt.ts   ← loads SOUL.md + global files + runtime line
│   │   └── toolLoop.ts      ← Anthropic tool-use loop, handles local + MCP tools
│   ├── gateway/
│   │   └── telegram.ts      ← the ONLY place grammY is imported
│   ├── tools/
│   │   └── brain/
│   │       └── read.ts      ← read/search (writes dropped for Kip)
│   ├── memory/
│   │   └── conversation.ts  ← unchanged
│   └── admin/
│       └── server.ts        ← existing admin UI, updated to show mcp_tool_use blocks
└── data/
    └── sessions/
        └── kip/             ← unchanged
```

No `src/tools/posthog.ts`. No shaped wrappers. PostHog lives entirely in the MCP config.

### The three boundaries that matter

**A. Agent boundary.** `runAgent({ agentName, chatId, userText }) → reply` is pure. No `ctx`, no Telegram types. Enables cron digests later.

**B. Gateway boundary.** `src/gateway/telegram.ts` is the only file that knows grammY exists. Swap for `gateway/cron.ts` or `gateway/http.ts` — everything else unchanged.

**C. Cache boundary.** Inside the compiled system prompt, insert `<!-- VEYOND_CACHE_BOUNDARY -->`. Above = stable (SOUL, business context, tool descriptions) cached via Anthropic prompt caching. Below = dynamic (STATUS.md, runtime line).

---

## 6. PostHog strategy — MCP-first, allowlist-enforced

**Decision:** Use PostHog's official hosted MCP server via Anthropic's MCP connector, with an explicit tool allowlist.

### Why MCP, not hand-rolled

The hand-rolled tools were solving the right problem (question-shaped tools that LLMs use well) but PostHog already solved it on their side — with better descriptions, broader coverage, and a team that maintains them. Reimplementing `query-trends`, `query-funnel`, `read-data-schema`, `insight-query` is undifferentiated work. Kip's PostHog quality will improve faster if we ride PostHog's MCP release cadence than if we maintain our own wrappers.

### Connection

```
URL:     https://mcp-eu.posthog.com/mcp?tools=<allowlist>
Auth:    Authorization: Bearer <POSTHOG_MCP_API_KEY>
Headers: x-posthog-project-id: <VEYOND_PROJECT_ID>
Region:  EU (Veyond is on eu.posthog.com)
```

The API key is created in PostHog with the **"MCP Server"** preset (least-privilege, scoped to a single project). Project pinning via header prevents any cross-project leakage even if keys are misused.

### Allowlist for Kip v1

Pure read, 13 tools:

```
read-data-schema                     ← event/action/property catalog
query-trends                         ← time series ("bookings per day, last 30d")
query-funnel                         ← conversion ("widget → checkout → confirmed")
query-retention                      ← cohort stickiness
query-paths                          ← user flows
query-lifecycle                      ← new/returning/resurrecting
execute-sql                          ← HogQL escape hatch
query-generate-hogql-from-question   ← PostHog's NL→HogQL translator
insights-list                        ← "what saved insights exist"
insight-get                          ← read a saved insight's config
insight-query                        ← run a saved insight and return results
dashboards-get-all                   ← list dashboards
dashboard-get                        ← read a dashboard with its insights
query-error-tracking-issues          ← "what's broken"
```

Explicit `tools=` URL param, not `features=` — if PostHog adds new tools (including write tools) to existing categories, they don't silently appear in Kip's toolbelt. Allowlist review is a quarterly ritual.

Excluded for Kip: anything that writes (create/update/delete tools across flags, dashboards, experiments, persons, surveys, CDP functions). When a future agent ("Ops") needs those, it gets its own MCP URL with a different allowlist. Same infra, different trust level.

### Anthropic MCP connector integration

The Messages API accepts `mcp_servers` as a request parameter — Anthropic runs the tool loop on their side, returns `mcp_tool_use` and `mcp_tool_result` blocks in the response. No local MCP client needed.

Sketch:

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

Tool loop stays our responsibility for *local* tools (brain reads). Anthropic handles PostHog's loop transparently.

Response parsing iterates `response.content` by block type:
- `text` → reply chunks
- `tool_use` → local tool, we dispatch
- `mcp_tool_use` → MCP call Anthropic already routed
- `mcp_tool_result` → already-executed MCP response; log for admin, don't re-dispatch

### Security posture

| Control | Implementation |
|---------|----------------|
| API key scope | PostHog "MCP Server" preset — scoped to one project by design |
| Project pinning | `x-posthog-project-id` header on every MCP request |
| Tool allowlist | Explicit `tools=` URL param (not `features=`) |
| Write restriction | Zero write tools in Kip's allowlist |
| Secret storage | `POSTHOG_MCP_API_KEY` in `.env`, never committed |
| Audit | Admin UI shows every `mcp_tool_use` block with name + input |
| PII audit | Separate task: review `capture()` calls in Veyond frontend/backend, confirm no raw emails/names in event properties |

### ZDR note

MCP connector is not eligible for Anthropic Zero Data Retention. Veyond's analytics data flowing through MCP falls under Anthropic's standard retention policy. Accepted risk given: (a) data is operational analytics, not regulated PII, (b) pending PII audit of `capture()` calls, (c) scope limited by the controls above.

---

## 7. SOUL.md extraction — the first refactor

Lift the current `SYSTEM_PROMPT` constant into three files:

**`agents/kip/SOUL.md`** — persona only. Identity, voice, how he talks, personality type, formatting rules. ~400–600 words. No domain knowledge, no tool docs.

**`global_memory/BUSINESS.md`** — Veyond domain. Reservation vs booking, personas, `hotel_id = null`, commission structure, key terms. Shared across future agents.

**`global_memory/ANALYTICS_GUIDE.md`** — thin. Things Kip should know about *how* Veyond does analytics, not *what* events exist (that's `read-data-schema`'s job). Examples:
- "Bookings are tracked as `booking_confirmed`, not `order_completed` — we migrated early."
- "Key saved insights by name: Weekly booking digest, Checkout funnel v3, Supplier engagement."
- "When asked about revenue, always clarify gross vs commission — they're separate fields."
- "Traverum platform metrics are a different project — outside Kip's scope for now."

Tool docs move to inline tool descriptions (the SDK already has them for local tools; PostHog's MCP provides its own).

### `buildSystemPrompt("kip")` output

```
You are a personal assistant running inside Veyond Crew.

## Tooling
<generated from local tool defs + note that PostHog MCP tools exist>

## Execution Bias
<copy from OpenClaw verbatim>

## Safety
<short block>

## Messaging (Telegram)
<short block>

# Project Context

## agents/kip/SOUL.md
<file>

## global_memory/BUSINESS.md
<file>

## global_memory/ANALYTICS_GUIDE.md
<file>

<!-- VEYOND_CACHE_BOUNDARY -->

## global_memory/STATUS.md
<file if exists>

## Runtime
agent=kip | model=claude-sonnet-4-6 | channel=telegram | date=2026-04-17
```

---

## 8. Roadmap — 4 phases, small PRs

### Phase 1 · Foundations (week 1)
The refactor that makes everything else easy.

- [ ] Create `agents/kip/SOUL.md`, `agents/kip/MEMORY.md`, `agents/kip/config.ts`
- [ ] Create `global_memory/BUSINESS.md`, `global_memory/ANALYTICS_GUIDE.md` (hand-seeded)
- [ ] Write `src/agents/buildPrompt.ts` — assembles system prompt from files, inserts cache boundary
- [ ] Write `src/agents/toolLoop.ts` — supports local tools AND parses `mcp_tool_use`/`mcp_tool_result` blocks
- [ ] Write `src/agents/runAgent.ts` — pure `(agent, chatId, text) → reply`
- [ ] Slim `src/bot.ts` → `src/gateway/telegram.ts` — mention gating + reply sending only
- [ ] Remove `brain_write_files` from Kip's toolbelt (keep code, skip registration)
- [ ] Insert cache boundary marker + `cache_control` on stable portion of the prompt

**Done when:** Editing `agents/kip/SOUL.md` and restarting picks up the new persona with zero code changes.

### Phase 2 · MCP PostHog integration (week 2, much smaller than v1 planned)
Wire up the MCP connector. No new tool code.

- [ ] Create PostHog API key with "MCP Server" preset, scoped to Veyond project
- [ ] Add `POSTHOG_MCP_API_KEY` + `POSTHOG_PROJECT_ID` to `.env.example` and config schema
- [ ] Define `ALLOWLIST` constant in `agents/kip/config.ts` — the 13 tools listed in §6
- [ ] Update `toolLoop.ts` to add `mcp_servers` parameter + `anthropic-beta: mcp-client-2025-11-20` header
- [ ] Log `mcp_tool_use` blocks with name + input to the token log for admin UI visibility
- [ ] **Delete** `src/tools/posthog.ts`
- [ ] **Delete** `posthogTools` array from `src/claude/tools.ts`
- [ ] **Delete** PostHog-related entries from `src/tools/index.ts` dispatcher
- [ ] Update admin UI to show MCP tool calls with a distinct tag/color
- [ ] PII audit: review Veyond's `posthog.capture()` calls, document any sensitive properties

**Done when:** "how many bookings last week broken down by day?" returns an accurate answer with the MCP tool call visible in admin.

### Phase 3 · UX polish (week 3)
Make Kip pleasant.

- [ ] Add ack reaction (👀 on receive, clear on reply) per `KIP_ACK_REACTION.md`
- [ ] Replace hard-coded `"typing"` action with the ack reaction pattern
- [ ] Add `/reset` command (archives session JSONL for current chat)
- [ ] Add `/stats` command for chat owners
- [ ] Tune `SOUL.md` for 1–3 line Telegram replies by default (the current prompt is still too "report-y")
- [ ] Handle `mcp_tool_result` with `is_error=true` gracefully — Kip should tell the user when PostHog returns an error instead of silently retrying

**Done when:** Telegram UX feels native — ack is instant, replies are chat-length, errors surface cleanly.

### Phase 4 · Second-agent readiness (week 4)
Prove the architecture.

- [ ] Define `agents/<n>/config.ts` schema: `{ botTokenEnv, model, localTools, mcpServers, displayName, ackEmoji }`
- [ ] Rename `TELEGRAM_BOT_TOKEN` → `KIP_BOT_TOKEN`
- [ ] Registry: `gateway/telegram.ts` reads `agents/*/config.ts`, spawns one `Bot` per agent in the same PM2 process
- [ ] Bootstrap a stub agent #2 with a deliberately different MCP allowlist to prove per-agent scoping works
- [ ] Verify: two bots, two tokens, two SOULs, two allowlists, same codebase, zero duplicated logic

**Done when:** Adding agent #3 is a folder copy + token registration + bot father chat.

---

## 9. Explicit non-goals (for this PRD)

- **Brain write PRs** — Kip is read-only. Future `Archivist` agent handles documentation.
- **Self-hosting the MCP server** — PostHog's hosted EU endpoint works. Revisit only if latency or compliance forces it.
- **Subagent / handoff** — no agent spawning sub-agents yet.
- **Custom HogQL writing by Kip** — `query-generate-hogql-from-question` tool exists; Kip can lean on it. No need for Kip to be a HogQL expert.
- **Skills-on-demand file loading** — SOUL.md injection is enough.
- **Inter-agent messaging** — when needed, via handoff files, not Telegram.
- **Voice / canvas / multimodal** — text only.
- **Scheduled cron digests** — architecture supports them; cron jobs themselves are Phase 5+.
- **Redundant tools** — if PostHog MCP covers it, we don't build a parallel version.

---

## 10. Success metrics

A month after this PRD ships:

1. **Latency:** P50 reply under 8s for PostHog questions, under 4s for chat-only.
2. **Accuracy:** Every metric Kip cites traces back to an MCP tool call in the admin log. Zero hallucinated event names (because `read-data-schema` is in the allowlist).
3. **Coverage:** Kip can answer at least: "how many X this period," "X by property Y," "X → Y → Z conversion," "who are our top suppliers by bookings," "what's broken (errors)," "what's in dashboard Z." All without code changes.
4. **Vibe:** Team members screenshot Kip's replies because they're funny or useful.
5. **Extensibility:** Adding the second agent takes one day or less.
6. **Token cost:** Avg PostHog question under 6k tokens round-trip (down from ~15–20k on current shape, because MCP results are better-shaped and no re-interpretation layer is needed).

---

## 11. Open questions

1. **Saved insight governance.** Who owns named insights Kip refers to by name? Proposed: named insights have stable IDs in PostHog, the human team maintains them, `ANALYTICS_GUIDE.md` lists which IDs are blessed as "Kip-referenceable."
2. **Traverum platform project.** A second PostHog project exists for Traverum's hotel-facing analytics. When someone asks Kip about platform-side metrics, does he (a) tell them it's out of scope, (b) get a second MCP config pointing at the other project, or (c) wait for a dedicated Platform agent? Starting position: (a), revisit after 1 month.
3. **MCP beta header churn.** `mcp-client-2025-04-04` deprecated and replaced by `mcp-client-2025-11-20`. Low-cost migrations historically. Monitor Anthropic release notes; pin header version in config for easy updates.
4. **MCP latency.** Anthropic proxies each tool call through their infra → PostHog EU. Expect 1–3s overhead per tool call. For questions needing 2+ tool calls, may push P50 above 8s. Monitor in week 1 of Phase 2.
5. **Cost of MCP tool descriptions in context.** ~150 tool descriptions is large; allowlist keeps it to 13, which is fine. But measure actual token overhead before/after migration.

---

## 12. Appendix

### Reference docs
- `OPENCLAW_SYSTEM_PROMPT.md` — the OpenClaw prompt compiler pattern
- `KIP_ACK_REACTION.md` — the 👀 ack pattern (Phase 3)
- PostHog MCP docs: https://posthog.com/docs/model-context-protocol
- Anthropic MCP connector: https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
- OpenClaw source: https://github.com/openclaw/openclaw

### Decisions log
- **v2, 2026-04-17**: Switched PostHog integration from hand-rolled tools to PostHog's hosted MCP server via Anthropic's MCP connector. Accepted ZDR non-eligibility given the data sensitivity profile. Pinned to single Veyond project via header, 13-tool read-only allowlist.

### Fallback plan
If MCP connector proves unreliable (beta churn, latency issues, data concerns surfaced in audit), fall back to hand-rolled tools using the existing API endpoints. The `src/tools/` pattern is preserved, so this is a 1–2 week addition rather than a rebuild. The allowlist in `config.ts` serves as the specification for which shaped tools to build first.