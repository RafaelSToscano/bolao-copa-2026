import { getSupabaseClient } from "./supabaseClient";
import { Prediction } from "@/types/prediction";

export const predictionsService = {
  /**
   * Fetches all predictions
   */
  async getAllPredictions(): Promise<Prediction[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("predictions").select("*");

    if (error) {
      throw new Error(`Failed to fetch predictions: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Gets predictions for a specific player
   */
  async getPredictionsForPlayer(playerId: string): Promise<Prediction[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("player_id", playerId);

    if (error) {
      throw new Error(`Failed to fetch player predictions: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Upserts a single prediction
   */
  async upsertPrediction(prediction: Prediction): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("predictions")
      .upsert(prediction, { onConflict: "player_id,game_id" });

    if (error) {
      throw new Error(`Failed to save prediction: ${error.message}`);
    }
  },

  /**
   * Upserts multiple predictions
   */
  async upsertPredictions(predictions: Prediction[]): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("predictions")
      .upsert(predictions, { onConflict: "player_id,game_id" });

    if (error) {
      throw new Error(`Failed to save predictions: ${error.message}`);
    }
  },
};
