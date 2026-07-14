import { useMemo } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import {
  calculateRanking,
  calculatePositionChanges,
} from "@/services/ranking/leaderboardCalculations";
import { FinalPrediction } from "@/services/supabase/finalPredictionsService";
import { TournamentResult } from "@/services/supabase/tournamentResultService";

// Stable empty fallbacks: defining the defaults inline (`= []`) creates a new
// array per call, which would bust useMemo on every render.
const EMPTY_KNOCKOUT_MATCHES: KnockoutMatchRecord[] = [];
const EMPTY_KNOCKOUT_PREDICTIONS: KnockoutPrediction[] = [];
const EMPTY_FINAL_PREDICTIONS: FinalPrediction[] = [];

export function useRanking(
  players: Player[],
  games: Game[],
  predictions: Prediction[],
  knockoutMatches: KnockoutMatchRecord[] = EMPTY_KNOCKOUT_MATCHES,
  knockoutPredictions: KnockoutPrediction[] = EMPTY_KNOCKOUT_PREDICTIONS,
  finalPredictions: FinalPrediction[] = EMPTY_FINAL_PREDICTIONS,
  tournamentResult: TournamentResult | null = null
) {
  const rankingPlayers = useMemo(
    () => players.filter((player) => player.ranking_visible !== false),
    [players]
  );

  const ranking = useMemo(
    () =>
      calculateRanking(
        rankingPlayers,
        games,
        predictions,
        knockoutMatches,
        knockoutPredictions,
        finalPredictions,
        tournamentResult
      ),
    [
      rankingPlayers,
      games,
      predictions,
      knockoutMatches,
      knockoutPredictions,
      finalPredictions,
      tournamentResult,
    ]
  );

  const positionChanges = useMemo(
    () =>
      calculatePositionChanges(
        ranking,
        games,
        predictions,
        rankingPlayers,
        knockoutMatches,
        knockoutPredictions,
        finalPredictions,
        tournamentResult
      ),
    [
      ranking,
      games,
      predictions,
      rankingPlayers,
      knockoutMatches,
      knockoutPredictions,
      finalPredictions,
      tournamentResult,
    ]
  );

  return { ranking, positionChanges };
}