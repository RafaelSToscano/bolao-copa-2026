import { KnockoutPrediction } from "@/types/knockout";
import { MOCK_PLAYERS } from "./mockPlayers";
import { MOCK_KNOCKOUT_MATCHES } from "./mockKnockoutMatches";

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

function buildAll(): KnockoutPrediction[] {
  const round32 = MOCK_KNOCKOUT_MATCHES.filter((m) => m.round === "r32");
  const predictions: KnockoutPrediction[] = [];

  MOCK_PLAYERS.forEach((player, playerIndex) => {
    round32.forEach((match, matchIndex) => {
      const seed = (playerIndex + 1) * 31 + matchIndex * 17;
      const scoreHome = seededScore(seed);
      const scoreAway = seededScore(seed + 1);

      predictions.push({
        id: `mock-knockout-pred-${player.id}-${match.id}`,
        player_id: player.id,
        match_id: match.id,
        predicted_score_home: scoreHome,
        predicted_score_away: scoreAway,
        predicted_winner: scoreHome === scoreAway ? "home" : null,
      });
    });
  });

  return predictions;
}

export const MOCK_KNOCKOUT_PREDICTIONS: KnockoutPrediction[] = buildAll();
