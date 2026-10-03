# API

Base path `/api/v1`. All responses are JSON unless noted. Browser calls are only accepted from `ALLOWED_ORIGINS`.

## `GET /health`

`{ "ok": true, "store": true, "coord": true }`

## `GET /reference`

Programs, cabins, airports and the window length. Cached for an hour and revalidated by `ETag`.

## `GET /search/stream`

Server-sent events for one search.

| Param | Meaning |
| --- | --- |
| `p` | Program: `EK`, `EY` or `QR` |
| `o`, `d` | Origin and destination airport codes, different from each other |
| `n` | Travellers, 1 to 6 |
| `request_id` | A UUID made by the client for this search |

Events, each with a JSON `data` line:

| Event | Data |
| --- | --- |
| `meta` | `{ requestId, dates: string[] }`, the 90 dates in order |
| `days` | `{ days: DayResult[], source: "cache" \| "live" }` |
| `progress` | `{ done, total }` blocks |
| `error` | `{ message, dates? }`, dates that could not be read |
| `done` | `{}` |

`DayResult` and `Itinerary` are defined in `packages/shared/src/types.ts`. In short:

```ts
DayResult = { date: 'YYYY-MM-DD', checkedAt: ISO, itineraries: Itinerary[] }
Itinerary = {
  key: 'EK3-EK7', carrier, origin, destination, date, hub: string | null,
  dep: 'HH:MM', arr: 'HH:MM', dayOffset, durationMin, layoverMin,
  aircraft, legs: [{ flight, from, to, dep, arr, aircraft }],
  separateTickets: boolean, currency: 'USD',
  cabins: { economy | premium | business | first: { seats: number | null, miles, tax, saver } },
}
```

Limited to 30 searches per client, refilling one every 4 seconds. Over the limit: `429` with `Retry-After`.

## `POST /search/refresh`

Body `{ p, o, d, n }`. Marks the route so the next search re-reads every day. `200 { ok: true }`, or `429` with `Retry-After` if this visitor asked too often or the route was refreshed in the last 5 minutes.

## `POST /alerts`

Body `{ carrier, origin, destination, cabin, pax, channel: "email", address }`. Returns `201 { id, token }`. Keep the token: it is the only way to remove the alert. `400 { error }` for bad input.

## `DELETE /alerts/:id`

Header `x-alert-token: <token>`. `204` when removed, `404` when not found or the token is wrong.

## `GET /alerts/unsubscribe?token=`

The link in every alert email. Returns a short HTML page.
