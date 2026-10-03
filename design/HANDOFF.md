# Handoff: openseat — reward seat finder (web, mobile web, iOS, Android, tablet)

## Overview
openseat shows which days have **reward (award) seats** on **Emirates (Skywards), Etihad (Etihad Guest) and Qatar Airways (Privilege Club)** over the next 90 days, so points enthusiasts can find a bookable day and then book on the airline's own site with their miles. openseat never sells tickets or touches miles; it is an availability lookup plus booking instructions and seat alerts.

Core flow on every platform:
1. **Search** — program, cabin, travellers, from, to, one-way / return.
2. **Calendar** — 90-day month calendars; each day shows the max seats open on its best flight (1, 2, 3, 4+), colour-coded.
3. **Day** — every flight that day, miles + taxes per traveller, other cabins open, "How to book" steps and a deep link to the airline site.
4. **Alert** — bell toggle per route + cabin; notify when seats open.

## About the design files
The files in `design/` are **design references built in HTML** — working prototypes that show the intended look and behaviour. They are **not production code**. Recreate them in the target stack:
- **Web / mobile web**: any modern framework (React/Next, Vue, Svelte). One responsive app; mobile web is the same app below 760px.
- **iOS / iPadOS**: SwiftUI, using native controls (`List(.insetGrouped)`, `Picker(.segmented)`, `Stepper`, `Toggle`, `TabView`, `.sheet` with detents, `NavigationSplitView` on iPad).
- **Android (phone + tablet)**: Jetpack Compose + Material 3 (`FilterChip`, `OutlinedTextField`, `Switch`, `NavigationBar` / `NavigationRail`, `ModalBottomSheet`, `Snackbar`, `ListDetailPaneScaffold` / window size classes).

Open the `.dc.html` files directly in a browser (keep the folder intact: they load `support.js`, `award-data.js`, the frame `.jsx` files and Google Fonts / Phosphor from CDN).

## Fidelity
**High-fidelity.** Colours, type, spacing, radii and interactions are final. Reproduce them exactly, with native controls standing in on iOS/Android. Copy in all files is final unless marked as sample data. Prices, seat counts and flight times come from the **mock generator** `award-data.js` and must be replaced by a real data source.

---

## 1. Web app (desktop + mobile web) — `Openseat v2.dc.html`

### Page structure
- Page bg `#f3f3f1`, content `max-width:1200px; margin:0 auto; padding:0 20px`.
- **Header**: `padding:24px 20px 8px; height:64px`, flex space-between.
  - Left: icon `openseat-icon.svg` 32×32, radius 8, gap 10, then wordmark **"openseat"** Hanken Grotesk 23/700, letter-spacing -0.03em, `#14201b`. Always lowercase.
  - Right nav: "How to use" (pill, `padding:8px 14px`, border 1px `#dcdfdb`, hover border `#14201b`) and "Terms" (no border, hover `#1d7a52`). Font 15.
- **Search sentence** (form `role="search"`):
  - Eyebrow h1: "Find reward seats on Emirates, Etihad and Qatar Airways", 16/500 `#4d5a54`, margin-bottom 10.
  - Sentence `<p>`: `font-size:clamp(23px,3.2vw,40px); line-height:1.6; font-weight:500; letter-spacing:-0.015em; text-wrap:pretty`.
    Copy: **"Using [program], show me [cabin] seats for [N travellers] from [City CODE] to [City CODE], [one way | and back N weeks later]."**
  - Each `[ ]` is a picker button: inline-flex, gap 8, `padding:0 14px 2px`, radius 999, border 1.5px `#dcdfdb`, bg `#fbfbfa`, text `#1d7a52` 600, line-height 1.3, caret-down icon at 0.5em `#4d5a54`. Airport code inside the button in DM Mono at 0.5em `#4d5a54`. Hover border `#14201b`. `aria-haspopup="dialog"`, `aria-expanded`.
  - Error (from == to): alert row 15px with warning icon: "Pick two different airports to see seats."
- **Results** section: `margin-top:28px; display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr)); gap:28px; align-items:start` → calendar left, day panel right on desktop.

