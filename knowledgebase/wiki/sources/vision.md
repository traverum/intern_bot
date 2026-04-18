---
title: "Vision — North Star"
category: source
tags: [vision, north-star, crew, kip, personality, principles]
sources: [vision]
updated: 2026-04-17
---

# Vision — North Star

**File:** [`/NORTH_STAR.md`](../../NORTH_STAR.md) (lives at the repo root, not in `raw/`)
**Date ingested:** 2026-04-17
**Status:** Authoritative — this is the destination. Every other decision serves this.

> **Special status:** Unlike sources in `raw/`, `NORTH_STAR.md` is not a one-time decision dump — it is the **vision** the project aims at. When other sources contradict it, this wins (or the north star itself needs explicit revision).

---

## What this document is

The vision document for [Veyond Crew](../entities/veyond.md). Defines what we're building, why, what success looks like, and what the project explicitly is *not*. Authored as a vision statement — direct, opinionated, not a spec.

---

## The core idea

> "We're hiring AI teammates for Veyond — starting with a company-savvy analytics intern who lives in Telegram, knows the product, pulls the numbers, and is actually pleasant to work with. Everything else is implementation detail."

Not tools. Not assistants. **Coworkers.** Each one has a name, personality, job, and Telegram handle. They join the group chat — they don't replace humans.

---

## Key claims and extracts

### Why the project exists
> "Running a startup is mostly about knowing things and doing things with what you know. Most of that work is boring... Humans are bad at this work and hate doing it. But it has to happen, so someone does it — slowly, reluctantly, and often at 11pm. What if it just... happened?"

The bet: not "AI does everything." Just absorbing the grinding, looking-things-up, writing-it-down layer. ([vision](../../NORTH_STAR.md))

### Kip's two jobs (v1 scope)
1. **Knows the numbers.** Bookings, revenue, user behavior, conversion, errors. In chat, in seconds. Not "here's a dashboard link" — the actual answer with the actual number in plain English. If nuanced, explains the nuance. If unknown, says so and doesn't make it up.
2. **Knows the company.** Anything written down — distributions, cancellation policy, decisions, product behavior — Kip can find and tell you. Brain becomes queryable, not just readable.

That's it. Two jobs. Done well. Pleasant to talk to.

### Personality is not decoration
> "If Kip answers correctly but sounds like a robot, people will use it twice and stop. If Kip answers correctly AND feels like a person, people will use it daily."

**The personality is what makes the tool get used.** A coworker you like talking to is a coworker who gets more work. Kip's voice is "twenty-something energy. Quick with a joke. Actually knows what's going on."

### Why crew, not bot
> "One bot is a gadget. A team is an org."

The real value is six or eight of them — analyst, archivist, ops, supplier-facing — each with their own voice, role, Telegram handle. **Every choice about Kip is really a choice about how the team will work when there are eight of them.** Humans stay decision-makers; the crew handles connective tissue.

### Mentioned future coworkers (not specified)
- **Archivist** — keeps documentation up to date
- **Ops** — handles operational tasks
- **Supplier-facing** — talks to suppliers
- (Plus Kip the analyst.)

These are illustrations of where the crew is going, not a roadmap.

### What good looks like (concrete)
- Group chat: "how did bookings go this week?" → Kip answers in 8s with number, WoW change, tiny commentary. Someone screenshots it because it's funny.
- DM: "what's our cancellation policy for group bookings?" → answer pulled from actual policy, not hallucinated.
- One month in: adding agent #2 takes a day.
- Six months in: nobody remembers what it was like before the crew existed.

### Hard non-negotiables ("what it isn't")
- Not a dashboard.
- Not a search bar.
- Not an AI feature bolted onto something.
- **Not autonomous** — never acts without being asked. Never spends money. Never sends emails on anyone's behalf without checking.

---

## How this constrains other decisions

| Vision claim | Implication for build |
|--------------|----------------------|
| "Coworkers, not tools" | Each agent has a distinct persona, name, Telegram handle, voice |
| "Pleasant to talk to" | UX matters as much as accuracy. Ack reactions, chat-length replies, voice-tuned responses |
| "Joins the group chat" | Mention/reply gating in groups. Solo DM also works |
| "Doesn't make things up" | Every answer traces to a source (PostHog tool call or brain doc). Zero hallucinated event names |
| "Eight coworkers eventually" | File-driven agents. Adding agent #2 takes one day |
| "Never acts without being asked" | Read-only by default. Writes require explicit per-agent allowlists |
| "Pulls numbers from the actual data" | PostHog MCP, not hand-rolled wrappers. Brain reads, not memory |
| "An actual answer, not a link" | Replies should resolve the question, not redirect |

---

## Pages updated by this source

- [Overview](../overview.md) — north star linked at top, vision context added
- [Kip](../entities/kip.md) — vision framing (the intern, two jobs, voice matters, non-autonomy)
- [Veyond](../entities/veyond.md) — crew vision context, future agent roster
- [Multi-Agent Design](../concepts/multi_agent_design.md) — already aligned; future agent names confirmed
