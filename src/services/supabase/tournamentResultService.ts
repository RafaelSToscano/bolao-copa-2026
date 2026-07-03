import { getSupabaseClient } from "./supabaseClient";

const TOURNAMENT_RESULT_COLUMNS = "id, champion, runner_up, third_place";

export type TournamentResult = {
  id: number;
  champion: string | null;
  runner_up: string | null;
  third_place: string | null;
};

export const tournamentResultService = {
  async get(): Promise<TournamentResult | null> {
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
};