### Calendar card
- Card: bg `#fbfbfa`, border 1px `#dcdfdb`, radius 20, `padding:18px 16px 22px`, column gap 14.
- **Return tabs** (only when return chosen): segmented track bg `#ebecea`, radius 999, padding 4, gap 4, 2 columns. Tab min-height 48, radius 999; active bg `#fbfbfa` + shadow `0 1px 3px rgba(20,32,27,0.12)`. Content: label 14/600 ("Outbound" / "Return") + route in DM Mono 12 ("DXB → LHR"); second line date 12 `#4d5a54` ("Tue 6 Oct").
- Title h2 20/600: "Seats in Business" / "Outbound seats in Business" / "Return seats in Business".
- Subtitle 14/1.5 `#4d5a54`, one of:
  - "Business from 88,500 miles, one way. Seats on 41 of the next 90 days."
  - "No Business seats in the next 90 days. Turn on an alert to hear when they open."
  - "Etihad Guest does not offer Premium Economy on this route. Try another cabin."
- Legend (13px `#4d5a54`, gap 8×16): swatch 22×22 radius 6 with count in DM Mono 11 — "No seats", "1 seat", "2 to 3", "4 or more"; on Return tab add a bar swatch: "Fits a 2-week trip".
- **Months**: Mon-first grids, `grid-template-columns:repeat(7,minmax(0,1fr)); gap:6px`. Month title h3 16/600. Weekday header 12px `#4d5a54`.
  - Day cell (button): height 56, radius 12, border 1px (see heat), day number absolute top 6 left 8 12/500, count centred DM Mono 17/500 with `padding-top:9px` ("", "1", "2", "3", "4+"). Active: scale(0.94). Focus: 2px `#1d7a52` outline, offset 3.
  - **Selected day**: `box-shadow:0 0 0 2px #fbfbfa, 0 0 0 4px #14201b`.
  - **Past days / before outbound (Return tab)**: static, number only `#b9bfbb`.
  - **Return-fit bar**: 16×3, radius 999, bottom 5, centred; `#14201b` (or `#fbfbfa` on the darkest cell). Marks return days within ±3 nights of (outbound + N weeks).
  - Footnote 13px: "Use the arrow keys to move between days."
- **Loading**: 450 ms skeleton, 35 tiles 56px radius 12 `#ebecea`, `pulse` 1.3s ease-in-out infinite, stagger 0.05s per column. Results enter with `rise` (opacity 0→1, translateY 10→0) .45s `cubic-bezier(.16,1,.3,1)`.

### Heat scale (web)
| Seats | bg | text | border |
|---|---|---|---|
| 0 | `#fbfbfa` | `#5f6b65` | `#e1e4e0` |
| 1 | `#d4ecdd` | `#14201b` | `#8cc9a5` |
| 2–3 | `#5fb184` | `#0f1a15` | `#5fb184` |
| 4+ | `#1b6a47` | `#fbfbfa` | `#1b6a47` |
Colour is never the only cue — the count is always printed.

