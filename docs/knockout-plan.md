# Knockout Persistence Plan

## Status: implemented

See `docs/knockout-rules.md` for the official bracket rules and how they
map to the schema/code below — this plan's R32 slot assumptions and the
"open decisions" section have since been resolved during implementation.

---

## Overview

Add full database persistence for knockout stage predictions, including official match
identifiers, bracket progression tracking, and an audit trail. The implementation
follows the same patterns already used for group-stage predictions.

---

## Core design: two tables

The group stage uses one table (`predictions`) keyed on `game_id` because games are
fixed entities in the DB. The knockout stage needs **two** tables:

- **`knockout_matches`** — official fixture catalog. 32 match slots (R32 → Final),
  pre-seeded at migration time. Admin fills in teams and official results here.
  Source of truth for the bracket.
- **`knockout_predictions`** — player predictions keyed on `(player_id, match_id)`.
  Same upsert pattern as `predictions`.

---

## 1 · Match identifiers

Bracket slots are fixed regardless of which teams end up in them.
Integer IDs are scoped by round:

| Round        | Matches | IDs   |
|--------------|---------|-------|
| Round of 32  | 16      | 1–16  |
| Round of 16  | 8       | 17–24 |
| Quarter-finals | 4     | 25–28 |
| Semi-finals  | 2       | 29–30 |
| Third place  | 1       | 31    |
| Final        | 1       | 32    |

Each match also carries two `_slot` columns that encode where each team comes from:

| Notation | Meaning |
|----------|---------|
| `1A`     | 1st place of Group A |
| `2F`     | 2nd place of Group F |
| `T1`–`T8` | 1st–8th best third-place |
| `W1`–`W16` | Winner of match 1–16 (R16 and beyond) |

This lets the frontend display `"Vencedor do Jogo 3"` before teams are known,
and allows the backend to auto-populate R32 teams from group-stage results via
the existing `generateRound32()` logic.

---

## 2 · Database schema

### `knockout_matches`

```sql
id                   integer PRIMARY KEY  -- 1–32, stable forever
round                text NOT NULL        -- 'r32','r16','qf','sf','third_place','final'
match_number         integer NOT NULL     -- position within the round
home_slot            text NOT NULL        -- '1A', 'T3', 'W5'
away_slot            text NOT NULL
home_team            text                 -- set once known
away_team            text
official_score_home  integer
official_score_away  integer
winner_team          text                 -- set by admin after match
match_date           timestamptz
locked               boolean DEFAULT false
```

RLS: public `SELECT`, admin-only `UPDATE` (same pattern as `games`).

### `knockout_predictions`

```sql
id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY
player_id             uuid NOT NULL REFERENCES players(id)
match_id              integer NOT NULL REFERENCES knockout_matches(id)
predicted_score_home  integer
predicted_score_away  integer
predicted_winner      text CHECK (predicted_winner IN ('home', 'away'))
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
UNIQUE (player_id, match_id)
```

RLS: players can read/write their own rows; writes blocked when
`knockout_matches.locked = true` (enforced via policy join).

### `knockout_prediction_audit`

Same structure and trigger pattern as the existing `prediction_audit`.
Fires on `INSERT`/`UPDATE` to `knockout_predictions`. Append-only via
`SECURITY DEFINER`, no client writes.

---

## 3 · Migrations

### Backup first

```bash
supabase link --project-ref <your-project-ref>  # once

supabase db dump -f backups/pre-knockout-$(date +%Y%m%d).sql
supabase db dump --data-only -f backups/pre-knockout-$(date +%Y%m%d)-data.sql
```

Add `backups/` to `.gitignore`.

### Create migration files

```bash
supabase migration new create_knockout_matches
supabase migration new create_knockout_predictions
supabase migration new create_knockout_prediction_audit
```

Fill in the SQL for each file, then apply:

```bash
# local dev
supabase db reset

# remote / production
supabase db push

# check status
supabase migration list
```

### Migration 1 — `create_knockout_matches`

- Create `knockout_matches` table
- Pre-seed all 32 rows with `id`, `round`, `match_number`, `home_slot`, `away_slot`
  (R32 slots from `knockoutQualification.ts`; R16–Final use `W{n}` references)
- RLS + admin update policy

### Migration 2 — `create_knockout_predictions`

- Create `knockout_predictions` table
- RLS policies (own-row read/write, locked check)
- `updated_at` trigger

### Migration 3 — `create_knockout_prediction_audit`

- Create `knockout_prediction_audit` table
- `log_knockout_prediction_change()` trigger function
  (mirrors existing `log_prediction_change()`)
- Attach trigger on `knockout_predictions`

---

## 4 · Service layer

New file: **`src/services/supabase/knockoutPredictionsService.ts`**

| Function | Description |
|----------|-------------|
| `getKnockoutMatches()` | Fetch all 32 rows (public) |
| `getKnockoutPredictionsForPlayer(playerId)` | Player's predictions |
| `getAllKnockoutPredictions()` | Admin view, all players (paginated) |
| `upsertKnockoutPrediction(prediction)` | `onConflict: 'player_id,match_id'` |
| `updateKnockoutMatchResult(matchId, scoreHome, scoreAway, winnerTeam)` | Admin only |

Also add to `src/services/mock/`:
- **`mockKnockoutMatches.ts`** — 32 pre-seeded match slots
- **`mockKnockoutPredictions.ts`** — seeded player predictions for dev/mock mode

---

## 5 · Hook

New file: **`src/hooks/useKnockoutPredictions.ts`**

```ts
useKnockoutPredictions(currentUserId) → {
  matches,            // KnockoutMatch[] enriched with official teams
  predictions,        // KnockoutPrediction[] for this player
  drafts,             // Record<matchId, DraftKnockoutPrediction>
  savePrediction(matchId, draft),
  isLocked(matchId),
}
```

Mirrors `usePredictions`. Draft state lives in the hook; `savePrediction` calls
the service and updates local state optimistically.

---

## 6 · Wiring: dev page → production

1. Replace the local `useState` in `dev-mata-mata/page.tsx` with
   `useKnockoutPredictions` — first integration test with real persistence.
2. Once verified, wire the same hook into the real `/mata-mata` route.
3. R32 `home_team`/`away_team` can be auto-populated by running
   `generateRound32()` against final group results and calling
   `updateKnockoutMatchResult()` for each slot — so admin doesn't have to
   fill in R32 teams manually.

---

## 7 · Open decisions

| Question | Options |
|----------|---------|
| When do R16–Final slots unlock for predictions? | After previous round fully played and locked, OR a fixed calendar date |
| Scoring for knockout predictions | Same 15/7/2 scale as groups? Bonus for picking correct winner without exact score? |
| Who enters official knockout results? | Extend existing admin section, or a dedicated knockout admin panel? |
| Predict all 32 matches upfront or round by round? | Round-by-round is fairer; upfront is simpler to build |

These don't block the migration or service layer, but should be decided
before building the UI visible to all players.
