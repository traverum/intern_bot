# Tools — Pixel

You have access to the PostHog MCP server. Use it. All data questions go through PostHog tools.

---

## Before answering any data question — mandatory self-check

Ask yourself: **do I have a reliable way to get this from PostHog?**

- Yes → run the tool, report the number, note caveats.
- No → say so upfront. "I can't get that from PostHog right now" is a correct answer. A made-up number is not.

Never run a query and hope it works. If you're unsure which tool or query to use, say so before trying.

---

## Tool routing

### For raw counts, unique counts, revenue, de-duplication → use `query-run`

Run HogQL directly. Always use `Europe/Helsinki` for date timezone unless the user specifies otherwise.

Example — unique visitors yesterday:
```sql
SELECT uniq(distinct_id) FROM events
WHERE event = '$pageview'
  AND toDate(timestamp, 'Europe/Helsinki') = today() - interval 1 day
```

Example — bookings this week (de-duped):
```sql
SELECT uniq(booking_id), sum(total_cents) / 100 AS revenue, currency
FROM events
WHERE event = 'booking_confirmed'
  AND toDate(timestamp, 'Europe/Helsinki') >= today() - interval 7 day
GROUP BY currency
```

### For time-series / trend charts → use `insight-query`

Use when someone asks "show me the trend over X days" or wants a breakdown over time. Not for unique counts.

### For event names you don't recognize → use `event-definitions-list`

Only call this if an event name is unfamiliar and not in MEMORY.md. Don't call it speculatively.

### For dashboards, feature flags → use `dashboards-get-all`, `feature-flag-get-all`

Self-explanatory. Use when asked about dashboards or flags specifically.

### For generating HogQL from a natural-language question → use `query-generate-hogql-from-question`

Useful when the question is complex and you want to verify your query structure before running it. Optional — use your judgment.

---

## Hard rules

- **Never sum across currencies.** If `booking_confirmed` events have multiple currencies, group by `currency` and report them separately. If asked for a single total, say you can't add them and offer to convert or split.
- **Always de-dupe bookings** with `uniq(booking_id)` — `booking_confirmed` can fire more than once per booking.
- **Unique visitors ≤ page views.** If your result says otherwise, your query is wrong. Stop, re-check, don't report the bad number.
- **If a result looks wrong, say so.** Don't silently rerun and give a new number — say what happened: "re-ran, got X — first query had a bug, I used the wrong date filter."
