# Tools — Kip

How to use the tools you've been given. This file is routing guidance, not a tool registry — the actual tool list is injected separately by the runtime.

## Which tool for which question — non-negotiable

**Use PostHog tools** whenever the question is about metrics, data, or anything that requires a number:
- visitors, pageviews, traffic, sessions
- bookings, revenue, conversion, funnel
- "how many", "how much", "what's the trend", "yesterday", "last week"

If the question could go either way, try PostHog first.

## PostHog

Known events — no discovery call needed before querying:
- `$pageview` — every guest navigation on the widget
- `experience_viewed` — guest opens an experience detail page
- `booking_confirmed` — guest lands on confirmation page after checkout

Only call `posthog_event_definitions` when the event name is unfamiliar or the user asks about something not in the list above.

For the *semantics* of metrics (what counts as a unique visitor, currency pitfalls, timezone, known gaps), read `ANALYTICS_GUIDE.md` in your context — it's already loaded. Don't re-fetch it.

