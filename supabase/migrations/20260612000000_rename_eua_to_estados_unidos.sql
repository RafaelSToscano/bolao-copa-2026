-- Rename "EUA" → "Estados Unidos" in games to match the canonical PT name
-- used everywhere else in the app (mock data, EN→PT translation in
-- src/lib/server/teamNames.ts, exact-string join in
-- src/hooks/useLiveScores.ts → findLiveScoreForGame). Without this, the
-- football-data row for "United States" is translated to "Estados Unidos"
-- and never matches the DB row, so the live card never renders.

UPDATE games SET team_a = 'Estados Unidos' WHERE team_a = 'EUA';
UPDATE games SET team_b = 'Estados Unidos' WHERE team_b = 'EUA';
