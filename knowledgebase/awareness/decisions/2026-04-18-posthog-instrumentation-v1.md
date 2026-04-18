---
date: 2026-04-18
title: "PostHog instrumentation v1 — scoped to traffic questions"
status: decided
---

## Decision

Extend the widget's PostHog capture to unlock the four Monday-morning questions Kip is expected to answer, and nothing else. Specifically:

1. **Super-properties** on every event — `channel`, `hotel_config_id`, `hotel_slug`, `hotel_name`. Already wired in `PostHogHotelContext`; verified on every guest-facing route entry point.
2. **`experience_viewed`** event on the experience detail page mount, with `experience_id`, `experience_title`, `supplier_id`. Component (`PostHogExperienceViewed`) was built in a prior session; wiring into the two detail-page routes completes v1:
   - `apps/widget/src/app/experiences/[experienceSlug]/page.tsx` (direct)
   - `apps/widget/src/app/[hotelSlug]/[experienceSlug]/page.tsx` (white-label)
3. **PostHog project timezone** set to Europe/Helsinki (to be confirmed/changed from Kip side via PostHog MCP once the token is available).

No other events, no backend capture, no identify-at-checkout in this pass.

## Why

Kip's primary promise is "knows the numbers." The four questions the team actually asks Monday morning are:

1. Page views yesterday/today
2. Unique visitors
3. Which hotels drive the most traffic
4. Which experiences get the most interest

Only `$pageview` and `booking_confirmed` existed before this change. #1 and #2 were already answerable. #3 required a hotel identifier on `$pageview` (unlocked by super-properties). #4 required an event that fires on experience detail page open (unlocked by `experience_viewed`).

This is the minimum change that makes Kip useful without over-instrumenting. Every additional event adds a maintenance surface; we only add what a real question demands.

## Explicitly out of scope

These were considered and deferred — each would be a separate decision when a question forces it:

- **`checkout_started`, `payment_failed`, `reservation_requested`** — funnel and error debugging. No one is asking these yet; add when they do.
- **`booking_cancelled`** — no cancellation UI today; cancellation is supplier/admin side, not widget.
- **`posthog.identify()` at checkout** — would improve distinct-visitor quality. Deferred because the four questions work with cookie-level `distinct_id` and the identity-stitching design needs a separate think.
- **Backend / supplier-dashboard / admin capture** — different codebase, different surface, different instrumentation story. Not in this pass.
- **Internal-traffic filter** — requires an IP list or an email-domain rule decided separately.
- **Commission-realization / pay-on-site settlement signal** — not a PostHog concern today; lives in the billing pipeline.

## Constraints honored

- Max three properties per event. Business-meaningful only; no engagement noise (scroll depth, dwell time, autocapture stays off).
- snake_case event and property names, matching existing `booking_confirmed`.
- Followed the existing `PostHog<Name>.tsx` client-component pattern — no new primitive.
- Guest PII: unchanged from the existing `booking_confirmed` baseline.

## Consequences for Kip

- `global_memory/ANALYTICS_GUIDE.md` now documents the four events + super-properties + pitfalls.
- Four Monday-morning questions become the first evals once the eval harness lands.
- Kip can honestly say "I don't have data for that yet" for out-of-scope questions, and name the event that would unlock it — see the "Known gaps" section in the analytics guide.

## Links

- [current.md](../current.md)
- [ANALYTICS_GUIDE.md](../../../global_memory/ANALYTICS_GUIDE.md)
- [BUSINESS.md](../../../global_memory/BUSINESS.md)
- [roadmap.md](../../wiki/roadmap.md) — unrelated to Phase 1–4 progress; this is Phase 0 groundwork on the Veyond side
