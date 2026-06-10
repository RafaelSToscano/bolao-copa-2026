import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";

// ── Players ──────────────────────────────────────────────────────────────────

export const MOCK_PLAYERS: Player[] = [
  { id: "p1",  name: "Rafael Krás Borges",  access_code: "11", is_admin: false, approved: true },
  { id: "p2",  name: "Lucas Gentile",       access_code: "22", is_admin: false, approved: true },
  { id: "p3",  name: "Pietro Krás",         access_code: "33", is_admin: false, approved: true },
  { id: "p4",  name: "Gustavo Baladão",     access_code: "44", is_admin: false, approved: true },
  { id: "p5",  name: "Thiago Cunha",        access_code: "55", is_admin: false, approved: true },
  { id: "p6",  name: "Edu Suñe",            access_code: "66", is_admin: false, approved: true },
  { id: "p7",  name: "Fabio Martins",       access_code: "77", is_admin: false, approved: true },
  { id: "p8",  name: "Filipe 306/01",       access_code: "88", is_admin: false, approved: true },
  { id: "p9",  name: "Marcão Toscano",      access_code: "99", is_admin: false, approved: true },
  { id: "p10", name: "Ricardo Barbosa",     access_code: "10", is_admin: false, approved: true },
  { id: "p11", name: "Carol Mendes",        access_code: "11a", is_admin: false, approved: true },
  { id: "p12", name: "André Fujita",        access_code: "12a", is_admin: false, approved: true },
  { id: "p13", name: "Renata Oliveira",     access_code: "13a", is_admin: false, approved: true },
  { id: "p14", name: "Bruno Salles",        access_code: "14a", is_admin: false, approved: true },
  { id: "p15", name: "Júlia Fonseca",       access_code: "15a", is_admin: false, approved: true },
  { id: "p16", name: "Cesar Gimenez",       access_code: "16a", is_admin: false, approved: true },
];

export const MOCK_RANKING: (Player & { total: number; exacts: number })[] = [
  { ...MOCK_PLAYERS[0],  total: 158, exacts: 8 },
  { ...MOCK_PLAYERS[1],  total: 143, exacts: 7 },
  { ...MOCK_PLAYERS[2],  total: 138, exacts: 6 },
  { ...MOCK_PLAYERS[3],  total: 125, exacts: 5 },
  { ...MOCK_PLAYERS[4],  total: 118, exacts: 4 },
  { ...MOCK_PLAYERS[5],  total: 112, exacts: 4 },
  { ...MOCK_PLAYERS[6],  total: 105, exacts: 3 },
  { ...MOCK_PLAYERS[7],  total:  98, exacts: 3 },
  { ...MOCK_PLAYERS[8],  total:  91, exacts: 2 },
  { ...MOCK_PLAYERS[9],  total:  85, exacts: 2 },
  { ...MOCK_PLAYERS[10], total:  74, exacts: 1 },
  { ...MOCK_PLAYERS[11], total:  68, exacts: 1 },
  { ...MOCK_PLAYERS[12], total:  55, exacts: 0 },
  { ...MOCK_PLAYERS[13], total:  43, exacts: 0 },
  { ...MOCK_PLAYERS[14], total:  31, exacts: 0 },
  { ...MOCK_PLAYERS[15], total:  18, exacts: 0 },
];

// ── Last-round games (yesterday, all with official scores) ────────────────────

const TODAY = new Date();
const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(TODAY.getDate() - 1);
const D = YESTERDAY.toISOString().slice(0, 10);

export const MOCK_GAMES: Game[] = [
  { id: "g1", phase: "groups", group_name: "A", match_order: 1, match_date: `${D}T15:00:00`, team_a: "Brasil",    team_b: "Argentina", official_score_a: 2, official_score_b: 1, locked: true },
  { id: "g2", phase: "groups", group_name: "A", match_order: 2, match_date: `${D}T18:00:00`, team_a: "Marrocos",  team_b: "Canadá",    official_score_a: 1, official_score_b: 0, locked: true },
  { id: "g3", phase: "groups", group_name: "B", match_order: 1, match_date: `${D}T21:00:00`, team_a: "Alemanha",  team_b: "França",    official_score_a: 1, official_score_b: 1, locked: true },
];

// ── Predictions crafted to trigger several insight types ─────────────────────
// g1 Brasil 2×1 Argentina:
//   - p2 (Lucas) acerta exato ✅ 🎯
//   - p3 (Pietro) chuta 5×0 😬
//   - everyone else gets result right (7 pts)
//
// g2 Marrocos 1×0 Canadá:
//   - everyone predicts Canadá win (wrong outcome) 🤯
//
// g3 Alemanha 1×1 França:
//   - all predict 0×0 (same wrong score) 🐑

