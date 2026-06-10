import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Player } from "@/types/player";
import { calculatePredictionPoints, getOutcome } from "@/services/predictions/predictionCalculations";

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

  const candidates: Insight[] = [];

  // ── Round top scorer ────────────────────────────────────────────────────────
  const playerPts = new Map<string, number>();
  for (const pred of roundPreds) {
    const game = roundGames.find((g) => g.id === pred.game_id);
    if (!game) continue;
    const { points } = calculatePredictionPoints(pred, game);
    playerPts.set(pred.player_id, (playerPts.get(pred.player_id) ?? 0) + points);
  }
  let bestId = "";
  let bestPts = 0;
  for (const [pid, pts] of playerPts) {
    if (pts > bestPts) { bestPts = pts; bestId = pid; }
  }
  if (bestId && bestPts > 0) {
    candidates.push({
      emoji: "⭐",
      text: `Destaque da rodada: ${playerMap.get(bestId)} com ${bestPts} pontos!`,
    });
  }

  // ── Worst scorer of the round ────────────────────────────────────────────────
  let worstId = "";
  let worstRoundPts = Infinity;
  for (const [pid, pts] of playerPts) {
    if (pts < worstRoundPts) { worstRoundPts = pts; worstId = pid; }
  }
  if (worstId && worstRoundPts === 0 && playerPts.size > 1 && bestPts > 0) {
    candidates.push({
      emoji: "😴",
      text: `${playerMap.get(worstId)} zerou na rodada. Será que estava assistindo o jogo errado? 😅`,
    });
  }

  // ── Exact score hit(s) ───────────────────────────────────────────────────────
  const exactPreds = roundPreds.filter((p) => {
    const game = roundGames.find((g) => g.id === p.game_id);
    return game && predictionError(p, game) === 0;
  });
  if (exactPreds.length === 1) {
    const p = exactPreds[0];
    const game = roundGames.find((g) => g.id === p.game_id)!;
    const name = playerMap.get(p.player_id);
    if (name)
      candidates.push({
        emoji: "🎯",
        text: `${name} acertou o placar exato de ${game.team_a} ${game.official_score_a}×${game.official_score_b} ${game.team_b}! Bola de cristal!`,
      });
  } else if (exactPreds.length > 1) {
    const names = [
      ...new Set(exactPreds.map((p) => playerMap.get(p.player_id)).filter(Boolean)),
    ] as string[];
    candidates.push({
      emoji: "🎯",
      text: `${names.slice(0, 2).join(" e ")} acertaram placares exatos na rodada! 🔥`,
    });
  }

  // ── Biggest miss ─────────────────────────────────────────────────────────────
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
      candidates.push({
        emoji: "😬",
        text: `${name} chutou ${worstGame.team_a} ${worstPred.predicted_score_a}×${worstPred.predicted_score_b} ${worstGame.team_b}, mas foi ${worstGame.official_score_a}×${worstGame.official_score_b}. Que derrapada!`,
      });
  }

  // ── Most optimistic single prediction ────────────────────────────────────────
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
    const actual = (optimistGame.official_score_a ?? 0) + (optimistGame.official_score_b ?? 0);
    if (name)
      candidates.push({
        emoji: "🚀",
        text: `${name} apostou em ${maxGoals} gols no jogo de ${optimistGame.team_a} vs ${optimistGame.team_b}. Foram só ${actual}. Sonhou alto! 😂`,
      });
  }

  // ── Game that fooled everyone (worst collective outcome accuracy) ─────────────
  for (const game of roundGames) {
    if (game.official_score_a === null || game.official_score_b === null) continue;
    const realOutcome = getOutcome(game.official_score_a, game.official_score_b);
    const gamePreds = roundPreds.filter((p) => p.game_id === game.id);
    if (gamePreds.length < 3) continue;

    const wrongOutcome = gamePreds.filter((p) => {
      if (p.predicted_score_a === null || p.predicted_score_b === null) return false;
      return getOutcome(p.predicted_score_a, p.predicted_score_b) !== realOutcome;
    });

    if (wrongOutcome.length === gamePreds.length) {
      candidates.push({
        emoji: "🤯",
        text: `Ninguém acertou o resultado de ${game.team_a} vs ${game.team_b} (${game.official_score_a}×${game.official_score_b}). O jogo enganou geral!`,
      });
    } else if (wrongOutcome.length >= gamePreds.length * 0.8) {
      candidates.push({
        emoji: "😲",
        text: `Quase ninguém esperava o resultado de ${game.team_a} ${game.official_score_a}×${game.official_score_b} ${game.team_b}. Surpreendente!`,
      });
    }
  }

  // ── Consensus wrong prediction (everyone predicted same wrong score) ──────────
  for (const game of roundGames) {
    if (game.official_score_a === null || game.official_score_b === null) continue;
    const gamePreds = roundPreds.filter(
      (p) =>
        p.game_id === game.id &&
        p.predicted_score_a !== null &&
        p.predicted_score_b !== null
    );
    if (gamePreds.length < 3) continue;

    const firstA = gamePreds[0].predicted_score_a;
    const firstB = gamePreds[0].predicted_score_b;
    const allSame = gamePreds.every(
      (p) => p.predicted_score_a === firstA && p.predicted_score_b === firstB
    );
    if (
      allSame &&
      (firstA !== game.official_score_a || firstB !== game.official_score_b)
    ) {
      candidates.push({
        emoji: "🐑",
        text: `Todo mundo chutou ${game.team_a} ${firstA}×${firstB} ${game.team_b}. Ninguém foi diferente… e ninguém acertou! Manada de ovelhas! 😂`,
      });
    }
  }

  // ── 0×0 game nobody expected ──────────────────────────────────────────────────
  const zeroZeroGames = roundGames.filter(
    (g) => g.official_score_a === 0 && g.official_score_b === 0
  );
  for (const game of zeroZeroGames) {
    const gamePreds = roundPreds.filter(
      (p) =>
        p.game_id === game.id &&
        p.predicted_score_a !== null &&
        p.predicted_score_b !== null
    );
    const predictedGoals = gamePreds.filter(
      (p) => (p.predicted_score_a ?? 0) + (p.predicted_score_b ?? 0) > 0
    );
    if (predictedGoals.length === gamePreds.length && gamePreds.length >= 2) {
      candidates.push({
        emoji: "😴",
        text: `${game.team_a} vs ${game.team_b} terminou 0×0. Todo mundo esperava gols e não veio nenhum. Soninho!`,
      });
    }
  }

  // ── Most conservative player (predicted lowest total goals in the round) ──────
  const playerTotalPredicted = new Map<string, number>();
  for (const pred of roundPreds) {
    if (pred.predicted_score_a === null || pred.predicted_score_b === null) continue;
    const total = pred.predicted_score_a + pred.predicted_score_b;
    playerTotalPredicted.set(
      pred.player_id,
      (playerTotalPredicted.get(pred.player_id) ?? 0) + total
    );
  }
  if (playerTotalPredicted.size >= 3) {
    let minGoals = Infinity;
    let conservativeId = "";
    for (const [pid, total] of playerTotalPredicted) {
      if (total < minGoals) { minGoals = total; conservativeId = pid; }
    }
    const avgGoals =
      [...playerTotalPredicted.values()].reduce((a, b) => a + b, 0) /
      playerTotalPredicted.size;

    if (conservativeId && minGoals < avgGoals * 0.5 && minGoals <= roundGames.length) {
      const name = playerMap.get(conservativeId);
      if (name)
        candidates.push({
          emoji: "🛡️",
          text: `${name} apostou em apenas ${minGoals} gols no total da rodada. Defesa fechada no coração! 😂`,
        });
    }
  }

  // ── Top-10 entries and exits ─────────────────────────────────────────────────
  if (roundGames.length > 0) {
    const lastRoundIds = new Set(roundGames.map((g) => g.id));
    const gamesWithoutRound = games.map((g) =>
      lastRoundIds.has(g.id)
        ? { ...g, official_score_a: null as null, official_score_b: null as null }
        : g
    );

    const nonAdminPlayers = players.filter((p) => !p.is_admin);

    // Build a full prediction lookup to avoid O(n²) .find() calls
    const allPredMap = new Map<string, Prediction>(
      predictions.map((p) => [`${p.player_id}-${p.game_id}`, p])
    );

    const rankByGames = (gameList: typeof games) =>
      nonAdminPlayers
        .map((player) => {
          let total = 0;
          for (const game of gameList) {
            const pred = allPredMap.get(`${player.id}-${game.id}`);
            const { points } = calculatePredictionPoints(pred, game);
            total += points;
          }
          return { id: player.id, total };
        })
        .sort((a, b) => b.total - a.total);

    const prevRanking = rankByGames(gamesWithoutRound);
    const currentRanking = rankByGames(games);

    const prevTop10 = new Set(prevRanking.slice(0, 10).map((p) => p.id));
    const currentTop10Ids = currentRanking.slice(0, 10).map((p) => p.id);
    const currentTop10 = new Set(currentTop10Ids);

    const entered = currentTop10Ids.filter((id) => !prevTop10.has(id));
    const exited = [...prevTop10].filter((id) => !currentTop10.has(id));

    if (entered.length > 0) {
      const names = entered.map((id) => playerMap.get(id)).filter(Boolean) as string[];
      if (names.length === 1)
        candidates.push({ emoji: "🚪", text: `${names[0]} entrou no Top 10! Bora subir mais! 📈` });
      else
        candidates.push({ emoji: "🚪", text: `${names.slice(0, 2).join(" e ")} entraram no Top 10 nessa rodada! 📈` });
    }

    if (exited.length > 0) {
      const names = exited.map((id) => playerMap.get(id)).filter(Boolean) as string[];
      if (names.length === 1)
        candidates.push({ emoji: "📉", text: `${names[0]} caiu fora do Top 10. Vai recuperar na próxima! 😬` });
      else
        candidates.push({ emoji: "📉", text: `${names.slice(0, 2).join(" e ")} saíram do Top 10 nessa rodada. Que virada! 😬` });
    }
  }

  const priority = candidates.filter((c) => c.emoji === "⭐" || c.emoji === "🎯");
  const others = candidates.filter((c) => c.emoji !== "⭐" && c.emoji !== "🎯");
  return [...priority, ...others];
}
