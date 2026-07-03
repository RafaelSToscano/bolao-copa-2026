import { getSupabaseClient } from "./supabaseClient";
import { USE_MOCK_DATA } from "@/services/mock";

export type FinalPrediction = {
  player_id: string;
  champion: string | null;
  runner_up: string | null;
  third_place: string | null;
  updated_at?: string;
};

export const finalPredictionsService = {
  async getByPlayer(playerId: string): Promise<FinalPrediction | null> {
    if (USE_MOCK_DATA) {
      return {
        player_id: playerId,
        champion: "Brasil",
        runner_up: "Argentina",
        third_place: "França",
        updated_at: new Date().toISOString(),
      };
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("final_predictions")
      .select("*")
      .eq("player_id", playerId)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar palpites finais: ${error.message}`);
    }

    return data;
  },

  async getAll(): Promise<FinalPrediction[]> {
    if (USE_MOCK_DATA) return [
      { player_id: "00000000-0000-4000-8000-000000000001", champion: "Brasil", runner_up: "Argentina", third_place: "França" },
      { player_id: "00000000-0000-4000-8000-000000000002", champion: "Brasil", runner_up: "França", third_place: "Argentina" },
      { player_id: "00000000-0000-4000-8000-000000000003", champion: "Argentina", runner_up: "Brasil", third_place: "Espanha" },
      { player_id: "00000000-0000-4000-8000-000000000004", champion: "França", runner_up: "Brasil", third_place: "Portugal" },
      { player_id: "00000000-0000-4000-8000-000000000005", champion: "Brasil", runner_up: "Espanha", third_place: "Argentina" },
      { player_id: "00000000-0000-4000-8000-000000000006", champion: "Espanha", runner_up: "Portugal", third_place: "Brasil" },
      { player_id: "00000000-0000-4000-8000-000000000007", champion: "Portugal", runner_up: "França", third_place: "Alemanha" },
      { player_id: "00000000-0000-4000-8000-000000000008", champion: "Brasil", runner_up: "Argentina", third_place: "França" },
      { player_id: "00000000-0000-4000-8000-000000000009", champion: "Argentina", runner_up: "Espanha", third_place: "Brasil" },
      { player_id: "00000000-0000-4000-8000-000000000010", champion: "França", runner_up: "Brasil", third_place: "Argentina" },
    ];

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("final_predictions")
      .select("*");

    if (error) {
      throw new Error(`Erro ao buscar todos os palpites finais: ${error.message}`);
    }

    return data || [];
  },

  async upsert(prediction: FinalPrediction): Promise<void> {
    if (USE_MOCK_DATA) return;

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("final_predictions")
      .upsert(
        {
          ...prediction,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "player_id" }
      );

    if (error) {
      throw new Error(`Erro ao salvar palpites finais: ${error.message}`);
    }
  },
};