export const MOCK_PREDICTIONS: Prediction[] = [
  // ── g1: Brasil vs Argentina (official 2×1) ─────────────────────────────────
  { player_id: "p1",  game_id: "g1", predicted_score_a: 2, predicted_score_b: 0 }, // correct outcome
  { player_id: "p2",  game_id: "g1", predicted_score_a: 2, predicted_score_b: 1 }, // EXACT ✅
  { player_id: "p3",  game_id: "g1", predicted_score_a: 5, predicted_score_b: 0 }, // big miss 😬
  { player_id: "p4",  game_id: "g1", predicted_score_a: 3, predicted_score_b: 1 }, // correct outcome
  { player_id: "p5",  game_id: "g1", predicted_score_a: 1, predicted_score_b: 0 }, // correct outcome
  { player_id: "p6",  game_id: "g1", predicted_score_a: 2, predicted_score_b: 0 }, // correct outcome
  { player_id: "p7",  game_id: "g1", predicted_score_a: 3, predicted_score_b: 2 }, // correct outcome
  { player_id: "p8",  game_id: "g1", predicted_score_a: 1, predicted_score_b: 0 }, // correct outcome
  { player_id: "p9",  game_id: "g1", predicted_score_a: 2, predicted_score_b: 1 }, // also exact
  { player_id: "p10", game_id: "g1", predicted_score_a: 3, predicted_score_b: 0 }, // correct outcome
  { player_id: "p11", game_id: "g1", predicted_score_a: 2, predicted_score_b: 0 }, // correct outcome
  { player_id: "p12", game_id: "g1", predicted_score_a: 1, predicted_score_b: 0 }, // correct outcome
  { player_id: "p13", game_id: "g1", predicted_score_a: 0, predicted_score_b: 1 }, // wrong outcome
  { player_id: "p14", game_id: "g1", predicted_score_a: 0, predicted_score_b: 2 }, // wrong outcome
  { player_id: "p15", game_id: "g1", predicted_score_a: 1, predicted_score_b: 1 }, // wrong outcome (draw)
  { player_id: "p16", game_id: "g1", predicted_score_a: 0, predicted_score_b: 0 }, // wrong outcome

  // ── g2: Marrocos vs Canadá (official 1×0) — everyone predicts Canadá win 🤯 ─
  { player_id: "p1",  game_id: "g2", predicted_score_a: 0, predicted_score_b: 2 },
  { player_id: "p2",  game_id: "g2", predicted_score_a: 1, predicted_score_b: 2 },
  { player_id: "p3",  game_id: "g2", predicted_score_a: 0, predicted_score_b: 1 },
  { player_id: "p4",  game_id: "g2", predicted_score_a: 0, predicted_score_b: 3 },
  { player_id: "p5",  game_id: "g2", predicted_score_a: 1, predicted_score_b: 3 },
  { player_id: "p6",  game_id: "g2", predicted_score_a: 0, predicted_score_b: 2 },
  { player_id: "p7",  game_id: "g2", predicted_score_a: 0, predicted_score_b: 1 },
  { player_id: "p8",  game_id: "g2", predicted_score_a: 1, predicted_score_b: 2 },
  { player_id: "p9",  game_id: "g2", predicted_score_a: 0, predicted_score_b: 2 },
  { player_id: "p10", game_id: "g2", predicted_score_a: 0, predicted_score_b: 1 },
  { player_id: "p11", game_id: "g2", predicted_score_a: 1, predicted_score_b: 2 },
  { player_id: "p12", game_id: "g2", predicted_score_a: 0, predicted_score_b: 1 },
  { player_id: "p13", game_id: "g2", predicted_score_a: 0, predicted_score_b: 2 },
  { player_id: "p14", game_id: "g2", predicted_score_a: 1, predicted_score_b: 3 },
  { player_id: "p15", game_id: "g2", predicted_score_a: 0, predicted_score_b: 1 },
  { player_id: "p16", game_id: "g2", predicted_score_a: 0, predicted_score_b: 2 },

  // ── g3: Alemanha vs França (official 1×1) — all predict 0×0 🐑 ─────────────
  ...MOCK_PLAYERS.map((p) => ({
    player_id: p.id,
    game_id: "g3",
    predicted_score_a: 0,
    predicted_score_b: 0,
  })),
];
