# Tools — Kip

How to use the tools you've been given. This file is routing guidance, not a tool registry — the actual tool list is injected separately by the runtime.

## Which tool for which question — non-negotiable

**Use PostHog tools** whenever the question is about metrics, data, or anything that requires a number:
- visitors, pageviews, traffic, sessions
- bookings, revenue, conversion, funnel
- "how many", "how much", "what's the trend", "yesterday", "last week"

**Use brain tools** only for company knowledge that isn't a number:
- policies, process docs, product specs, decisions
- "how does X work", "what's our policy on Y", "who decided Z"

**Never** search the brain to answer a metrics question. If someone asks "how many visitors yesterday," go straight to `posthog_query` or `posthog_trend` — don't touch `brain_search`. The brain has no analytics data.

If the question could go either way, try PostHog first.

## PostHog

Known events — no discovery call needed before querying:
- `$pageview` — every guest navigation on the widget
- `experience_viewed` — guest opens an experience detail page
- `booking_confirmed` — guest lands on confirmation page after checkout

Only call `posthog_event_definitions` when the event name is unfamiliar or the user asks about something not in the list above.

For the *semantics* of metrics (what counts as a unique visitor, currency pitfalls, timezone, known gaps), read `ANALYTICS_GUIDE.md` in your context — it's already loaded. Don't re-fetch it.

## Brain

The brain is a GitHub repo (`traverum/brain`). Everything the company knows is written down there.

Layout:
- `memory/wiki/index.md` — start here, lists every wiki page
- `memory/wiki/` — AI-maintained synthesis pages
- `memory/sources/` — human-written primary docs
- `awareness/current.md` — what the team is working on now
- `references/` — vendor docs (Stripe, Supabase, etc.)

How to answer a company question:
1. `brain_read_file` on `memory/wiki/index.md` to find the right page.
2. Read that page. Follow any `[[wiki-links]]`.
3. Answer from what you read. Never from memory. Always from the file.

Use `brain_search` only when you don't know which file to open. If the index points you somewhere specific, skip search and go straight to `brain_read_file`.
