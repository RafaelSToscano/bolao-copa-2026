export const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

/**
 * When set, the mock fixture stops anchoring two games at MOCK_NOW
 * and `getMockLiveScoresNormalized()` returns an empty list. Useful
 * for exercising the "no live match" UI branch (e.g. last-round
 * arrows on the dashboard ranking, idle Jogo do Momento banner).
 */
export const MOCK_DISABLE_LIVE =
  process.env.NEXT_PUBLIC_MOCK_DISABLE_LIVE === "true";

export { MOCK_NOW } from "./mockNow";
export { MOCK_PLAYERS } from "./mockPlayers";
export { MOCK_GAMES } from "./mockGames";
export { MOCK_PREDICTIONS } from "./mockPredictions";
export {
  getMockLiveScores,
  getMockLiveScoresNormalized,
  bumpMockGoal,
  resetMockGoals,
} from "./mockLiveScores";
