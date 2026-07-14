import { USE_MOCK_DATA } from "@/services/mock";
import { getSupabaseClient } from "./supabaseClient";

const TOURNAMENT_RESULT_COLUMNS = "id, champion, runner_up, third_place";

export type TournamentResult = {
  id: number;
  champion: string | null;
  runner_up: string | null;
  third_place: string | null;
};

export type TournamentResultInput = Omit<TournamentResult, "id">;

export const tournamentResultService = {
  async get(): Promise<TournamentResult | null> {
    if (USE_MOCK_DATA) {
      return {
        id: 1,
        champion: null,
        runner_up: null,
        third_place: null,
      };
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("tournament_result")
      .select(TOURNAMENT_RESULT_COLUMNS)
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar resultado final: ${error.message}`);
    }

    return data;
  },

  async update(result: TournamentResultInput): Promise<TournamentResult> {
    if (USE_MOCK_DATA) {
      return { id: 1, ...result };
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("tournament_result")
      .update({
        champion: result.champion,
        runner_up: result.runner_up,
        third_place: result.third_place,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select(TOURNAMENT_RESULT_COLUMNS)
      .single();

    if (error) {
      throw new Error(`Erro ao salvar resultado final: ${error.message}`);
    }

    return data;
  },
};