### Day panel
- Desktop: `position:sticky; top:24px`, transparent.
- Mobile (≤760px): **bottom sheet** — fixed, left/right/bottom 0, radius `24px 24px 0 0`, max-height 86dvh, scroll, bg `#f3f3f1`, padding `10px 16px 28px`, shadow `0 -20px 50px rgba(20,32,27,0.18)`; hidden `translateY(105%)`, shown `none`, transition transform .35s `cubic-bezier(.16,1,.3,1)`. Grabber 40×4 `#c5cac6`; close button 44×44. Backdrop `rgba(20,32,27,0.32)`. Opens when a day is tapped; Esc closes.
- Header: date h3 26/600 -0.02em ("Tuesday 6 October"), prev/next day buttons 44×44 round, border `#dcdfdb` (disabled opacity .4).
- Sub 15px `#4d5a54`: "2 of 3 flights from DXB to LHR with Business seats. Prices per traveller, one way."
- Return line (if return): "Outbound Tue 6 Oct, return Tue 20 Oct, 14 nights." with arrows icon.
- Actions row: **Alert toggle** (40h pill; off: border `#dcdfdb` bg `#fbfbfa` "Alert me when seats open" bell icon; on: bg `#e6f3eb` border `#8cc9a5` "Alert on" filled bell-ringing icon), **Copy link** (→ "Copied" with check for 1.6s), and "Updated 00:00 GST" / "Updated 12:00 GST" 13px.
- **Flight card**: bg `#fbfbfa`, border `#dcdfdb`, radius 20, padding 18, gap 12.
  - Times DM Mono 21: "02:40 → 07:05" with "+1" sup 11 `#1d7a52`.
  - Meta 14 `#4d5a54`: "EK 3 + EK 7, A380-800, 1 stop in Dubai, 9h 05m" / "…, nonstop, …".
  - Price 22/700 "88,500 miles" (unit 14/500 muted); sub 13: "+ $412 taxes, 4 seats open" (9+ cap).
  - Unavailable: 15/600 muted "Business not offered" or "No Business seats".
  - "Also open" chips: 32h pill, border `#8cc9a5` bg `#e6f3eb`, label + DM Mono price "26k"; tapping switches cabin.
  - "How to book" disclosure (caret rotates 180°, .25s): numbered steps (22px circle `#e6f3eb`/`#1d7a52`):
    1. "Sign in to {program} on {site}."
    2. "Search {O} to {D} on {Weekday D Month} with {Classic Rewards | Book with miles | Book with Avios} turned on."
    3. "Choose {flight numbers} in {cabin}. For {N travellers} it comes to {miles×N} {unit} plus ${tax×N}."
    CTA: "Open emirates.com ↗" 48h pill `#1d7a52` → hover `#16633f`, opens airline site in new tab.

### Pickers
- Desktop: popover anchored 8px under trigger, width 380, max-height 460, radius 18, border `#dcdfdb`, shadow `0 24px 60px rgba(20,32,27,0.2)`, transparent scrim (click-out closes).
- Mobile: bottom sheet, left/right/bottom 12, radius 24, max-height 78dvh, scrim `rgba(20,32,27,0.32)`.
- Dialog semantics: `role="dialog" aria-modal`, focus trapped, Esc closes, focus returns to trigger. Options 52 min-height, radius 14, selected bg `#e6f3eb` + check icon.
- **Program**: "Emirates Skywards" / "Etihad Etihad Guest" / "Qatar Airways Privilege Club", sub "Priced in miles. Hub: Dubai".
- **Cabin**: Economy, Premium Economy (sub "Emirates only, on some A380 and A350 routes"), Business, First.
- **Travellers**: 1–6; sub "Days show seats only when one flight has N open".
- **Return**: One way, Back 1/2/3/4 weeks later (sub "Return days 11 to 17 nights after you leave are marked").
- **Airports**: type-ahead input (46h pill, label "City, airport code or Arabic name", placeholder "e.g. London, LHR or لندن"), matches IATA code, city, country, Arabic city, Arabic country. Empty query shows "Popular routes" chips (DXB → LHR, DOH → NRT, AUH → BKK, DXB → MLE, RUH → LHR, KWI → JFK) then "All airports". Each row: "London (LHR)", country, Arabic name (IBM Plex Sans Arabic 14, `dir="rtl"`). Empty: "No airports match. Try a city, a 3-letter code or the Arabic name."
- Changing any picker re-runs the search (skeleton 450 ms). No separate Search button on web.

### How it works (bottom of search page)
- 4 steps with 44px icon dots (`#e6f3eb`/`#1d7a52`, last one solid `#1d7a52`): Build your search / Scan the next 90 days / Open a day / Book with the airline.
- "Reading the calendar" key card, "Booking notes by program" accordions (EK / EY / QR), "Good to know" 6-item grid. Exact copy is in the file.

### Footer (all web pages)
Disclaimer 13px `#4d5a54`: "Openseat is independent and not affiliated with or endorsed by Emirates, Etihad Airways or Qatar Airways. Program names are trademarks of their owners." + "© 2026 Openseat · v1.0.0" + links How to use / Terms.

### Shareable URL
`?p=EK|EY|QR&o=DXB&d=LHR&c=economy|premium|business|first&n=1..6&r=0|7|14|21|28` — read on load, written by "Copy link".

