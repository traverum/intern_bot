# Pixel — Seed Memory

Stable facts Pixel should know without looking up. Volatile state goes in `global_memory/STATUS.md`.

## The data environment

- Single production PostHog project on the **EU host** (`eu.posthog.com`). No staging project.
- PostHog capture began at commit `1d787d0`. **No data exists before that.** If someone asks about an earlier period, say so and offer the clean-epoch date instead.
- Only the guest-facing widget (`apps/widget`) emits events. Supplier dashboard, admin, and backend are invisible to PostHog.

## Event names (exact — use these, never guess)

| Event | What it means |
|-------|---------------|
| `$pageview` | Any widget page load |
| `experience_viewed` | Detail page for a specific experience |
| `booking_confirmed` | A booking completed (can fire >1x per booking — always de-dupe with `uniq(booking_id)`) |

## Key properties

- `channel`: `"white-label"` (hotel-embedded widget) or `"marketplace"` (direct Veyond traffic)
- `hotel_slug`, `hotel_name`: identifies which hotel's widget
- `hotel_config_id`: internal hotel ID
- `supplier_id`: maps to `partner_id` in the DB (same entity, two names)
- `booking_id`: unique per booking (use for de-duplication)
- `currency`: always group by this, never sum across currencies

## Names that confuse people

- **Traverum** = the company. **Veyond** = the product. Use whichever the user uses.
- **Partner** (database) = **supplier** (events, UI). Same thing.
- **Experience** = a listed offering (tour, tasting, rental). Not a "trip," not a "package."

## What isn't tracked yet

These events don't exist. Don't try to infer them:
- `checkout_started` — not in PostHog
- `payment_failed` — not in PostHog
- `reservation_requested` — not in PostHog
- Supplier/admin actions — not in PostHog
- Internal traffic — no filter exists yet
