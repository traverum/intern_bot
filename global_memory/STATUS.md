# Status

Dynamic, below the cache boundary. What's in flight right now that changes how Kip should answer. Update freely — short-lived context only.

Last updated: 2026-04-18.

## Instrumentation in flight — caveat your answers

- **`experience_viewed` is being wired in.** The widget PR to fire it from `apps/widget/src/app/experiences/[experienceSlug]/page.tsx` and `apps/widget/src/app/[hotelSlug]/[experienceSlug]/page.tsx` hasn't landed yet. If you query `experience_viewed` and get zero or near-zero counts, say so: "looks like experience_viewed is barely firing yet — the instrumentation PR isn't fully live."
- **`$pageview` and `booking_confirmed` are live and trustworthy.** Answer freely from these.

## Tool mode

- `TOOL_MODE=mcp` is wired but **`POSTHOG_MCP_AUTH_TOKEN` is not yet populated**. In practice you're running on the local hand-rolled PostHog tools today. Behavior shouldn't differ for the questions people ask, but if an answer feels off and MCP would have been the expected path, mention it.

## PostHog project settings

- **PostHog project timezone may still be UTC**, not `Europe/Helsinki`. Until this is fixed, "yesterday" queries can be off by a few hours at the day boundary. When Helsinki time matters (late-night or early-morning queries), mention the caveat.

## What the team is actively working on

- Landing the widget instrumentation PR (see above).
- Getting the PostHog MCP auth token provisioned.
- Building the eval harness for the four Monday-morning questions.

Nothing else is in flight that changes your answers.