### Keyboard & a11y
- Calendar is one tab stop (roving `tabIndex`): ←/→ ±1 day, ↑/↓ ±7 days; focus follows selection.
- Every day button has an `aria-label`: "Tuesday 6 October, 4 or more seats from 88,500 miles, fits your trip".
- Hit targets ≥44px on mobile. `prefers-reduced-motion` disables animation.

### Other web pages
- `Openseat How to use.dc.html` — basics (4 moves), 4 worked examples (sentence + 3 tips + "Try this search" deep link using the URL params), FAQ, CTA.
- `Openseat Terms.dc.html` — 7 sections with an in-page index; index column is sticky only ≥860px. **Placeholder legal copy — have counsel review.**
- `Openseat Mobile Preview.dc.html` — the three pages in 390×844 iframes for reference.

---

## 2. Native apps — `Openseat Native Apps.dc.html`
Section 2 = tablets (2a iPad, 2b Android tablet), section 1 = phones (1a iOS, 1b Android). Interactive: programs, cabins, travellers, return switch, day taps, prev/next, Book, bell.

### Information architecture (both platforms)
Tabs: **Search** · **Alerts** · **Settings**. Search tab stack: Search → Calendar → Day → How to book (sheet on phone, inline on tablet).
Alerts and Settings tabs are not designed yet (Alerts = list of watched route + cabin with on/off; Settings = currency, language EN/AR, notifications).

### iOS phone (1a) — 402×874 reference
- Font: SF Pro (system). Tint `#1d7a52`. Background `#f2f2f7` (systemGroupedBackground).
- **Search**: small wordmark row ("openseat" 15/700 tint + profile button 36 round white), large title "Search" 34/700, sub 15 `#6e6e73` "Reward seats on Emirates, Etihad and Qatar Airways.".
  - Section headers 13 uppercase `#6e6e73`, inset 36: MILES PROGRAM / ROUTE / TRIP.
  - Program: `Picker(.segmented)` Emirates | Etihad | Qatar Airways (track `rgba(118,118,128,0.12)` r9, segment 32h r7, selected white + shadow).
  - Route group (inset grouped, radius 22, rows 52, separators 0.5 `rgba(60,60,67,0.29)` inset 48): From — Dubai DXB ›, To — London LHR › (push airport search with `.searchable`).
  - Trip group: Cabin (menu, value in tint with ⌃⌄), Travellers (value + `Stepper`), Return trip (`Toggle`, tint), when on: "Back after — 2 weeks" (menu).
  - Footer 13: "A day shows seats only when one flight has enough for every traveller."
  - Primary button "Find seats" 52h capsule tint, 17/600 white.
- **Calendar**: nav with glass circular back button (44), centred title "DXB → LHR" 17/600 + sub 12 "Business · 1 traveller" (+ " · Alert on"), trailing bell button (on = tint fill, white bell). Cabin segmented (Economy | Premium | Business | First) — instant switch. Summary 15 `#3c3c43`. Legend 14px swatches r4. Month title 20/700; weekday header 11/600 `#8e8e93` (MON…SUN). Cells 48h r12 gap 4, day 12/500 top, count 15/700 tabular.
- **Day**: large title date 28/700 ("Tuesday 6 October"), sub 15 muted; nav trailing capsule with ⌃ ⌄ for prev/next day. Flight cards white r22 p16: times 22/600 tabular, meta 13, separator, price 20/700 + sub 13, **Book** tinted capsule (bg `rgba(29,122,82,0.12)`, tint text 15/600, 36h). "Also open" grey capsules.
- **How to book sheet**: `.sheet` with medium detent, floating (inset 8, radius 40), grabber 36×5 `#d1d1d6`. Title "How to book" 20/700, sub "EK 1 · DXB → LHR · Tue 6 Oct", close button 36 round `#f2f2f7`. Steps (22px tinted circles), total row on `#f2f2f7` r16: "Total for 1 traveller — 88,500 miles + $412". CTA "Open emirates.com ↗" 52h capsule → open airline URL (SFSafariViewController or universal link).
- **Tab bar**: iOS 26 floating glass capsule, 62h, inset 20, bottom 26, `rgba(255,255,255,0.78)` + blur 20 saturate 1.8; selected item pill `rgba(0,0,0,0.05)`, tint icon (filled) + 10/600 label.
- iOS heat: 0 `#ffffff`/`#8e8e93` (hairline `rgba(60,60,67,0.18)`), 1 `#d4ecdd`/`#0b2b1b`, 2–3 `#5fb184`/`#06170e`, 4+ `#1b6a47`/`#ffffff`; selected ring `0 0 0 2px #f2f2f7, 0 0 0 4px #000`.

