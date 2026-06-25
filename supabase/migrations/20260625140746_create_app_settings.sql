-- Single-row table for global app toggles. First use case: a master
-- on/off switch admin can flip to block ALL predictions (group, knockout,
-- final) regardless of any other criteria (group deadline, per-match
-- locked flag, etc). When predictions_enabled = false, every prediction
-- input in the app is disabled client-side, same as the existing
-- groups-deadline/locked checks (no Supabase Auth session, so admin-only
-- actions are gated in the UI, not the database — see knockout_matches).

CREATE TABLE IF NOT EXISTS app_settings (
  id                   integer PRIMARY KEY DEFAULT 1,
  predictions_enabled  boolean NOT NULL DEFAULT true,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_single_row CHECK (id = 1)
);

INSERT INTO app_settings (id, predictions_enabled) VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open app_settings"
  ON app_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- As of this Supabase project's 2026-05-30 cutover, new tables don't
-- implicitly get Data API grants — see grant_knockout_table_access.sql.
GRANT SELECT, UPDATE ON app_settings TO anon, authenticated;
