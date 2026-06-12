import { Game } from "@/types/game";
import { MOCK_NOW } from "./mockNow";

const GROUPS: Record<string, [string, string, string, string]> = {
  A: ["México", "Coreia do Sul", "África do Sul", "República Tcheca"],
  B: ["Canadá", "Bósnia", "Catar", "Suíça"],
  C: ["Brasil", "Marrocos", "Haiti", "Escócia"],
  D: ["Estados Unidos", "Paraguai", "Austrália", "Turquia"],
  E: ["Alemanha", "Curaçao", "Costa do Marfim", "Equador"],
  F: ["Holanda", "Japão", "Suécia", "Tunísia"],
  G: ["Bélgica", "Egito", "Irã", "Nova Zelândia"],
  H: ["Espanha", "Cabo Verde", "Arábia Saudita", "Uruguai"],
  I: ["França", "Senegal", "Iraque", "Noruega"],
  J: ["Argentina", "Argélia", "Áustria", "Jordânia"],
  K: ["Portugal", "RD Congo", "Uzbequistão", "Colômbia"],
  L: ["Inglaterra", "Croácia", "Gana", "Panamá"],
};

const ROUND_ROBIN_PAIRS: ReadonlyArray<[number, number]> = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

function seededScore(seed: number): number {
  const x = Math.sin(seed) * 10000;
  const fraction = x - Math.floor(x);
  if (fraction < 0.3) return 0;
  if (fraction < 0.55) return 1;
  if (fraction < 0.75) return 2;
  if (fraction < 0.88) return 3;
  if (fraction < 0.95) return 4;
  return 5;
}

function buildGame(
  groupName: string,
  matchOrder: number,
  teamA: string,
  teamB: string,
  matchDate: string,
  kickoffMs: number,
  groupIndex: number
): Game {
  const elapsedMin = (MOCK_NOW - kickoffMs) / 60000;
  const finished = elapsedMin > 180;
  const live = elapsedMin >= 0 && elapsedMin <= 180;
  const seed = groupIndex * 13 + matchOrder * 7;

  let officialScoreA: number | null = null;
  let officialScoreB: number | null = null;

  if (finished) {
    officialScoreA = seededScore(seed);
    officialScoreB = seededScore(seed + 1);
  }

  return {
    id: `mock-${groupName.toLowerCase()}-${matchOrder}`,
    phase: "groups",
    group_name: groupName,
    match_order: matchOrder,
    match_date: matchDate,
    team_a: teamA,
    team_b: teamB,
    official_score_a: officialScoreA,
    official_score_b: officialScoreB,
    locked: finished || live,
  };
}

function buildAll(): Game[] {
  const games: Game[] = [];
  const groupEntries = Object.entries(GROUPS);

  // Anchor: most matches finished, ~2 live near MOCK_NOW, the rest upcoming.
  // Spread 12 groups × 6 matches across a window that puts a small handful
  // of matches in the live window and roughly 1/3 in the past.
  // Total games = 72. Distribute across ~14 days (336h) starting 9 days ago.
  const start = MOCK_NOW - 9 * 24 * HOUR;
  const totalGames = groupEntries.length * ROUND_ROBIN_PAIRS.length;
  const stepHours = (14 * 24) / totalGames; // ~4.7h between kickoffs

  // Live window is [kickoff, kickoff + 180min]. To keep ONLY the two
  // deliberately-pinned matches in that window, shove any naturally
  // distributed kickoff falling between (MOCK_NOW - 180min) and
  // MOCK_NOW forward by a day so it lands as upcoming instead of live.
  const LIVE_WINDOW_MS = 180 * MINUTE;
  const PUSH_OUT_MS = 24 * HOUR;

  let globalIndex = 0;

  groupEntries.forEach(([group, teams], groupIndex) => {
    ROUND_ROBIN_PAIRS.forEach((pair, pairIndex) => {
      const matchOrder = pairIndex + 1;
      const teamA = teams[pair[0]];
      const teamB = teams[pair[1]];

      // Stagger kickoffs by global index, but inject two live matches
      // by pinning specific (groupIndex, pairIndex) slots near MOCK_NOW.
      let kickoffMs: number;
      if (groupIndex === 2 && pairIndex === 0) {
        kickoffMs = MOCK_NOW - 25 * MINUTE; // live, ~25 min in
      } else if (groupIndex === 7 && pairIndex === 1) {
        kickoffMs = MOCK_NOW - 60 * MINUTE; // live, ~60 min in
      } else {
        let candidate = start + globalIndex * stepHours * HOUR;
        if (
          candidate >= MOCK_NOW - LIVE_WINDOW_MS &&
          candidate <= MOCK_NOW
        ) {
          candidate += PUSH_OUT_MS;
        }
        kickoffMs = candidate;
      }

      const matchDate = new Date(kickoffMs).toISOString();
      games.push(
        buildGame(group, matchOrder, teamA, teamB, matchDate, kickoffMs, groupIndex)
      );
      globalIndex += 1;
    });
  });

  return games;
}

export const MOCK_GAMES: Game[] = buildAll();
