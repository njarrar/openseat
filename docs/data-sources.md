# Data sources

openseat reads availability through one adapter per airline. Three adapters ship today:

| `ADAPTER` / `ADAPTER_EK` etc. | What it does |
| --- | --- |
| `mock` (default) | Stable, realistic-looking sample data. |
| `seatsaero` | Real cached availability from the [seats.aero](https://seats.aero) partner API. |
| `none` | Turns the carrier off. Searches return an error for its days. |

You can mix them, for example real data for Emirates and Etihad and sample data for Qatar:

```bash
SEATS_AERO_API_KEY=...
ADAPTER_EK=seatsaero
ADAPTER_EY=seatsaero
ADAPTER_QR=mock
```

## seats.aero

[seats.aero](https://developers.seats.aero) is a licensed data provider. Its partner API returns reward availability it has already read, with flight detail. The adapter is in `apps/api/src/adapters/seatsaero.ts`.

- **Permission first.** A seats.aero Pro key allows 1,000 calls a day for personal use. Running it on a public site needs written approval from seats.aero (support@seats.aero). Get that before launch.
- **Programs.** Emirates Skywards (`emirates`) and Etihad Guest (`etihad`) are mapped. seats.aero did not list Qatar Privilege Club when this was written, so Qatar stays on another adapter until it does; then set `SEATS_AERO_SOURCE_QR`.
- **Calls.** One call per 15-day block (more only if a block has over 500 rows), so a cold 90-day search costs about 6 calls. Request merging and the store keep repeat searches free.
- **Freshness.** Each day shows when seats.aero last read the airline, not when we asked seats.aero. If that is older than `STALE_AFTER_MIN`, the next search asks again, so keep `STALE_AFTER_MIN` above how often the provider refreshes your routes (6 hours works well) to save calls.
- **Mapping.** Seat counts of 0 mean "unknown" in seats.aero, so a listed flight counts as at least one seat. seats.aero does not say whether a price is Saver or Flex, so every price is shown as Saver. Taxes come in cents and are converted to whole units.
- **Errors.** A bad key or a failed call shows as "could not check" on those days. Nothing is made up.

## Adding a real source

Write a class that implements `CarrierAdapter` in `apps/api/src/adapters/types.ts`, then return it from `buildAdapters` in `apps/api/src/adapters/index.ts`.

```ts
interface CarrierAdapter {
  readonly name: string;
  fetchDays(route: Route, dates: string[], signal: AbortSignal): Promise<DayResult[]>;
}
```

What the rest of the system expects:

- **Blocks, not single days.** `dates` is 15 consecutive days. Use the source's month or calendar view and make one request per block, then ask for flight detail only on days that show seats. One request per day multiplies load by 15 and is the fastest way to get blocked.
- **Every date back.** Return a `DayResult` for each requested date, with an empty `itineraries` list when there is nothing. Set `checkedAt` to when you read it.
- **Real connections only.** Return connections the source sells as one booking. If you join two separate awards yourself, set `separateTickets: true`; the site then warns that the airline does not have to rebook a missed connection.
- **Cash costs.** Fill `tax` per cabin and `currency` on the itinerary. On Emirates and Qatar, carrier surcharges can be large, and people need to see them before they move miles.
- **Saver or not.** Set `saver: false` for Flex or dynamic prices, so the site can mark them.
- **Not offered is not sold out.** Use `seats: null` when a cabin does not exist on the flight and `0` when it exists but has no reward seats.
- **Stop when asked.** Abort network calls when `signal` fires. Nobody is waiting for the result.

## Choosing a source

Use sources you are allowed to use: an official or partner API, a licensed data provider, or a programme that shares the same reward space and offers access for this purpose. Do not build adapters that get around bot protection, fake browser fingerprints, or search with member accounts the airline has not authorised for automated use. Besides the legal risk, those accounts get banned and the data stops.

The request merging, caching and tiered refresh in this repo exist to keep the load on any source low: one fetch per block, shared by everyone asking at the same time, and busy routes refreshed on a spread-out schedule.
