-- Prediction audit log: append-only table + trigger to trace every prediction change.
-- Trigger fires on INSERT/UPDATE to predictions; client has no write access (RLS).

-- 1. Audit table
CREATE TABLE IF NOT EXISTS prediction_audit (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id    uuid        NOT NULL REFERENCES players(id),
  game_id      uuid        NOT NULL REFERENCES games(id),
  action       text        NOT NULL CHECK (action IN ('insert', 'update')),
  old_score_a  integer,
  old_score_b  integer,
  new_score_a  integer,
  new_score_b  integer,
  changed_at   timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prediction_audit_player
  ON prediction_audit (player_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_prediction_audit_changed_at
  ON prediction_audit (changed_at DESC);

-- 2. RLS: public reads, no client writes (trigger writes via SECURITY DEFINER)
ALTER TABLE prediction_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read audit"
  ON prediction_audit FOR SELECT
  USING (true);

CREATE POLICY "no client writes"
  ON prediction_audit FOR INSERT
  WITH CHECK (false);

-- 3. Trigger function
CREATE OR REPLACE FUNCTION log_prediction_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO prediction_audit (player_id, game_id, action, new_score_a, new_score_b)
    VALUES (NEW.player_id, NEW.game_id, 'insert', NEW.predicted_score_a, NEW.predicted_score_b);

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.predicted_score_a IS DISTINCT FROM NEW.predicted_score_a
    OR OLD.predicted_score_b IS DISTINCT FROM NEW.predicted_score_b THEN
      INSERT INTO prediction_audit (
        player_id, game_id, action,
        old_score_a, old_score_b,
        new_score_a, new_score_b
      ) VALUES (
        NEW.player_id, NEW.game_id, 'update',
        OLD.predicted_score_a, OLD.predicted_score_b,
        NEW.predicted_score_a, NEW.predicted_score_b
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS predictions_audit_trigger ON predictions;

CREATE TRIGGER predictions_audit_trigger
  AFTER INSERT OR UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION log_prediction_change();
