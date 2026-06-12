# Dashboard

A summary landing page composed of compact, read-only panels:

- **Live games** (full live card per match, only when matches are live)
- **My status** (position, points, exacts, completion %)
- **Top of the ranking** (podium for 1–3, slim rows for 4–5, lanterna)
- **Group leaders** (one row per group with the team in 1st place)
- **Upcoming matches** (next 3–5 future kickoffs)
- **Recent results** (last 3–5 finished games with my prediction and points)

The Dashboard is the **first menu item** and the default landing tab
after login.

## Architecture

```
DashboardSection ──► useDashboardData(userId)
                          │
                          ├─► GET /api/dashboard/live           (10s when live, 60s otherwise)
                          ├─► GET /api/dashboard/ranking-top
                          ├─► GET /api/dashboard/upcoming
                          ├─► GET /api/dashboard/recent?userId=…
                          ├─► GET /api/dashboard/my-status?userId=…
                          └─► GET /api/dashboard/group-leaders
```

Each route handler:

1. Reads the in-memory cache (`withCache`) — returns immediately on hit.
2. On miss, calls the appropriate service(s) and projects the slice
   payload (top-5, last-5, leaders, etc.).
3. Stores the projection in cache.
4. Returns JSON with a public `Cache-Control: s-maxage,
   stale-while-revalidate` header (or `private` for `my-status`).

The dashboard never calls `useData` — it owns its own data layer with
slice-shaped payloads, dramatically smaller than the full datasets the
other tabs load.

## TTLs

| Route                    | s-maxage | swr  | Notes                          |
|--------------------------|----------|------|--------------------------------|
| `/api/dashboard/live`    | 8s       | 20s  | Tightest — live scores         |
| `/api/dashboard/ranking-top` | 30s  | 60s  |                                |
| `/api/dashboard/upcoming`| 120s     | 600s | Match schedule rarely changes  |
| `/api/dashboard/recent`  | 30s      | 120s |                                |
| `/api/dashboard/my-status` | (private, max-age=10) | — | Per-user, not shared    |
| `/api/dashboard/group-leaders` | 60s | 300s |                              |

## Caching layers

- **HTTP `Cache-Control`** (per client + CDN edge) — `public,
  s-maxage,stale-while-revalidate`.
- **In-memory `withCache`** (per Node instance) — coalesces
  concurrent misses so a burst of requests share one upstream call.

Both layers are intentionally redundant: the HTTP layer absorbs
load globally; the in-memory layer handles concurrent requests
landing on the same instance during the `s-maxage` window.

## Polling cadence

`useDashboardData` adapts its polling interval based on the latest
`/api/dashboard/live` response:

- `liveGames.length > 0` → **10s** (fast)
- `secondsUntilNextKickoff <= 60` → **10s** (catches kickoff)
- otherwise → **60s** (baseline)

The hook also pauses on `document.visibilityState === "hidden"` and
refetches immediately on resume.

## Mock-data toggle

`NEXT_PUBLIC_USE_MOCK_DATA` defaults to **`false`**. The flag is
strict-matched against the literal string `"true"` — anything else
(unset, `"false"`, `"0"`, `"yes"`, etc.) leaves real Supabase and
football-data paths fully active.

Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local` to run the app
without Supabase or football-data credentials.

When the flag is on:

- `playersService.getAllPlayers()` returns 10 fake players.
- `gamesService.getAllGames()` returns 72 mock group-stage games with
  a small handful of matches near `MOCK_NOW` so the live banner has
  something to show.
- `predictionsService.getAllPredictions()` returns one prediction per
  (player, game) pair.
- `/api/live-scores` returns mock live scores derived from
  `MOCK_GAMES`.
- All write methods (approve/reject/upsert/delete) are no-ops that
  resolve successfully.
- `useAuth` accepts any access code and resolves to a fixed mock user
  (the access code can be parsed as an integer to switch perspectives —
  e.g. `0` is the admin, `1`–`9` are regular players).
- `withCache` uses a forced TTL of 1s so fixture edits are reflected
  immediately during local dev.

To pin a specific "now" for deterministic tests:

```bash
NEXT_PUBLIC_MOCK_NOW=2026-06-15T18:30:00.000Z NEXT_PUBLIC_USE_MOCK_DATA=true npm run dev
```

## Adding a new dashboard panel

1. Add a projection function in
   `src/services/dashboard/dashboardProjections.ts` and unit-test it
   with hand-built fixtures.
2. Add a route under `src/app/api/dashboard/<your-panel>/route.ts`
   that calls `withCache` + your projection and returns the right
   `Cache-Control` header.
3. Add the new field to `useDashboardData`'s state and to the
   `Promise.all` block.
4. Build the presentational component under
   `src/components/sections/dashboard/<YourPanel>.tsx` consuming the
   projected payload via props.
5. Compose it into `DashboardSection.tsx`.
