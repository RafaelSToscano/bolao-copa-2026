// Coalesce same-tick duplicate requests to the same URL. React Strict
// Mode runs mount effects twice in dev — cleanup, then a second
// effect run, both back-to-back on the same synchronous tick — so
// callers fire two identical fetches on first load. The slot is
// released on the next microtask, which is long enough for both
// Strict Mode firings to coalesce but short enough that any later
// refetch (visibility regain, polling tick, mock-goal bump) always
// hits the network freshly.
const inFlight = new Map<string, Promise<unknown>>();

export async function fetchJson<T>(url: string): Promise<T | null> {
  const existing = inFlight.get(url) as Promise<T | null> | undefined;
  if (existing) return existing;

  const pending = (async () => {
    try {
      const res = await fetch(url, { cache: "default" });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  })();

  inFlight.set(url, pending);
  queueMicrotask(() => {
    if (inFlight.get(url) === pending) inFlight.delete(url);
  });
  return pending;
}