### Android phone (1b) — 412×892 reference
- Material 3, Roboto, Material Symbols Rounded. Use a fixed brand colour scheme (below) — optionally allow dynamic color but keep the heat scale fixed.
- **Search**: top bar "openseat" 22/500 primary + account_circle. Headline 28/400 "Find reward seats", sub 14 "Emirates, Etihad and Qatar Airways, the next 90 days." "Miles program" label 14/500 + single-select **FilterChips** (32h r8; selected secondaryContainer + check). OutlinedTextFields 56h r4 with leading flight_takeoff / flight_land: "Dubai (DXB)", "London (LHR)"; tonal swap_vert icon button 40 between them. Row: Cabin exposed dropdown (arrow_drop_down) + Travellers field with remove/add icon buttons. List item "Return trip" / "One way | Back 2 weeks later" + M3 **Switch** (with check icon when on). Filled button 56h "Search" with search icon.
- **Calendar**: top bar arrow_back, "Dubai to London" 22 + sub 14 "Business · 1 traveller", bell icon button (on = notifications_active filled, secondaryContainer bg). Cabin FilterChips row (horizontal scroll). Summary 14, legend circles. Month title 16/500, weekday M T W T F S S 12. Cells 50h **r16** gap 4.
- Turning on alert → **Snackbar** (inverseSurface `#2c322d`, text `#ecf2ea`, action "Undo" `#95d5ab`): "You will get an alert when Business seats open" / "Alert turned off", 3.5s, above nav bar.
- **Day**: top bar date "Tue 6 Oct" + chevron_left / chevron_right. Filled cards (surfaceContainer `#eaefe8`, r12, p16): times 22 "02:40 – 07:05 +1", meta 14, divider outlineVariant, price 22/500 + sub 14, **FilledTonalButton** "How to book". Other cabins as outlined chips with airline_seat_recline_normal icon.
- **ModalBottomSheet**: surfaceContainerLow `#f0f5ee`, top radius 28, drag handle 32×4 onSurfaceVariant 40%. Title 22 "How to book", sub, steps with 28px primaryContainer circles, divider + total row, filled button 48h "Open emirates.com" + open_in_new.
- **NavigationBar** 80h surfaceContainer, active indicator 64×32 secondaryContainer pill, labels 12 (700 when selected): Search / Alerts / Settings.
- Android heat: 0 `#eaefe8`/`#717971`, 1 `#c8ebd2`/`#002110`, 2–3 `#7ccd98`/`#002110`, 4+ `#2b6a46`/`#ffffff`; selected ring `0 0 0 2px #f6fbf3, 0 0 0 4px #171d19`.

### iPad (2a) — 1194×834 landscape reference
- `NavigationSplitView`-style three columns: **Search 330** | **Calendar flexible** | **Day 370**. Top: wordmark left, floating glass tab bar centred (Search active pill / Alerts / Settings).
- Search column = phone Search groups (no Find seats button; every change updates the calendar live: "Changes update the calendar straight away.").
- Calendar column in a glass panel (`rgba(255,255,255,0.9)`, r30, shadow `0 4px 24px rgba(0,0,0,0.06)`): title "Dubai → London" 22/700 + sub + bell (40). Cabin segmented, summary + legend on one row. Cells 50h r12, day number top-left 12, count bottom-right 16/700.
- Day column: date 22/700 with ‹ › capsule, flight cards; **Book** expands steps **inline** in the card (label becomes "Hide steps"), with total and CTA 44h. One card expanded at a time.

