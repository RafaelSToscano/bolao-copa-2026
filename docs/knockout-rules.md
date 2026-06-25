# Knockout Stage Rules (FIFA World Cup 26)

Canonical reference for how the knockout bracket actually works, per the
official **"Regulations for the FIFA World Cup 26™"** (May 2026 edition),
articles 12.6–12.11, and how those rules are encoded in this codebase.
Two previous implementations (the live `generateRound32()` simulation and
the `playoff-logic.md` doc) got the bracket pairing wrong — this file is
the source of truth going forward.

## 1 · Qualification

- 48 teams, 12 groups (A–L) of 4.
- Top 2 of every group qualify automatically (24 teams).
- The remaining 8 slots go to the **best 8 of the 12 third-place teams**,
  ranked by points → goal difference → goals scored → fair-play score →
  FIFA ranking (article 13).

## 2 · Round of 32 — fixed pairing (article 12.6, matches M73–M88)

The pairing is **not** sequential (`1A v 2A`, etc.) and not simply "winner
vs. best remaining third." It's a fixed wallchart designed so group-mates
never meet in R32:

| # | Home | Away | # | Home | Away |
|---|------|------|---|------|------|
| 1 (M73) | 2A | 2B | 9 (M81) | 1D | Best 3rd of B,E,F,I,J |
| 2 (M74) | 1E | Best 3rd of A,B,C,D,F | 10 (M82) | 1G | Best 3rd of A,E,H,I,J |
| 3 (M75) | 1F | 2C | 11 (M83) | 2K | 2L |
| 4 (M76) | 1C | 2F | 12 (M84) | 1H | 2J |
| 5 (M77) | 1I | Best 3rd of C,D,F,G,H | 13 (M85) | 1B | Best 3rd of E,F,G,I,J |
| 6 (M78) | 2E | 2I | 14 (M86) | 1J | 2H |
| 7 (M79) | 1A | Best 3rd of C,E,F,H,I | 15 (M87) | 1K | Best 3rd of D,E,I,J,L |
| 8 (M80) | 1L | Best 3rd of E,H,I,J,K | 16 (M88) | 2D | 2G |

### "Best 3rd of [groups]" — Annexe C

The "best 3rd" opponent for 8 of the 16 matches isn't a fixed rank
(there is **no** "1st best third always plays match X" rule). Which
*specific* group's third-place team fills that slot depends on **which 8
of the 12 groups** actually produced a qualifying third — and that
mapping is FIFA's **Annexe C**: a table of all C(12,8) = 495 possible
"which 8 groups qualify" combinations, each one specifying which group's
third plays which of the 8 matches above.

Implementation: `src/services/standings/thirdPlaceCombinations.ts`
- `THIRD_PLACE_COMBINATIONS`: all 495 rows, transcribed from Annexe C and
  validated (full coverage of all 495 combos, no duplicates, no malformed
  rows — see `thirdPlaceCombinations.test.ts`).
- `resolveThirdPlaceOpponents(qualifiedGroups)`: given the 8 actual
  qualifying group letters, returns which group's third plays each of
  `1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L`.

## 3 · Round of 16 → Final (articles 12.7–12.11)

Also fixed, also non-sequential. Using our own R32 ids 1–16 (in the order
of the table above) as `W{n}` references:

- **R16**: `W2 vW5`, `W1 vW3`, `W4 vW6`, `W7 vW8`, `W11 vW12`, `W9 vW10`, `W14 vW16`, `W13 vW15`
- **QF**: `W17 vW18`, `W21 vW22`, `W19 vW20`, `W23 vW24` (using R16 ids 17–24)
- **SF**: `W25 vW26`, `W27 vW28` (using QF ids 25–28)
- **3rd place**: `L29 vL30` (losers of the semis)
- **Final**: `W29 vW30` (winners of the semis)

## 4 · Two implementations in this codebase

### A. Live simulation ("Meu Mata-mata" / `PlayoffSection`)

Computes the R32 bracket on the fly from the user's own group-stage
predictions — no persistence, recalculates on every render.

- `generateRound32(games)` — `src/services/standings/knockoutQualification.ts`
- `useKnockout()` — `src/hooks/useKnockout.ts`
- `PlayoffSection` / `KnockoutSection` — display components

