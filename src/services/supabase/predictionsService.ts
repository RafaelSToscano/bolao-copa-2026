import { getSupabaseClient } from "./supabaseClient";
import { Prediction } from "@/types/prediction";

export const predictionsService = {
  /**
   * Fetches all predictions
   */
  async getAllPredictions(): Promise<Prediction[]> {
  const supabase = getSupabaseClient();

  const pageSize = 1000;
  let from = 0;
  let allData: Prediction[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch predictions: ${error.message}`);
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
  async deletePredictionsForPlayer(playerId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("predictions")
    .delete()
    .eq("player_id", playerId);

  if (error) {
    throw new Error(`Failed to delete predictions: ${error.message}`);
  }
},
};
