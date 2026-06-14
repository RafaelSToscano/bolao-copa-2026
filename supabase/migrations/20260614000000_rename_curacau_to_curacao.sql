-- Rename "Curaçau" → "Curaçao" in games to match the canonical PT name
-- used everywhere else in the app (mock data, flag config, EN→PT
-- translation in src/lib/server/teamNames.ts, exact-string join in
-- src/hooks/useLiveScores.ts → findLiveScoreForGame). Without this, the
-- football-data row for "Curacao" is translated to "Curaçao" and never
-- matches the DB row, so the live card never renders for Group E
-- matches involving Curaçao.

UPDATE games SET team_a = 'Curaçao' WHERE team_a = 'Curaçau';
UPDATE games SET team_b = 'Curaçao' WHERE team_b = 'Curaçau';
