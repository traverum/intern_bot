# Analytics Guide

How to answer questions about Veyond's numbers. Shared across any agent that touches PostHog.

Read [BUSINESS.md](BUSINESS.md) first for what the nouns mean.

## Where the data lives

PostHog on the **EU host** (`eu.posthog.com`). Single production project — no staging project.

**Timezone: Europe/Helsinki.** When the team says "yesterday," that's Helsinki local, not UTC. Query with explicit timezone where supported.

PostHog capture was added recently (commit `1d787d0`). **There is no data before that commit** — if someone asks about an earlier period, say so and suggest the clean-epoch date instead.

## What's actually captured

Only the guest-facing widget emits events. Supplier dashboard, admin, and backend actions are **not in PostHog**.

| Event | When it fires | Key properties |
|---|---|---|
| `$pageview` | Guest navigates to any widget page | `$pathname`, `$current_url` (standard) |
| `experience_viewed` | Guest opens an experience detail page | `experience_id`, `experience_title`, `supplier_id` |
| `booking_confirmed` | Guest lands on the confirmation page after checkout | `booking_id`, `experience_id`, `experience_title`, `total_cents`, `currency`, `booking_path` (`'session'` or `'request'`), `$revenue` |

### Super-properties on every event

Attached automatically by `PostHogHotelContext`, so they ride along on every event including `$pageview`:

- `channel` — `'white-label'` or `'direct'`
- `hotel_config_id` — hotel UUID on white-label, empty string on direct
- `hotel_slug` — hotel identifier on white-label
- `hotel_name` — human-readable hotel name on white-label

**Group by `channel` or `hotel_slug` to answer hotel-level traffic questions.**

## Pitfalls — read these before querying

1. **`$revenue` is gross, not commission.** It's `total_cents / 100` — what the guest paid. Traverum's revenue is ~8% of that (more on white-label). Never present `$revenue` as "Veyond revenue" without the split.
2. **Multi-currency.** `currency` is per-experience. **Never sum `total_cents` or `$revenue` across bookings without filtering or grouping by `currency`.** If the user asks for total revenue across currencies, say "I can't add euros and dollars — want it split by currency or converted?"
3. **No internal-traffic filter.** Team members browsing the site inflate `$pageview` counts. Caveat low-volume answers; suggest filtering by a known test email once identify coverage is there.
4. **Identity stitching is weak.** `person_profiles: 'identified_only'` — guests are anonymous `distinct_id`s until checkout submits email. "Unique visitors" really means "unique `distinct_id` cookies."
5. **`$pageview` fires on every nav including back/forward.** Raw count overstates "interest." Prefer `experience_viewed` for experience-interest questions.
6. **`pay_on_site` bookings overstate near-term revenue.** Commission is realized at month-end invoice; there's no signal for that today.
7. **`booking_confirmed` fires on page mount.** If the guest reloads the confirmation page, it may double-count. Use `distinct(booking_id)` to de-dupe.

## The four Monday-morning questions — how to answer

### 1. "Widget visitors yesterday / today"

Trend on `$pageview`, day interval, date range in **Helsinki time**. Report count; mention that back/forward navigation inflates it slightly.

### 2. "Unique visitors"

Unique `distinct_id` count over the period. Caveat: "unique cookie ≈ unique visitor; same person across devices or cleared cookies = multiple."

### 3. "Which hotels drive the most traffic"

`$pageview` grouped by `hotel_slug` (or `hotel_name` for readability), filtered to `channel = 'white-label'`, ordered by count descending. Exclude `channel = 'direct'` or call it out as a separate line.

### 4. "Which experiences get the most interest"

`experience_viewed` grouped by `experience_title`, ordered by count descending. Pair with `booking_confirmed` count on the same group to get a view-to-book rate.

## Ground rules for every answer

- **Discover before querying.** Check the event catalog first when an event name is unfamiliar. If it's not in the list above and not in the catalog, it isn't tracked — say so.
- **Keep queries tight.** Always include a time filter. No unbounded ranges, no `SELECT *`.
- **Summarize the number, don't dump it.** "47 bookings this week, up 12%" beats a JSON blob. One sentence of "why" if the number is surprising.
- **Never invent a metric.** If a tool call can't get it, say you can't and name the instrumentation that would unlock it.
- **Currency-safe.** Revenue answers must specify currency or be grouped by it.

## Known gaps (not tracked yet)

Agents should be able to say "I can't answer that yet, here's what would unlock it":

- `checkout_started` — view → checkout dropoff
- `payment_failed` — failed-payment debugging
- `reservation_requested` — request-path funnel
- `supplier_responded` — supplier response time
- Any backend or supplier-dashboard event
- Commission-realization events (pay-on-site settlement)
- Internal-traffic identification

If a question requires one of these, say so plainly; don't fake it from `$pageview` inference.

## Cross-reference

Unfamiliar business term? Check [BUSINESS.md](BUSINESS.md). PostHog tells you the numbers; BUSINESS.md tells you what they mean.
