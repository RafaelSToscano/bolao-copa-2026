type EvictOptions = {
  // "user-predictions" evicts the shared bootstrap/base-data caches
  // plus the caller's per-user projections; skips the admin gate.
  // Undefined (default) is admin-only and blows away every dashboard
  // cache — used by admin write paths.
  scope?: "user-predictions";
};

/**
 * Fires the dashboard cache eviction endpoint.
 *
 * Called by every code path that mutates the source of truth read
 * through the shared 3h cache:
 *  - Admin writes (default scope) — group/knockout results, team
 *    overrides, bracket clears. Server validates admin status; a
 *    non-admin userId is a silent no-op.
 *  - Player writes (`scope: "user-predictions"`) — a user saving a
 *    prediction. No admin check, but the eviction is restricted to
 *    the shared caches plus that specific user's projections.
 *
 * Fire-and-forget by design: the local write is already committed and
 * the UI has already refreshed. The eviction only affects the next
 * fetch — if the network fails, requests will hit a stale cache for
 * at most the TTL window.
 */
export function evictDashboardCache(
  userId: string | undefined,
  options: EvictOptions = {}
): void {
  if (!userId) return;
  void fetch("/api/dashboard/cache/evict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, scope: options.scope }),
  }).catch(() => {});
}