### Android tablet (2b) — 1280×800 landscape reference
- **NavigationRail** 96w: menu, FAB 56 r16 primaryContainer `add_alert`, items Search (active 56×32 indicator) / Alerts / Settings.
- Panes: **Search 320** (surfaceContainerLow, r16) | **Calendar flexible** | **Detail 380** (surfaceContainerLow, r16, white elevated cards r12 with `0 1px 2px rgba(0,0,0,0.08)`). Inline "How to book" expansion as on iPad. Snackbar centred bottom 440w.
- Use window size classes: **compact** (<600dp) = phone flow; **medium** (600–839dp) = calendar + detail pane, search in a sheet/rail; **expanded** (≥840dp) = three panes as shown. Same breakpoints guide iPad portrait / Split View.

---

## 3. App icon — winner 1c "Window seat"
- Master: `assets/icon/openseat-icon.svg` (1024 grid, full-bleed square — the OS applies the mask).
- Layers: bg `#1d7a52`; window opening 460×660 r230 at (282,182) filled sky `#ffd36b`; sun r64 `#fff4cf` at (402,380); cloud band `#f6f1e3` 90%; window blind `#f6f1e3` 128h + edge `#d9d2bd` 14h; plane `#14201b` rotated 45° centred (560,520); window frame stroke 56 `#f6f1e3`; blind handle 76×20 r10 `#c7bfa8`.
- Exports in `assets/icon/`: `ios-appstore-1024.png`, `ios-180.png`, `ios-120.png`, `android-play-512.png`, `android-xxxhdpi-192.png`, `android-adaptive-foreground.svg` (artwork inset to the 66% safe zone, transparent) + `android-adaptive-background.svg` (solid `#1d7a52`), `web-pwa-512.png`, `web-pwa-192.png`, `web-apple-touch-180.png`, `favicon-32.png`. Convert the adaptive SVGs to VectorDrawables in Android Studio; add a monochrome layer (plane + window frame) for themed icons.
- The PNGs are rasterised from the SVG in-browser; re-export from the SVG in your pipeline for final store submission. The icon was drawn in this session and is a solid starting point — consider a final pass by an illustrator.

---

## Interactions & behaviour (all platforms)
- Program / cabin / travellers change → recompute calendar immediately (web shows 450 ms skeleton); selection resets to first day with seats.
- Default selected day = first day with seats in the chosen cabin.
- Day tap → select (phone/mobile web: open Day screen / sheet). Prev/next day steps ±1, clamped to [today, today+89] (Return: ≥ outbound day).
- "Also open" chip → switch cabin, keep day.
- Return: outbound + return legs; return days within ±3 nights of the chosen length get the fit bar; Return tab only allows days ≥ outbound.
- Bell → toggle alert for `{program}-{O}-{D}-{cabin}`; web toast 3.2s ("We will email you when Business seats open on DXB to LHR."), Android snackbar with Undo, iOS state on the button (+ local notification permission prompt on first enable).
- A day "has seats" only if **one flight** has ≥ travellers seats in the cabin. Count shown = max seats on any qualifying flight (capped "4+" in cells, "9+" in cards).
- Cabin rules (from data): Premium Economy only on Emirates A380/A350 long-haul; First only on specified aircraft (EY/QR A380; EK A380/777); "not offered" ≠ "no seats".

## State
`carrier`, `from`, `to`, `cabin`, `pax (1–6)`, `ret (0|7|14|21|28 days)`, `leg ('out'|'ret')`, `sel {out, ret}` day indices, `expandedFlight`, `pickerOpen`, `query`, `sheetOpen`, `watch {key: bool}`, `toast`. Persist search in URL (web) / restoration state (native); persist alerts server-side per user.

