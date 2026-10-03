# Architecture

```
Browser ──► CDN / WAF ──► static site (apps/web/dist)
   │
   └──── EventSource ──► API instances (apps/api) ──► Redis   locks, pub/sub, rate limits
                               │                  └─► Postgres  days, alerts, search counts
                               └─► carrier adapters (one per airline)
```

## A search, step by step

1. The browser makes a new request id and opens `GET /api/v1/search/stream`.
2. The API sends `meta` with the 90 dates, then every day it already has as one `days` event (`source: cache`).
3. Dates are split into 15-day blocks lined up with the window start, so everyone searching today asks for the same blocks. A block is fetched again if any day in it is missing or older than `STALE_AFTER_MIN` (6 hours by default).
4. For each stale block, the API joins a shared job (below), then sends the result as `days` (`source: live`) and a `progress` event.
5. `done` ends the stream. A block that fails sends `error` with its dates, and the site keeps whatever it had for them.

The site draws the calendar as soon as `meta` arrives. Days still on their way pulse, and fill in as blocks land. A Stop button closes the stream.

## Request merging

Many people often open the same link at once. Each block has a job key, `carrier:origin:destination:firstDate:length`.

- A request subscribes to `job:<key>` on Redis first, then adds itself to `listeners:<key>`.
- It tries `SET lock:<key> NX PX`. Whoever gets the lock runs the fetch on its own, writes the days to Postgres, releases the lock and publishes the result. Everyone else just waits for the message.
- When a request goes away (tab closed, Stop pressed, new search), it leaves the counter. The running fetch checks the counter and stops if nobody is listening. Blocks a request had not started yet are never fetched.
- If the worker dies, waiters time out after the lock expiry and fall back to whatever is stored.

Because progress and cancelling belong to the request id, two tabs searching the same airline never share progress or cancel each other.

## Refreshing

Instead of one big refresh at fixed times, which hits airline systems all at once, a scheduler runs every minute on every instance:

| Tier | Routes | Refreshed when older than |
| --- | --- | --- |
| 1 | `TRUNK_ROUTES` and the 20 most searched routes of the last 7 days | about 3 hours, spread 2 to 4 hours per route |
| 2 | Routes with an active alert | about 90 minutes, spread 1 to 2 hours |
| 3 | Everything else | 6 hours, refreshed when someone searches |

Each route gets a stable jitter, so routes spread across the hour. A per-route lock makes sure only one instance refreshes a route. `routesPerTick` caps how many routes start per minute.

Anyone can ask for a fresh check from the day panel. `POST /api/v1/search/refresh` is limited per visitor (3 tokens, about one every 3 minutes) and per route (once every 5 minutes). The site then re-opens the stream, and every day read before the request counts as stale.

## Storage

`apps/api/src/db/migrations/001_init.sql`

- `award_itineraries`: one row per flight per day, keyed by carrier, origin, destination, date and flight key. Seats, miles, taxes and a saver flag per cabin. `seats` is null when the cabin is not sold on that flight and 0 when it is sold out. Taxes have a currency. Legs, with aircraft, are kept as JSON.
- `route_days`: one row per day read, even with no flights, so "read, nothing there" differs from "never read". `checked_at` drives freshness.
- `route_searches`: daily search counts per route, for the scheduler.
- `alert_subscriptions`: route, cabin, travellers, channel and address, an unsubscribe token, whether seats were open at the last check and how many emails went out today.

Storing per route and day means any search is put together from partial hits.

## Alerts

After each fetch, the API checks alerts on that route. An alert fires when its cabin goes from "no day has seats for this many travellers" to "some day does". It then waits until seats close before it can fire again, and sends at most two emails a day. Every email has an unsubscribe link. The starting state is read from the store when the alert is created, so the first email always means "newly open".

## Security

- CORS allows only the origins in `ALLOWED_ORIGINS`. The stream and every write also reject other browser origins outright, since EventSource ignores CORS for its response.
- Token-bucket rate limits per client address: searches, refreshes and alert creation.
- Request bodies are capped at 8 KB and every input is checked against the reference data.
- Alerts can only be removed with their secret token.
- `nosniff`, `DENY` framing and a strict referrer policy on every response.

## Front end

- Preact with TypeScript. Each calendar cell is memoised, so moving the selection re-renders only the cells that change, not the 90-day grid.
- Day cells are plain buttons with `aria-pressed` and a full label. The grid is one tab stop: arrow keys move by day or week, and the keys flip in right-to-left layout. Flights live in a separate panel, so no control is nested inside another.
- Pickers, the alert form and the phone bottom sheet are native `<dialog>` elements opened with `showModal()`, which gives a focus trap, Escape and an inert page for free.
- CSS is bundled at build time with no runtime `@import`. Fonts are self-hosted with stable names. A small script in the head picks the language before first paint and preloads only that language's fonts.
- Reference data (airports, programs, cabins) is bundled into a hashed file, so it can be cached forever and changes ship with a new name. The API also serves it at `/api/v1/reference` with an ETag and a one-hour cache, never `immutable`.

## How the build guidelines were handled

| Guideline | Where |
| --- | --- |
| Per-search request ids instead of a browser-wide session | `apps/web/src/lib/api.ts`, `apps/api/src/http/server.ts` |
| Server-sent events instead of polling, cached days first | `apps/api/src/search/service.ts` |
| Cancel unstarted work when the client leaves | `SearchService.fetchShared` and `runJob` |
| Request merging across instances | Redis lock, pub/sub and listener counts |
| Per route and day storage with seats, miles, taxes, currency, saver flag, legs, aircraft | `001_init.sql` |
| Tiered, jittered refresh instead of fixed times | `apps/api/src/scheduler.ts` |
| Freshness per day and a rate-limited refresh button | Day panel, `POST /api/v1/search/refresh` |
| No `immutable` on unversioned API paths; one versioned reference file | `/api/v1/reference`, hashed web bundle |
| No CSS `@import` chain; font preloads | Vite build, `index.html` head script |
| No full rebuild on selection; valid ARIA; no nested controls | `Calendar.tsx` |
| Native `<dialog>` for sheets and pickers | `Picker.tsx`, `AlertDialog.tsx`, `SearchApp.tsx` |
| No wildcard CORS | `ALLOWED_ORIGINS` |
| Taxes shown next to miles | Flight card and booking steps |
| Saver and Flex prices told apart | `saver` flag, "Flex price" badge |
| Self-stitched connections flagged | `separateTickets` flag, "Separate tickets" badge and note |
| Aircraft and cabin product shown | Aircraft in each flight line, Qsuite and A380 badges |
| Arabic and English with a switch | `apps/web/src/i18n` |

Kept from the design rather than the guidelines, at the owner's request: the window stays at the next 90 days.
