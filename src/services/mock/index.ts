export const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

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
