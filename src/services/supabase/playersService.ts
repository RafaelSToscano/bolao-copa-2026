import { getSupabaseClient } from "./supabaseClient";
import { Player } from "@/types/player";

export const playersService = {
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

  async findPlayerByCredentials(
    name: string,
    password: string
  ): Promise<Player | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc("login_player", {
      p_name: name,
      p_password: password,
    });

    if (error) {
      throw new Error(`Failed to login player: ${error.message}`);
    }

    return data?.[0] || null;
  },

  async createPendingPlayer(
    name: string,
    accessCode: string,
    password: string
  ): Promise<Player> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc("request_player_access", {
      p_name: name,
      p_access_code: accessCode,
      p_password: password,
    });

    if (error) {
      throw new Error(`Failed to create pending player: ${error.message}`);
    }

    return data as Player;
  },

  async approvePlayer(playerId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("players")
      .update({ approved: true })
      .eq("id", playerId);

    if (error) {
      throw new Error(`Failed to approve player: ${error.message}`);
    }
  },

  async rejectPlayer(playerId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);

    if (error) {
      throw new Error(`Failed to reject player: ${error.message}`);
    }
  },
};