-- Knockout prediction audit log: same append-only pattern as prediction_audit,
-- fires on INSERT/UPDATE to knockout_predictions. Client has no write access
-- (RLS); only the SECURITY DEFINER trigger function writes here.

CREATE TABLE IF NOT EXISTS knockout_prediction_audit (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id            uuid        NOT NULL REFERENCES players(id),
  match_id             integer     NOT NULL REFERENCES knockout_matches(id),
  action               text        NOT NULL CHECK (action IN ('insert', 'update')),
  old_score_home       integer,
  old_score_away       integer,
  old_predicted_winner text,
  new_score_home       integer,
  new_score_away       integer,
  new_predicted_winner text,
  changed_at           timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knockout_prediction_audit_player
  ON knockout_prediction_audit (player_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_knockout_prediction_audit_changed_at
  ON knockout_prediction_audit (changed_at DESC);

ALTER TABLE knockout_prediction_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read knockout audit"
  ON knockout_prediction_audit FOR SELECT
  USING (true);

CREATE POLICY "no client writes to knockout audit"
  ON knockout_prediction_audit FOR INSERT
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION log_knockout_prediction_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO knockout_prediction_audit (
      player_id, match_id, action,
      new_score_home, new_score_away, new_predicted_winner
    ) VALUES (
      NEW.player_id, NEW.match_id, 'insert',
      NEW.predicted_score_home, NEW.predicted_score_away, NEW.predicted_winner
    );

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.predicted_score_home IS DISTINCT FROM NEW.predicted_score_home
    OR OLD.predicted_score_away IS DISTINCT FROM NEW.predicted_score_away
    OR OLD.predicted_winner IS DISTINCT FROM NEW.predicted_winner THEN
      INSERT INTO knockout_prediction_audit (
        player_id, match_id, action,
        old_score_home, old_score_away, old_predicted_winner,
        new_score_home, new_score_away, new_predicted_winner
      ) VALUES (
        NEW.player_id, NEW.match_id, 'update',
        OLD.predicted_score_home, OLD.predicted_score_away, OLD.predicted_winner,
        NEW.predicted_score_home, NEW.predicted_score_away, NEW.predicted_winner
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS knockout_predictions_audit_trigger ON knockout_predictions;

CREATE TRIGGER knockout_predictions_audit_trigger
  AFTER INSERT OR UPDATE ON knockout_predictions
  FOR EACH ROW
  EXECUTE FUNCTION log_knockout_prediction_change();
