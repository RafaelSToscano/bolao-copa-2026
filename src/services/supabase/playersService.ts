import { getSupabaseClient } from "./supabaseClient";
import { Player } from "@/types/player";

export const playersService = {
  /**
   * Fetches all players
   */
  async getAllPlayers(): Promise<Player[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch players: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Finds a player by name and access code
   */
  async findPlayerByCredentials(name: string, accessCode: string): Promise<Player | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .ilike("name", name)
      .eq("access_code", accessCode)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find player: ${error.message}`);
    }

    return data || null;
  },
};
