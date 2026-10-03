# Design

The reference designs openseat is built from.

- [HANDOFF.md](HANDOFF.md): the full spec for web, mobile web, iOS, Android and tablets, with design tokens. Paths in it that start with `design/` point to `prototypes/` here, and `assets/icon/` points to `icons/`.
- `prototypes/`: working HTML prototypes. Open the `.dc.html` files in a browser with the folder kept intact. They load fonts and icons from public CDNs. `Openseat v2.dc.html` is the main web app; `Openseat Native Apps.dc.html` holds the phone and tablet designs.
- `icons/`: the app icon master (`openseat-icon.svg`) and exports for each platform. The website uses copies of these in `apps/web/public/icons`.

The prototypes are references, not production code. The website in `apps/web` follows them, with these deliberate changes:

- Arabic and English, with a language switch in the header and right-to-left layout.
- A dark palette derived from the same greens.
- Results stream in, with a progress bar and a Stop button, instead of a fixed loading delay.
- Each day shows when it was last checked, with a Check again button, instead of a fixed "Updated 00:00 GST".
- Flight cards add the connection time, Saver and Flex price marks, cabin product badges (Qsuite, A380) and a warning for separate tickets.
- Turning on an alert asks for an email address the first time.
