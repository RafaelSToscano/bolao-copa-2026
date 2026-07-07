/**
 * Fires the admin-only cache eviction endpoint. Called by every code
 * path that mutates the source of truth an admin edits (group results,
 * knockout results, team overrides, bracket clears). The server route
 * validates admin status; a non-admin userId is a silent no-op.
 *
 * Fire-and-forget by design: the local write is already committed and
 * the UI has already refreshed. The eviction only affects OTHER
 * viewers' next fetch — if the network fails, their next request will
 * still hit a stale cache for at most the TTL window.
 */
export function evictDashboardCache(userId: string | undefined): void {
  if (!userId) return;
  void fetch("/api/dashboard/cache/evict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).catch(() => {});
}
