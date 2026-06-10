import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Player } from "@/types/player";
import { calculatePredictionPoints } from "@/services/predictions/predictionCalculations";

export interface Insight {
  emoji: string;
  text: string;
}

function getLastRoundGames(games: Game[]): Game[] {
  const scored = games.filter(
    (g) => g.official_score_a !== null && g.official_score_b !== null
  );
  if (!scored.length) return [];

  const dates = [
    ...new Set(scored.map((g) => g.match_date?.slice(0, 10)).filter(Boolean)),
  ].sort() as string[];

  const lastDate = dates[dates.length - 1];
  return scored.filter((g) => g.match_date?.startsWith(lastDate));
}

function predictionError(pred: Prediction, game: Game): number {
  if (
    pred.predicted_score_a === null ||
    pred.predicted_score_b === null ||
    game.official_score_a === null ||
    game.official_score_b === null
  )
    return 999;
  return (
    Math.abs(pred.predicted_score_a - game.official_score_a) +
    Math.abs(pred.predicted_score_b - game.official_score_b)
  );
}

export function generateRoundInsights(
  games: Game[],
  predictions: Prediction[],
  players: Player[]
): Insight[] {
  const roundGames = getLastRoundGames(games);
  if (!roundGames.length) return [];

  const playerMap = new Map(
    players.filter((p) => !p.is_admin).map((p) => [p.id, p.name])
  );
  const roundGameIds = new Set(roundGames.map((g) => g.id));
  const roundPreds = predictions.filter(
    (p) => roundGameIds.has(p.game_id) && playerMap.has(p.player_id)
  );

  const insights: Insight[] = [];

  // 1. Round top scorer
  const playerPts = new Map<string, number>();
  for (const pred of roundPreds) {
    const game = roundGames.find((g) => g.id === pred.game_id);
    if (!game) continue;
    const { points } = calculatePredictionPoints(pred, game);
    playerPts.set(pred.player_id, (playerPts.get(pred.player_id) ?? 0) + points);
  }
  let bestId = "";
  let bestPts = -1;
  for (const [pid, pts] of playerPts) {
    if (pts > bestPts) { bestPts = pts; bestId = pid; }
  }
  if (bestId && bestPts > 0) {
    const name = playerMap.get(bestId)!;
    insights.push({
      emoji: "⭐",
      text: `Destaque da rodada: ${name} com ${bestPts} pontos!`,
    });
  }

  // 2. Exact score(s)
  const exactPreds = roundPreds.filter((p) => {
    const game = roundGames.find((g) => g.id === p.game_id);
    return game && predictionError(p, game) === 0;
  });
  if (exactPreds.length === 1) {
    const p = exactPreds[0];
    const game = roundGames.find((g) => g.id === p.game_id)!;
    const name = playerMap.get(p.player_id);
    if (name)
      insights.push({
        emoji: "🎯",
        text: `${name} acertou o placar exato de ${game.team_a} ${game.official_score_a}×${game.official_score_b} ${game.team_b}!`,
      });
  } else if (exactPreds.length > 1) {
    const names = [
      ...new Set(
        exactPreds.map((p) => playerMap.get(p.player_id)).filter(Boolean)
      ),
    ] as string[];
    insights.push({
      emoji: "🎯",
      text: `${names.slice(0, 2).join(" e ")} acertaram placares exatos na rodada!`,
    });
  }

  // 3. Biggest miss
  let worstErr = 3;
  let worstPred: Prediction | null = null;
  let worstGame: Game | null = null;
  for (const pred of roundPreds) {
    const game = roundGames.find((g) => g.id === pred.game_id);
    if (!game) continue;
    const err = predictionError(pred, game);
    if (err < 999 && err > worstErr) {
      worstErr = err;
      worstPred = pred;
      worstGame = game;
    }
  }
  if (worstPred && worstGame) {
    const name = playerMap.get(worstPred.player_id);
    if (name)
      insights.push({
        emoji: "😬",
        text: `${name} chutou ${worstGame.team_a} ${worstPred.predicted_score_a}×${worstPred.predicted_score_b} ${worstGame.team_b}, mas foi ${worstGame.official_score_a}×${worstGame.official_score_b}. Que derrapada!`,
      });
  }

  // 4. Most optimistic single prediction
  let maxGoals = 5;
  let optimistPred: Prediction | null = null;
  let optimistGame: Game | null = null;
  for (const pred of roundPreds) {
    if (pred.predicted_score_a === null || pred.predicted_score_b === null) continue;
    const total = pred.predicted_score_a + pred.predicted_score_b;
    const game = roundGames.find((g) => g.id === pred.game_id);
    if (!game) continue;
    const actual = (game.official_score_a ?? 0) + (game.official_score_b ?? 0);
    if (total > maxGoals && total > actual + 2) {
      maxGoals = total;
      optimistPred = pred;
      optimistGame = game;
    }
  }
  if (optimistPred && optimistGame) {
    const name = playerMap.get(optimistPred.player_id);
    const actual =
      (optimistGame.official_score_a ?? 0) + (optimistGame.official_score_b ?? 0);
    if (name)
      insights.push({
        emoji: "🚀",
        text: `${name} apostou em ${maxGoals} gols no jogo de ${optimistGame.team_a} vs ${optimistGame.team_b}. Foram só ${actual}. Otimismo no limite! 😂`,
      });
  }

  return insights.slice(0, 3);
}
