import { getSupabaseClient } from "./supabaseClient";

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
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar resultado final: ${error.message}`);
    }

    return data;
  },
};