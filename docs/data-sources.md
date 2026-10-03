# Data sources

openseat reads availability through one adapter per airline. Today every carrier uses the sample adapter (`ADAPTER=mock`), which makes up stable, realistic-looking data. Set `ADAPTER_EK=none` (or `EY`, `QR`) to turn a carrier off; searches then return an error for that carrier's days.

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
