import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { Game } from "@/types/game";
import { generateRound32 } from "@/services/standings/knockoutQualification";
import {
  USE_MOCK_DATA,
  MOCK_KNOCKOUT_MATCHES,
  MOCK_KNOCKOUT_PREDICTIONS,
} from "@/services/mock";

const KNOCKOUT_MATCH_COLUMNS =
  "id, round, match_number, home_slot, away_slot, home_team, away_team, official_score_home, official_score_away, winner_team, match_date, locked";

const KNOCKOUT_PREDICTION_COLUMNS =
  "id, player_id, match_id, predicted_score_home, predicted_score_away, predicted_winner, created_at, updated_at";

function validateScore(value: number | null, field: string): void {
  if (value === null) return;

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} deve ser um número inteiro maior ou igual a zero.`);
  }
}

function isAllGroupStageComplete(games: Game[]): boolean {
  const groupGames = games.filter((game) => game.phase === "groups");

  return (
    groupGames.length > 0 &&
    groupGames.every(
      (game) =>
        game.official_score_a !== null &&
        game.official_score_b !== null
    )
  );
}

function matchUsesThirdPlace(
  match: Pick<KnockoutMatchRecord, "home_slot" | "away_slot">
): boolean {
  return match.home_slot.includes("3") || match.away_slot.includes("3");
}

async function cascadeMatchOutcome(
  supabase: SupabaseClient,
  matchId: number,
  winnerTeam: string,
  loserTeam: string | null
): Promise<void> {
  const winnerSlot = `W${matchId}`;
  const loserSlot = `L${matchId}`;

  const { data: dependents, error } = await supabase
    .from("knockout_matches")
    .select("id, home_slot, away_slot")
    .or(
      `home_slot.eq.${winnerSlot},away_slot.eq.${winnerSlot},home_slot.eq.${loserSlot},away_slot.eq.${loserSlot}`
    );

  if (error) {
    throw new Error(`Failed to look up dependent knockout matches: ${error.message}`);
  }

  for (const dependent of dependents || []) {
    const update: { home_team?: string; away_team?: string } = {};

    if (dependent.home_slot === winnerSlot) update.home_team = winnerTeam;
    if (dependent.away_slot === winnerSlot) update.away_team = winnerTeam;

    if (loserTeam) {
      if (dependent.home_slot === loserSlot) update.home_team = loserTeam;
      if (dependent.away_slot === loserSlot) update.away_team = loserTeam;
    }

    if (Object.keys(update).length === 0) continue;

    const { error: updateError } = await supabase
      .from("knockout_matches")
      .update(update)
      .eq("id", dependent.id);

    if (updateError) {
      throw new Error(
        `Failed to cascade result into match ${dependent.id}: ${updateError.message}`
      );
    }
  }
}

async function clearDependentBracket(
  supabase: SupabaseClient,
  matchId: number
): Promise<void> {
  const dependentSlots = [`W${matchId}`, `L${matchId}`];

  const { data: dependents, error } = await supabase
    .from("knockout_matches")
    .select("id, home_slot, away_slot")
    .or(
      dependentSlots
        .flatMap((slot) => [`home_slot.eq.${slot}`, `away_slot.eq.${slot}`])
        .join(",")
    );

  if (error) {
    throw new Error(`Failed to look up dependent knockout matches: ${error.message}`);
  }

  for (const dependent of dependents || []) {
    const update: {
      home_team?: null;
      away_team?: null;
      official_score_home: null;
      official_score_away: null;
      winner_team: null;
    } = {
      official_score_home: null,
      official_score_away: null,
      winner_team: null,
    };

    if (dependentSlots.includes(dependent.home_slot)) update.home_team = null;
    if (dependentSlots.includes(dependent.away_slot)) update.away_team = null;

    const { error: updateError } = await supabase
      .from("knockout_matches")
      .update(update)
      .eq("id", dependent.id);

    if (updateError) {
      throw new Error(
        `Failed to clear dependent knockout match ${dependent.id}: ${updateError.message}`
      );
    }

    await clearDependentBracket(supabase, dependent.id);
  }
}

export const knockoutPredictionsService = {
  async getKnockoutMatches(): Promise<KnockoutMatchRecord[]> {
    if (USE_MOCK_DATA) return MOCK_KNOCKOUT_MATCHES;

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("knockout_matches")
      .select(KNOCKOUT_MATCH_COLUMNS)
      .order("id", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch knockout matches: ${error.message}`);
    }

    return data || [];
  },

  async getKnockoutPredictionsForPlayer(
    playerId: string
  ): Promise<KnockoutPrediction[]> {
    if (USE_MOCK_DATA) {
      return MOCK_KNOCKOUT_PREDICTIONS.filter((p) => p.player_id === playerId);
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("knockout_predictions")
      .select(KNOCKOUT_PREDICTION_COLUMNS)
      .eq("player_id", playerId);

    if (error) {
      throw new Error(`Failed to fetch player knockout predictions: ${error.message}`);
    }

    return data || [];
  },

  async getAllKnockoutPredictions(): Promise<KnockoutPrediction[]> {
    if (USE_MOCK_DATA) return MOCK_KNOCKOUT_PREDICTIONS;

    const supabase = getSupabaseClient();

    const pageSize = 1000;
    let from = 0;
    let allData: KnockoutPrediction[] = [];

    while (true) {
      const { data, error } = await supabase
        .from("knockout_predictions")
        .select(KNOCKOUT_PREDICTION_COLUMNS)
        .range(from, from + pageSize - 1);

      if (error) {
        throw new Error(`Failed to fetch knockout predictions: ${error.message}`);
      }

      if (!data || data.length === 0) break;

      allData = [...allData, ...data];

      if (data.length < pageSize) break;

      from += pageSize;
    }

    return allData;
  },

  async upsertKnockoutPrediction(prediction: KnockoutPrediction): Promise<void> {
    if (USE_MOCK_DATA) return;

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("knockout_predictions")
      .upsert(
        {
          ...prediction,
          predicted_winner: null,
        },
        { onConflict: "player_id,match_id" }
      );

    if (error) {
      throw new Error(`Failed to save knockout prediction: ${error.message}`);
    }
  },

  async syncRound32FromGroups(games: Game[]): Promise<KnockoutMatchRecord[]> {
    if (USE_MOCK_DATA) return MOCK_KNOCKOUT_MATCHES;

    const supabase = getSupabaseClient();
    const round32 = generateRound32(games);
    const allGroupsComplete = isAllGroupStageComplete(games);

    const { data: existing, error: fetchError } = await supabase
      .from("knockout_matches")
      .select(KNOCKOUT_MATCH_COLUMNS)
      .eq("round", "r32")
      .order("match_number", { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to load round of 32 matches: ${fetchError.message}`);
    }

    const existingByMatchNumber = new Map(
      (existing || []).map((match) => [match.match_number, match])
    );

    for (let i = 0; i < round32.length; i++) {
      const matchNumber = i + 1;
      const current = existingByMatchNumber.get(matchNumber);
      if (!current) continue;

      const hasOfficialResult =
        current.official_score_home !== null ||
        current.official_score_away !== null ||
        current.winner_team !== null;

      if (hasOfficialResult) continue;

      const alreadyHasBothTeams = Boolean(current.home_team && current.away_team);

      if (alreadyHasBothTeams) {
        if (current.home_team === current.away_team) {
          await supabase
            .from("knockout_matches")
            .update({
              locked: true,
              official_score_home: null,
              official_score_away: null,
              winner_team: null,
            })
            .eq("id", current.id);
          continue;
        }

        if (current.locked) {
          const { error } = await supabase
            .from("knockout_matches")
            .update({ locked: false })
            .eq("id", current.id);

          if (error) {
            throw new Error(
              `Failed to unlock consolidated match ${current.id}: ${error.message}`
            );
          }
        }

        continue;
      }

      const calculatedHome = round32[i].home?.team ?? null;
      const calculatedAway = round32[i].away?.team ?? null;

      const usesThirdPlace = matchUsesThirdPlace(current);
      const canUseCalculatedTeams = !usesThirdPlace || allGroupsComplete;

      let nextHomeTeam = current.home_team;
      let nextAwayTeam = current.away_team;

      if (canUseCalculatedTeams) {
        if (!nextHomeTeam && calculatedHome !== nextAwayTeam) {
          nextHomeTeam = calculatedHome;
        }

        if (!nextAwayTeam && calculatedAway !== nextHomeTeam) {
          nextAwayTeam = calculatedAway;
        }
      }

      const hasDuplicateTeams =
        Boolean(nextHomeTeam && nextAwayTeam) && nextHomeTeam === nextAwayTeam;

      if (hasDuplicateTeams) {
        const { error } = await supabase
          .from("knockout_matches")
          .update({
            locked: true,
            official_score_home: null,
            official_score_away: null,
            winner_team: null,
          })
          .eq("id", current.id);

        if (error) {
          throw new Error(
            `Failed to lock duplicated knockout match ${current.id}: ${error.message}`
          );
        }

        continue;
      }

      const shouldUnlock = Boolean(nextHomeTeam && nextAwayTeam);

      const teamsChanged =
        current.home_team !== nextHomeTeam || current.away_team !== nextAwayTeam;

      const lockChanged = current.locked !== !shouldUnlock;

      if (!teamsChanged && !lockChanged) continue;

      const { error } = await supabase
        .from("knockout_matches")
        .update({
          home_team: nextHomeTeam,
          away_team: nextAwayTeam,
          locked: !shouldUnlock,
          official_score_home: null,
          official_score_away: null,
          winner_team: null,
        })
        .eq("id", current.id);

      if (error) {
        throw new Error(`Failed to sync round of 32 match ${current.id}: ${error.message}`);
      }
    }

    return this.getKnockoutMatches();
  },

  async updateKnockoutMatchTeams(
    matchId: number,
    homeTeam: string | null,
    awayTeam: string | null
  ): Promise<void> {
    if (USE_MOCK_DATA) return;

    if (homeTeam && awayTeam && homeTeam === awayTeam) {
      throw new Error("O mesmo time não pode ocupar os dois lados do confronto.");
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("knockout_matches")
      .update({
        home_team: homeTeam,
        away_team: awayTeam,
        locked: !(homeTeam && awayTeam),
        official_score_home: null,
        official_score_away: null,
        winner_team: null,
      })
      .eq("id", matchId);

    if (error) {
      throw new Error(`Failed to update knockout match teams: ${error.message}`);
    }

    await clearDependentBracket(supabase, matchId);
  },

  async setMatchLocked(matchId: number, locked: boolean): Promise<void> {
    if (USE_MOCK_DATA) return;

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("knockout_matches")
      .update({ locked })
      .eq("id", matchId);

    if (error) {
      throw new Error(`Failed to update knockout match lock state: ${error.message}`);
    }
  },

  async updateKnockoutMatchResult(
  matchId: number,
  scoreHome: number | null,
  scoreAway: number | null,
  winnerTeam: string | null = null
): Promise<void> {
    if (USE_MOCK_DATA) return;

    const supabase = getSupabaseClient();

    const { data: current, error: fetchError } = await supabase
      .from("knockout_matches")
      .select("home_team, away_team")
      .eq("id", matchId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to load knockout match: ${fetchError.message}`);
    }

    if (!current?.home_team || !current?.away_team) {
      throw new Error("Não é possível salvar resultado sem os dois times definidos.");
    }

    validateScore(scoreHome, "Placar do mandante");
    validateScore(scoreAway, "Placar do visitante");

    const isClearing = scoreHome === null && scoreAway === null;
    const hasPartialScore = (scoreHome === null) !== (scoreAway === null);

    if (hasPartialScore) {
      throw new Error("Informe os dois placares ou limpe os dois.");
    }

    let officialWinner: string | null = null;

if (!isClearing && scoreHome !== null && scoreAway !== null) {
  if (scoreHome > scoreAway) {
    officialWinner = current.home_team;
  } else if (scoreAway > scoreHome) {
    officialWinner = current.away_team;
  } else {
    if (!winnerTeam) {
      throw new Error(
        "Selecione quem avançou nos pênaltis."
      );
    }

    officialWinner = winnerTeam;
  }
}

    const { error } = await supabase
      .from("knockout_matches")
      .update({
        official_score_home: scoreHome,
        official_score_away: scoreAway,
        winner_team: officialWinner,
      })
      .eq("id", matchId);

    if (error) {
      throw new Error(`Failed to update knockout match result: ${error.message}`);
    }

    await clearDependentBracket(supabase, matchId);

    if (!officialWinner) return;

    const loserTeam =
      officialWinner === current.home_team ? current.away_team : current.home_team;

    await cascadeMatchOutcome(supabase, matchId, officialWinner, loserTeam);
  },

  async clearAllOfficialResults(): Promise<void> {
    if (USE_MOCK_DATA) return;

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("knockout_matches")
      .update({
        home_team: null,
        away_team: null,
        official_score_home: null,
        official_score_away: null,
        winner_team: null,
        locked: true,
      })
      .gte("id", 1);

    if (error) {
      throw new Error(`Failed to clear knockout official data: ${error.message}`);
    }
  },
};