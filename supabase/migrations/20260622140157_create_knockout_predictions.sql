-- Player predictions for knockout matches, keyed on (player_id, match_id).
-- Same upsert pattern as predictions (player_id, game_id).

CREATE TABLE IF NOT EXISTS knockout_predictions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id             uuid NOT NULL REFERENCES players(id),
  match_id              integer NOT NULL REFERENCES knockout_matches(id),
  predicted_score_home  integer,
  predicted_score_away  integer,
  predicted_winner      text CHECK (predicted_winner IN ('home', 'away')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, match_id)
);

-- Same open RLS as predictions/games: this app has no Supabase Auth session,
-- so "own row" / "locked" checks aren't enforceable in the database. Locking
-- is gated client-side (see game.locked usage in PredictionsSection.tsx).
ALTER TABLE knockout_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open knockout_predictions"
  ON knockout_predictions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION set_knockout_predictions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS knockout_predictions_set_updated_at ON knockout_predictions;

CREATE TRIGGER knockout_predictions_set_updated_at
  BEFORE UPDATE ON knockout_predictions
  FOR EACH ROW
  EXECUTE FUNCTION set_knockout_predictions_updated_at();
