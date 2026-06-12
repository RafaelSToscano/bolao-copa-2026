import { getSupabaseClient } from "./supabaseClient";
import { Game } from "@/types/game";
import { USE_MOCK_DATA, MOCK_GAMES } from "@/services/mock";

export const gamesService = {
  /**
   * Fetches all games
   */
  async getAllGames(): Promise<Game[]> {
    if (USE_MOCK_DATA) {
      return MOCK_GAMES;
    }

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
    if (value !== null && (!Number.isInteger(value) || value < 0)) {
      throw new Error("Placar inválido: deve ser um número inteiro não negativo.");
    }

    if (USE_MOCK_DATA) return;

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
