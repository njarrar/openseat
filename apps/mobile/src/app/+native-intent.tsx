// The bot check page returns to the app on openseat://check. The browser sheet
// that opened it reads that link, so the router should not open a screen for it.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    if (/^(?:[a-z]+:\/\/[^/]*)?\/?(?:--\/)?check(?:[/?#]|$)/i.test(path)) return initial ? '/' : null;
  } catch {
    /* fall through */
  }
  return path;
}
