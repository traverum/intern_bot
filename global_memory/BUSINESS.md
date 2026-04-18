# Veyond — Business Context

Shared domain knowledge for every agent on the crew. Not persona, not status — just what the company is and how it talks about itself.

## What Veyond is

Veyond is a booking platform for local experiences — tours, tastings, rentals, activities. Suppliers list experiences, guests book and pay, the platform earns commission. Operated by **Traverum** (the company); Veyond is the product.

## Two distribution channels

| Channel | What it is | In events |
|---|---|---|
| **White-label** | The Veyond widget embedded on a hotel's website. Guest sees the hotel's branding; Veyond/Traverum is invisible to them. | `channel = 'white-label'`, `hotel_config_id` set |
| **Direct** | The Veyond-branded storefront at `/experiences/*`. No hotel in the loop. | `channel = 'direct'`, `hotel_config_id = ''` |

Every guest-facing page attaches these as super-properties — they ride along on every event automatically.

## Commission model

Every booking splits three ways:

- **Platform (Traverum): 8%** of the booking total.
- **Hotel: ~12%** on white-label bookings (default; distribution-configurable).
- **Supplier: the rest.**

Direct bookings skip the hotel cut. Hotels earn nothing from direct.

No subscription. No markup. The guest pays the experience price; commission comes out before settlement.

## Core nouns

| Noun | What it is |
|---|---|
| **Experience** | An activity a supplier offers (tour, tasting, rental). |
| **Session** | A specific scheduled time slot for a session-based experience. |
| **Reservation** | A booking request — exists before approval or payment. |
| **Booking** | A confirmed, paid (or card-guaranteed) reservation. |
| **Partner** | Database name for a supplier. Events use `supplier_id` which maps to `partner_id` in the database. |
| **Distribution** | A hotel + experience pairing with its custom commission split. |
| **Hotel** | Embeds the widget, earns commission, invisible to the guest. |
| **Guest** | The traveler who books. |

Experience pricing has two types:

- `per_person` — session-based. Guest picks a scheduled time slot.
- `per_day` — rental-based. Guest picks a date range and quantity.

Both travel the same route and fire the same events. The booking widget just switches UI.

## Personas and their surfaces

| Persona | Surface | App |
|---|---|---|
| Guest | Widget (browse + book) | `apps/widget` |
| Supplier | Dashboard (calendar, bookings, payouts) | `apps/dashboard` |
| Hotel / receptionist | Receptionist widget | `apps/dashboard` subset |
| Platform admin | Admin app | `apps/admin` |

All surfaces share one API layer (`apps/widget/src/app/api/`). **Only `apps/widget` emits PostHog events today.** Supplier/hotel/admin actions are invisible to analytics.

## The happy path (session-based, Stripe)

1. Guest lands on the hotel widget or Veyond direct storefront.
2. Browses experiences by tag/category.
3. Clicks an experience → sees sessions, pricing, cancellation policy.
4. Selects a session → enters name, email, participant count.
5. Pays via Stripe (in-widget, no redirect).
6. Lands on the confirmation page → `booking_confirmed` fires.
7. Guest and supplier both receive email confirmation.

## Request-based path (some experiences)

Some experiences require supplier approval before payment. Guest submits a request with card on file; supplier accepts or declines; on accept the card is charged and the guest reaches the same confirmation page. `booking_confirmed` fires there too, with `booking_path = 'request'`.

For `pay_on_site` bookings, commission isn't realized until month-end invoice. `booking_confirmed` slightly **overstates near-term revenue** for that cohort.

## What "conversion" means

A conversion is a **confirmed booking**. The one number for Monday morning: `booking_confirmed` count vs. previous period, split by `channel`.

Conversion rate = `booking_confirmed` ÷ `experience_viewed`.