This only generates R32 (no R16+ — there's no "next phase" simulation
here, since the rest of the bracket depends on actual R32 results).

### B. Persisted bracket (real predictions + admin results)

Backed by two tables, mirroring the `games`/`predictions` pattern:

- **`knockout_matches`** — all 32 fixture slots (R32 → Final), pre-seeded
  by migration `20260622133940_create_knockout_matches.sql` with the
  exact pairing from section 2–3 above. Columns: `home_slot`/`away_slot`
  (notation below), `home_team`/`away_team` (filled in as rounds
  resolve), `official_score_home/away`, `winner_team`, `locked`.
- **`knockout_predictions`** — player predictions keyed on
  `(player_id, match_id)`, audited via `knockout_prediction_audit`
  (same append-only trigger pattern as `prediction_audit`).

Slot notation stored in `home_slot`/`away_slot`:

| Notation | Meaning |
|---|---|
| `1A` / `2A` | 1st / 2nd place of Group A |
| `3(ABCDF)` | Best 3rd place among groups A, B, C, D, F (resolved via Annexe C — see §2) |
| `W{n}` | Winner of match `n` |
| `L{n}` | Loser of match `n` (only used by the 3rd-place match) |

Service layer — `src/services/supabase/knockoutPredictionsService.ts`:
- `getKnockoutMatches()` / `getKnockoutPredictionsForPlayer()` /
  `upsertKnockoutPrediction()` — player-facing reads/writes.
- `populateRound32FromGroups(games)` — admin action: once the group
  stage ends, resolves all 16 R32 matches (via `generateRound32()` +
  Annexe C) and writes `home_team`/`away_team` into `knockout_matches`.
- `updateKnockoutMatchResult(matchId, scoreHome, scoreAway, winnerTeam)`
  — admin action: records a result, then **cascades**: looks up any
  match whose `home_slot`/`away_slot` is `W{matchId}` or `L{matchId}`
  and writes the winner/loser team name into it. This is what advances
  a team from one round's `home_team`/`away_team` into the next.

Pages:
- `/palpites` — R32 predictions live here now, via `KnockoutPredictionsCard`
  (`src/components/sections/predictions/KnockoutPredictionsCard.tsx`,
  using `useKnockoutPredictions`), rendered inside `PredictionsSection`
  alongside the group-stage games. R32 slots without an official team
  yet show a live-simulated projection (`generateRound32()` on current
  group results) so players have something to predict against before
  admin locks in the real teams.
- `/mata-mata` — read-only official results for all 32 matches
  (`useKnockoutResults` hook). No inputs, no simulation — just whatever
  `home_team`/`away_team`/scores are actually in `knockout_matches`.
- `/admin/mata-mata` — admin results entry + manual team override UI
  (`useKnockoutAdmin` hook). Admin-only, linked from the nav under
  "Mata-mata". `populateRound32FromGroups()` skips groups that haven't
  finished all their matches, and never overwrites a team the admin set
  by hand via `updateKnockoutMatchTeams()`.

On `/palpites`, score inputs are disabled until `home_team`/`away_team`
are both official (in addition to the `locked` flag) — there's nothing
to predict for a match whose teams haven't been decided yet.

## 5 · RLS note

This app has no Supabase Auth session (players authenticate via a custom
`access_code`, checked client-side), so RLS on `knockout_matches` /
`knockout_predictions` is fully open (`USING (true)`), matching the
existing `games`/`predictions` pattern — admin-only actions are gated in
the UI, not the database. New tables also need an explicit `GRANT` to
`anon`/`authenticated` (see migration `20260622151722_grant_knockout_table_access.sql`)
— as of this Supabase project's 2026-05-30 cutover, new tables no longer
get that grant implicitly, and RLS doesn't help if the grant is missing
(Postgres blocks at the permission layer first).

## 6 · Known gaps

- Live simulation (`generateRound32()`) only covers R32 — there's no
  simulated R16+ for "Meu Mata-mata" (by design: real R16+ depends on
  actual R32 results, not predictions).
- No UI yet lets a *player* see/predict R16+ on the persisted bracket —
  only R32 is wired into `/palpites` today (`/mata-mata` shows R16+
  official results once they exist, but there's no prediction input for
  them anywhere).
