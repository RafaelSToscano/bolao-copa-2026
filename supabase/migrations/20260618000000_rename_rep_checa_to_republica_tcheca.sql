-- Rename "Rep. Checa" → "República Tcheca" in games to match the canonical
-- PT name used everywhere else in the app (mock data, EN→PT translation in
-- src/lib/server/teamNames.ts, exact-string join in
-- src/hooks/useLiveScores.ts → findLiveScoreForGame). Without this, the
-- football-data row for "Czech Republic" / "Czechia" is translated to
-- "República Tcheca" and never matches the DB row, so the live card never
-- renders for Group A matches involving República Tcheca.

UPDATE games SET team_a = 'República Tcheca' WHERE team_a = 'Rep. Checa';
UPDATE games SET team_b = 'República Tcheca' WHERE team_b = 'Rep. Checa';
