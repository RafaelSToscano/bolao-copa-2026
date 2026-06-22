-- As of this Supabase project's cutover on 2026-05-30, newly created
-- tables no longer implicitly get SELECT/INSERT/UPDATE/DELETE granted to
-- the Data API roles (anon, authenticated) — RLS policies alone don't
-- help if the role has no grant on the table at all (Postgres blocks at
-- the permission layer before RLS is even evaluated, surfacing as
-- "permission denied for table X" instead of an RLS-style empty result).
--
-- knockout_matches/knockout_predictions/knockout_prediction_audit were
-- all created after that cutover and were missing these grants, same as
-- prediction_audit (added 2026-06-10, also post-cutover, also missing
-- them — fixed here too).

GRANT SELECT, INSERT, UPDATE, DELETE ON knockout_matches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON knockout_predictions TO anon, authenticated;
GRANT SELECT ON knockout_prediction_audit TO anon, authenticated;
GRANT SELECT ON prediction_audit TO anon, authenticated;
