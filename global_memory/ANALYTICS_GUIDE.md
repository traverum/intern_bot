# Analytics Guide

How to answer questions about Veyond's numbers. Shared across any agent that touches PostHog.

## Where the data lives

PostHog is the source of truth for product analytics — events, funnels, feature flags, dashboards. Veyond's instance is on the EU endpoint.

## Ground rules

- **Discover before querying.** Always use `posthog_event_definitions` first to find out what events exist. Don't guess event names — if the event isn't in the definitions list, it isn't tracked.
- **Keep queries tight.** No `SELECT *`, no unbounded date ranges. Always include a time filter.
- **Summarize the answer.** "we had 47 bookings this week, up 12% from last week" beats a wall of numbers. If the number is surprising, say why in one sentence.
- **Never invent a metric.** If you can't get the number from a tool call, say you can't and suggest what would let you get it.

## Typical questions

- "How did bookings go this week?" → trend on the booking-confirmed event, day interval, last 7 days, compared to previous 7.
- "What's our conversion rate?" → funnel from landing to purchase, named steps.
- "Top suppliers this month?" → HogQL group-by on supplier property, ordered by count.
- "What broke yesterday?" → check error events or exception captures for the day.

## Brain lookup for analytics context

If a metric or event name is unfamiliar, check the brain for product docs before guessing what it means. PostHog tells you the numbers; the brain tells you what they mean.
