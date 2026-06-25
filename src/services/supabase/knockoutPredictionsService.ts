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

/**
 * Drops every game belonging to a group that hasn't finished all of its
 * matches yet. `generateRound32()`/`calculateQualifiedTeams()` happily
 * compute standings from a partial group, which is correct for the live
 * "Meu Mata-mata" preview but wrong for the official bracket — a team
 * only "qualifies" once its group is actually done.
 */
function gamesFromCompleteGroups(games: Game[]): Game[] {
  const byGroup = new Map<string, Game[]>();
  for (const game of games) {
    const group = game.group_name ?? "";
    byGroup.set(group, [...(byGroup.get(group) ?? []), game]);
  }

  const completeGroups = new Set(
    Array.from(byGroup.entries())
      .filter(([, groupGames]) =>
        groupGames.every(
          (g) => g.official_score_a !== null && g.official_score_b !== null
        )
      )
      .map(([group]) => group)
  );

  return games.filter((game) => completeGroups.has(game.group_name ?? ""));
}

/**
 * A match's home_slot/away_slot can reference "W{id}" (advance the winner)
 * or "L{id}" (advance the loser, used only by the third-place match).
 * When a result is recorded for `matchId`, this writes the resolved team
 * into every match that references it.
 */
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

export const knockoutPredictionsService = {
  /**
   * Fetches all 32 knockout match slots (public)
   */
  async getKnockoutMatches(): Promise<KnockoutMatchRecord[]> {
    if (USE_MOCK_DATA) {
      return MOCK_KNOCKOUT_MATCHES;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("knockout_matches")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch knockout matches: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Gets a player's knockout predictions
   */
  async getKnockoutPredictionsForPlayer(playerId: string): Promise<KnockoutPrediction[]> {
    if (USE_MOCK_DATA) {
      return MOCK_KNOCKOUT_PREDICTIONS.filter((p) => p.player_id === playerId);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("knockout_predictions")
      .select("*")
      .eq("player_id", playerId);

    if (error) {
      throw new Error(`Failed to fetch player knockout predictions: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Admin view: every player's knockout predictions, paginated
   */
  async getAllKnockoutPredictions(): Promise<KnockoutPrediction[]> {
    if (USE_MOCK_DATA) {
      return MOCK_KNOCKOUT_PREDICTIONS;
    }

    const supabase = getSupabaseClient();

    const pageSize = 1000;
    let from = 0;
    let allData: KnockoutPrediction[] = [];

    while (true) {
      const { data, error } = await supabase
        .from("knockout_predictions")
        .select("*")
        .range(from, from + pageSize - 1);

      if (error) {
        throw new Error(`Failed to fetch knockout predictions: ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      allData = [...allData, ...data];

      if (data.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    return allData;
  },

  /**
   * Upserts a single knockout prediction
   */
  async upsertKnockoutPrediction(prediction: KnockoutPrediction): Promise<void> {
    if (USE_MOCK_DATA) return;

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("knockout_predictions")
      .upsert(prediction, { onConflict: "player_id,match_id" });

    if (error) {
      throw new Error(`Failed to save knockout prediction: ${error.message}`);
    }
  },

  /**
   * Admin-only: fills in home_team/away_team for the 16 Round of 32
   * matches (ids 1-16) once the group stage is complete, using
   * generateRound32() (official bracket + Annexe C third-place
   * resolution). Only fills slots that are still empty — a team the
   * admin already set manually (via `updateKnockoutMatchTeams`) is
   * never overwritten. Games from groups that haven't finished all of
   * their matches are excluded, so a slot stays unresolved rather than
   * being filled with a team from a still-incomplete group.
   */
  async populateRound32FromGroups(games: Game[]): Promise<void> {
    if (USE_MOCK_DATA) return;

    const round32 = generateRound32(gamesFromCompleteGroups(games));
    const supabase = getSupabaseClient();

    const { data: existing, error: fetchError } = await supabase
      .from("knockout_matches")
      .select("id, home_team, away_team")
      .lte("id", round32.length);

    if (fetchError) {
      throw new Error(`Failed to load round of 32 matches: ${fetchError.message}`);
    }

    const existingById = new Map((existing || []).map((m) => [m.id, m]));

    for (let i = 0; i < round32.length; i++) {
      const matchId = i + 1;
      const current = existingById.get(matchId);
      const homeTeam = round32[i].home?.team ?? null;
      const awayTeam = round32[i].away?.team ?? null;

      const update: { home_team?: string; away_team?: string } = {};
      if (homeTeam && !current?.home_team) update.home_team = homeTeam;
      if (awayTeam && !current?.away_team) update.away_team = awayTeam;

      if (Object.keys(update).length === 0) continue;

      const { error } = await supabase
        .from("knockout_matches")
        .update(update)
        .eq("id", matchId);

      if (error) {
        throw new Error(`Failed to populate round of 32 match ${matchId}: ${error.message}`);
      }
    }
  },

  /**
   * Admin-only: directly sets home_team/away_team for a single match,
   * overriding whatever the auto-population/cascade logic produced (or
   * filling a slot it left blank). Pass `null` to clear a side back to
   * "unresolved".
   */
  async updateKnockoutMatchTeams(
    matchId: number,
    homeTeam: string | null,
    awayTeam: string | null
  ): Promise<void> {
    if (USE_MOCK_DATA) return;

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("knockout_matches")
      .update({ home_team: homeTeam, away_team: awayTeam })
      .eq("id", matchId);

    if (error) {
      throw new Error(`Failed to update knockout match teams: ${error.message}`);
    }
  },

  /**
   * Admin-only: blocks (or re-opens) predictions for a single knockout
   * match, independent of every other match — e.g. lock a match right
   * before kickoff while leaving the rest of the bracket open.
   */
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

  /**
   * Admin-only: records the official result for a knockout match, then
   * cascades the winner (and, for the semi-finals, the loser) into
   * whichever later match references this one via a W{id}/L{id} slot.
   */
  async updateKnockoutMatchResult(
    matchId: number,
    scoreHome: number | null,
    scoreAway: number | null,
    winnerTeam: string | null
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

    const { error } = await supabase
      .from("knockout_matches")
      .update({
        official_score_home: scoreHome,
        official_score_away: scoreAway,
        winner_team: winnerTeam,
      })
      .eq("id", matchId);

    if (error) {
      throw new Error(`Failed to update knockout match result: ${error.message}`);
    }

    if (!winnerTeam) return;

    const loserTeam =
      winnerTeam === current?.home_team
        ? current?.away_team ?? null
        : current?.home_team ?? null;

    await cascadeMatchOutcome(supabase, matchId, winnerTeam, loserTeam);
  },

  /**
   * Admin-only: wipes all official knockout data (resolved teams, scores
   * and winners) on every one of the 32 matches, resetting the bracket
   * back to its freshly-seeded state (slots/round/match_number are fixed
   * by the migration and are left untouched). Intended for manually
   * testing the knockout flow end to end, not for tournament use.
   */
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
      })
      .gte("id", 1);

    if (error) {
      throw new Error(`Failed to clear knockout official data: ${error.message}`);
    }
  },
};
