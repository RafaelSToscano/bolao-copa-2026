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
    if (USE_MOCK_DATA) return [];

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