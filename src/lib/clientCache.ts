// Tiny sessionStorage-backed SWR cache for the dashboard's
// players/games/predictions snapshot. The whole bundle is read on
// mount to populate state synchronously (no flash of empty), then a
// background refetch revalidates and overwrites if anything changed.
//
// Why sessionStorage and not localStorage: a cache that survives
// across browser sessions would silently drift further from the
// supabase truth, and the size (full predictions table, ~few hundred
// KB at full bolão capacity) is fine in sessionStorage but starts to
// feel like cruft in localStorage. Cleared automatically on tab
// close, which matches the "freshness window" we actually want.

// Bumped to invalidate v1 snapshots keyed as `appData:anon:...` that
// existing browsers hold from a login-race bug (login triggered a fetch
// before currentUser?.id resolved, so the anon-scoped empty predictions
// payload was cached and later reads short-circuited on it).
const CACHE_VERSION = 2;
const CACHE_KEY_PREFIX = "bolao_cache_v" + CACHE_VERSION + ":";
// 3h freshness window mirroring the server-side base-data cache. Every
// admin write path calls /api/dashboard/cache/evict AND useData.invalidateCache
// clears this sessionStorage entry locally, so the freshness ceiling is
// upper-bounded by admin actions in the current tab. Cross-tab evictions
// still require the browser to reload before the local cache clears,
// which is the same behavior as before — a longer TTL just means more
// same-tab navigation reads served from memory instead of round-tripping.
const FRESH_TTL_MS = 3 * 60 * 60 * 1000;

type CacheEntry<T> = {
  ts: number;
  data: T;
};

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readCache<T>(key: string): CacheEntry<T> | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (typeof parsed?.ts !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T, ts: number): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({ ts, data }));
  } catch {
    // Quota or serialization failure — fall back to no-cache. The
    // app keeps working from in-memory state; next mount just
    // refetches as if the cache were empty.
  }
}

export function evictCache(key: string): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(CACHE_KEY_PREFIX + key);
  } catch {
    // Ignore — the next read will revalidate either way.
  }
}

export const CACHE_FRESH_TTL_MS = FRESH_TTL_MS;
