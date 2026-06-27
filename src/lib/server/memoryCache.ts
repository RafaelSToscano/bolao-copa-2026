import { USE_MOCK_DATA } from "@/services/mock";

type CacheEntry<T> = { value: T; expiresAt: number; epoch: number };

// All cache state lives on globalThis so Next.js dev's per-route
// module bundling and HMR re-evaluations don't give each route its
// own copy. Without this, the eviction route's evictByPrefix call
// could mutate one Map while the data route reads from another.
const STATE_KEY = Symbol.for("bolao.memoryCacheState");
type CacheState = {
  store: Map<string, CacheEntry<unknown>>;
  inflight: Map<string, Promise<unknown>>;
  cacheEpoch: number;
};
type GlobalWithState = typeof globalThis & {
  [k: symbol]: CacheState | undefined;
};
const globalScope = globalThis as GlobalWithState;
if (!globalScope[STATE_KEY]) {
  globalScope[STATE_KEY] = {
    store: new Map(),
    inflight: new Map(),
    cacheEpoch: 0,
  };
}
const state = globalScope[STATE_KEY] as CacheState;
const store = state.store;
const inflight = state.inflight;

/**
 * In-memory TTL cache for server route handlers. Coalesces concurrent
 * cache misses so a burst of requests share one upstream call. Returns
 * the cached value when present and unexpired; otherwise calls `loader`,
 * stores the result, and returns it.
 *
 * When NEXT_PUBLIC_USE_MOCK_DATA is on, the TTL is forced to 0 so the
 * mock-goal simulator can mutate state and have the next dashboard
 * fetch pick it up immediately.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const effectiveTtl = USE_MOCK_DATA ? 0 : ttlSeconds;
  const now = Date.now();
  if (effectiveTtl > 0) {
    const cached = store.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }
  }

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const startEpoch = state.cacheEpoch;
  const promise = (async () => {
    try {
      const value = await loader();
      if (effectiveTtl > 0 && startEpoch === state.cacheEpoch) {
        store.set(key, {
          value,
          expiresAt: Date.now() + effectiveTtl * 1000,
          epoch: startEpoch,
        });
      }
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

export function __resetMemoryCacheForTests(): void {
  store.clear();
  inflight.clear();
}

/**
 * Drop every cache entry whose key starts with the given prefix. Used by
 * the mock-mode goal-simulation endpoint to force the dashboard's
 * downstream projections to recompute on the next fetch. Bumps the
 * cache epoch so any in-flight loader skips writing its result back to
 * `store`, preventing a coalesced concurrent miss from resurrecting the
 * pre-eviction value.
 */
export function evictByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
  state.cacheEpoch += 1;
}
