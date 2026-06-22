-- Knockout fixture catalog: 32 fixed bracket slots (R32 -> Final).
-- Pre-seeded here so the frontend can render "Vencedor do Jogo N" before
-- teams are known; admin fills in home_team/away_team/scores as the
-- tournament progresses.
--
-- Topology sourced from the official "Regulations for the FIFA World Cup
-- 26", article 12.6-12.11 (R32 = M73-M88, R16 = M89-M96, QF = M97-M100,
-- SF = M101-M102, third place = M103, final = M104). Our id = M-number - 72.
--
-- Slot notation:
--   '1A'/'2A'    = 1st/2nd place of Group A
--   '3(ABCDF)'   = best 3rd-place team among groups A, B, C, D, F (the
--                  literal group combo is fixed by the regulations; WHICH
--                  of those groups' 3rd-place team it resolves to depends
--                  on the actual qualified set of 8 best thirds and is
--                  looked up via Annexe C of the regulations — 495 possible
--                  combinations. That lookup is NOT implemented yet; see
--                  src/services/standings/knockoutQualification.ts, which
--                  currently assigns thirds by raw rank only and does not
--                  follow Annexe C either.)
--   'W{n}'       = winner of match n
--   'L{n}'       = loser of match n (used only for the third-place match)

CREATE TABLE IF NOT EXISTS knockout_matches (
  id                   integer PRIMARY KEY,
  round                text NOT NULL CHECK (round IN ('r32', 'r16', 'qf', 'sf', 'third_place', 'final')),
  match_number         integer NOT NULL,
  home_slot            text NOT NULL,
  away_slot            text NOT NULL,
  home_team            text,
  away_team            text,
  official_score_home  integer,
  official_score_away  integer,
  winner_team          text,
  match_date           timestamptz,
  locked               boolean NOT NULL DEFAULT false
);

-- This app has no Supabase Auth session (players authenticate via a custom
-- access_code, checked client-side) — RLS mirrors the existing open policy
-- used on games/predictions; admin-only actions are gated in the UI, not in
-- the database.
ALTER TABLE knockout_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open knockout_matches"
  ON knockout_matches FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO knockout_matches (id, round, match_number, home_slot, away_slot) VALUES
  -- Round of 32 (M73-M88, article 12.6)
  (1,  'r32', 1,  '2A', '2B'),
  (2,  'r32', 2,  '1E', '3(ABCDF)'),
  (3,  'r32', 3,  '1F', '2C'),
  (4,  'r32', 4,  '1C', '2F'),
  (5,  'r32', 5,  '1I', '3(CDFGH)'),
  (6,  'r32', 6,  '2E', '2I'),
  (7,  'r32', 7,  '1A', '3(CEFHI)'),
  (8,  'r32', 8,  '1L', '3(EHIJK)'),
  (9,  'r32', 9,  '1D', '3(BEFIJ)'),
  (10, 'r32', 10, '1G', '3(AEHIJ)'),
  (11, 'r32', 11, '2K', '2L'),
  (12, 'r32', 12, '1H', '2J'),
  (13, 'r32', 13, '1B', '3(EFGIJ)'),
  (14, 'r32', 14, '1J', '2H'),
  (15, 'r32', 15, '1K', '3(DEIJL)'),
  (16, 'r32', 16, '2D', '2G'),
  -- Round of 16 (M89-M96, article 12.7) — Wn refers to our r32 id n
  (17, 'r16', 1, 'W2',  'W5'),
  (18, 'r16', 2, 'W1',  'W3'),
  (19, 'r16', 3, 'W4',  'W6'),
  (20, 'r16', 4, 'W7',  'W8'),
  (21, 'r16', 5, 'W11', 'W12'),
  (22, 'r16', 6, 'W9',  'W10'),
  (23, 'r16', 7, 'W14', 'W16'),
  (24, 'r16', 8, 'W13', 'W15'),
  -- Quarter-finals (M97-M100, article 12.8) — Wn refers to our r16 id n
  (25, 'qf', 1, 'W17', 'W18'),
  (26, 'qf', 2, 'W21', 'W22'),
  (27, 'qf', 3, 'W19', 'W20'),
  (28, 'qf', 4, 'W23', 'W24'),
  -- Semi-finals (M101-M102, article 12.9) — Wn refers to our qf id n
  (29, 'sf', 1, 'W25', 'W26'),
  (30, 'sf', 2, 'W27', 'W28'),
  -- Third place (M103, article 12.10) — Ln refers to loser of our sf id n
  (31, 'third_place', 1, 'L29', 'L30'),
  -- Final (M104, article 12.11) — Wn refers to winner of our sf id n
  (32, 'final', 1, 'W29', 'W30')
ON CONFLICT (id) DO NOTHING;