## Data contract (replace `award-data.js`)
`award-data.js` is a deterministic mock generator. A real backend should return, per `{carrier, from, to, pax}`, 90 days of:
```
days[i] = { date, by: { [cabin]: { count, minMiles, nq, offered } },
            fl: [ { f: { nums[], dep, arr, dayOff, total, dist, ac, direct, hub, O, D }, seats: { [cabin]: number|null } } ] }
```
`null` = cabin not offered on that flight; `0` = offered, no reward seats. Miles = published one-way saver price per traveller; taxes in USD (estimate). Refresh cadence in copy: 00:00 and 12:00 Gulf time — update copy if that changes. Airline programs: `CARRIERS` (name, program, unit "miles"/"Avios", hub, site, booking-toggle term, Arabic names). Airports: `AIRPORTS` with IATA, city, country, Arabic city/country, lat/lon, tz.

## Design tokens
**Web / brand**
- Ink `#14201b` · Body secondary `#33413b` · Muted `#4d5a54` · Page `#f3f3f1` · Surface `#fbfbfa` · Border `#dcdfdb` · Skeleton/track `#ebecea` · Grabber `#c5cac6`
- Accent `#1d7a52` · Accent hover `#16633f` · Accent tint `#e6f3eb` · Accent border `#8cc9a5` · Toast icon `#9fd3b6`
- Scrim `rgba(20,32,27,0.32)` · Card shadow (popover) `0 24px 60px rgba(20,32,27,0.2)` · Sheet shadow `0 -20px 50px rgba(20,32,27,0.18)`
- Radii: 6 (legend), 12 (cells), 14 (options), 16 (accordions), 18 (popover), 20 (cards), 24 (sheets), 999 (pills)
- Type: Hanken Grotesk 400/500/600/700 (UI), DM Mono 400/500 (codes, times, counts), IBM Plex Sans Arabic 400/500 (Arabic). Scale 12 · 13 · 14 · 15 · 16 · 17 · 20 · 22 · 26 · clamp(23–40) sentence · clamp(32–52) page H1.
- Spacing: 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 28 · 40 · 48 · 64 · 112.
- Motion: `cubic-bezier(.16,1,.3,1)` for enter/sheets (.25–.45s); press scale .94 (.15s).
- Icons: Phosphor 2.1.1 (regular; fill for active).

**Android M3 scheme (light)**: primary `#2b6a46` · onPrimary `#ffffff` · primaryContainer `#b1f1c3` · onPrimaryContainer `#002110` · secondaryContainer `#d0e8d5` · onSecondaryContainer `#0b1f13` · surface `#f6fbf3` · surfaceContainerLow `#f0f5ee` · surfaceContainer `#eaefe8` · onSurface `#171d19` · onSurfaceVariant `#414942` · outline `#717971` · outlineVariant `#c1c9c0` · switch track off `#dee4dd` · inverseSurface `#2c322d` · inverseOnSurface `#ecf2ea` · inversePrimary `#95d5ab`.

**iOS**: tint `#1d7a52` · tinted fill `rgba(29,122,82,0.12)` · grouped bg `#f2f2f7` · cell `#ffffff` · label `#000` · secondary `#6e6e73` · tertiary `#8e8e93` · separator `rgba(60,60,67,0.29)` · segmented track `rgba(118,118,128,0.12)` · sheet grabber `#d1d1d6`.

Dark mode, RTL/Arabic UI and currency selection (AED/SAR/QAR alongside USD) were discussed as requirements but are **not designed** in these files — mirror layouts for RTL (calendar Sunday→Monday direction mirrors, time flows right-to-left) and derive dark tokens from the same green ramp.

## Files
`design/`
- `Openseat v2.dc.html` — **main web + mobile web app** (search, calendar, day panel/sheet, pickers, how it works)
- `Openseat How to use.dc.html` — worked examples page
- `Openseat Terms.dc.html` — terms page (placeholder legal copy)
- `Openseat Mobile Preview.dc.html` — web pages at 390×844
- `Openseat Native Apps.dc.html` — iOS + Android phone (1a/1b) and tablet (2a/2b)
- `Openseat App Icon.dc.html` — icon exploration (1c chosen)
- `award-data.js` — mock data generator + airport/program reference data
- `support.js`, `ios-frame.jsx`, `android-frame.jsx` — prototype runtime and device frames (not for production)
- `openseat-icon.svg` — icon used by the web pages

`assets/icon/` — icon master SVG and platform exports (see §3).
