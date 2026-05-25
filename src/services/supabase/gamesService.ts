import { getSupabaseClient } from "./supabaseClient";
import { Game } from "@/types/game";

export const gamesService = {
  /**
   * Fetches all games
   */
  async getAllGames(): Promise<Game[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("group_name", { ascending: true })
      .order("match_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch games: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Updates official result for a game
   */
  async updateOfficialResult(
    gameId: string,
    field: "official_score_a" | "official_score_b",
    value: number | null
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("games")
      .update({ [field]: value })
      .eq("id", gameId);

    if (error) {
      throw new Error(`Failed to update game result: ${error.message}`);
    }
  },
};
