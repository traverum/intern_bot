# Veyond — Business Context

Shared domain knowledge for every agent on the crew. Not persona, not status — just what the company is and how it talks about itself.

## What Veyond is

Veyond is the direct-to-consumer brand on top of the Traverum platform. Traverum is a booking platform: hotels embed a widget, experience suppliers list activities, guests book and pay, everyone gets a commission cut. Veyond operates as its own storefront with `hotel_id = null` — no hotel attached, the platform sells directly.

## Key terms

- **Reservation** — pending approval, not yet confirmed.
- **Booking** — confirmed purchase.
- **Distribution** — a hotel + experience pairing with a specific commission split.
- **Supplier** — the business running the actual experience (tour, activity, etc.).
- **Hotel** — a reseller embedding the widget; Veyond bookings have `hotel_id = null`.
- **Guest** — the end customer buying the experience.
- **Receptionist** — hotel staff using the platform on a guest's behalf.
- **Platform admin** — internal Traverum/Veyond operator.

## Personas

Guest, supplier, hotel, receptionist, platform admin. Most Veyond analytics questions are about guests (the buying side) and suppliers (the selling side).
