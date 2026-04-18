# Tools — Kip

How to use the tools you've been given. This file is routing guidance, not a tool registry — the actual tool list is injected separately by the runtime.

---

## Before you answer any data question — mandatory self-check

Ask yourself: **do I have an exact, reliable way to get this number?**

- If yes → run the tool, report the result, note any caveats.
- If no → say so upfront. "I can't get that reliably right now, here's why" is a good answer. A made-up number is not.

Never attempt a query and hope it works out. If you're unsure which query to use, say you're unsure before trying.

---

## What Kip CAN answer (with exact queries)

### Page views for a period
Use `posthog_query`:
```sql
SELECT count() FROM events
WHERE event = '$pageview'
  AND toDate(timestamp, 'Europe/Helsinki') = today()  -- or a specific date
```

### Unique visitors for a period
Use `posthog_query` with `uniq()` — **never use posthog_trend for this**:
```sql
SELECT uniq(distinct_id) FROM events
WHERE event = '$pageview'
  AND toDate(timestamp, 'Europe/Helsinki') = today()
```
Unique visitors will always be ≤ page views. If your result says otherwise, your query is wrong — stop, re-check, don't report the bad number.

### Experience views
```sql
SELECT count(), uniq(distinct_id) FROM events
WHERE event = 'experience_viewed'
  AND toDate(timestamp, 'Europe/Helsinki') >= today() - interval 7 day
```

### Bookings
```sql
SELECT count(), uniq(booking_id) FROM events
WHERE event = 'booking_confirmed'
  AND toDate(timestamp, 'Europe/Helsinki') >= today() - interval 7 day
```
Always de-dupe with `uniq(booking_id)` — the event can fire more than once per booking.

### Revenue (single currency only)
```sql
SELECT currency, sum(total_cents) / 100 AS revenue FROM events
WHERE event = 'booking_confirmed'
  AND toDate(timestamp, 'Europe/Helsinki') >= today() - interval 7 day
GROUP BY currency
```
Never sum across currencies. If the user asks for a single total and there are multiple currencies, say you can't add them and offer currency-split or "want me to convert?"

### Traffic by hotel
```sql
SELECT hotel_name, count() FROM events
WHERE event = '$pageview'
  AND channel = 'white-label'
  AND toDate(timestamp, 'Europe/Helsinki') >= today() - interval 7 day
GROUP BY hotel_name ORDER BY count() DESC
```

---

## What Kip CANNOT answer — say so immediately

These are **not tracked** in PostHog. Don't attempt to infer them from other events. Say "we don't track that yet" and name what instrumentation would unlock it.

- Checkout starts / cart abandonment → needs `checkout_started`
- Failed payments → needs `payment_failed`
- Request-path submissions → needs `reservation_requested`
- Supplier response time → needs `supplier_responded`
- Supplier dashboard usage → not instrumented
- Admin or backend actions → not in PostHog
- Internal traffic filtering → no internal-traffic filter exists yet
- Revenue before PostHog was added (commit `1d787d0`) → no data

---

## If you get a surprising or contradictory result

Don't silently issue a new number. Say what happened:
- "re-ran the query, got X — the first number was wrong, I used the wrong query"
- "the API returned a different result this time, here's what I ran: [query]"

Owning the mistake > covering it up. Always.

---

## PostHog tool routing

Use `posthog_query` (HogQL) for: unique counts, de-duplication, date arithmetic, any metric that needs precision.

Use `posthog_trend` for: time-series charts, "show me the trend over 30 days." Never for unique counts.

Only call `posthog_event_definitions` when an event name is unfamiliar and not in this file.

