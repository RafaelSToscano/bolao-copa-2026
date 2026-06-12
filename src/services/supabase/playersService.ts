import { getSupabaseClient } from "./supabaseClient";
import { Player } from "@/types/player";
import { USE_MOCK_DATA, MOCK_PLAYERS } from "@/services/mock";

function normalizeAccessCode(value: string): string {
  return value.replace(/\D/g, "");
}

export const playersService = {
  async getAllPlayers(): Promise<Player[]> {
    if (USE_MOCK_DATA) {
      return MOCK_PLAYERS;
    }

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

  async findPlayerByAccessCode(accessCode: string): Promise<Player | null> {
    if (USE_MOCK_DATA) {
      const normalized = normalizeAccessCode(accessCode);
      return (
        MOCK_PLAYERS.find((p) => p.access_code === normalized) ||
        MOCK_PLAYERS[0] ||
        null
      );
    }

    const supabase = getSupabaseClient();
    const normalizedAccessCode = normalizeAccessCode(accessCode);

    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("access_code", normalizedAccessCode)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find player: ${error.message}`);
    }

    return data;
  },

  async findPlayerByCredentials(
    accessCode: string,
    password: string
  ): Promise<Player | null> {
    if (USE_MOCK_DATA) {
      const normalized = normalizeAccessCode(accessCode);
      const byCode = MOCK_PLAYERS.find((p) => p.access_code === normalized);
      if (byCode) return byCode;

      const asIndex = parseInt(normalized, 10);
      if (!Number.isNaN(asIndex) && asIndex >= 0 && asIndex < MOCK_PLAYERS.length) {
        return MOCK_PLAYERS[asIndex];
      }
      return MOCK_PLAYERS[0] || null;
    }

    const supabase = getSupabaseClient();
    const normalizedAccessCode = normalizeAccessCode(accessCode);

    const { data, error } = await supabase.rpc("login_player", {
      p_access_code: normalizedAccessCode,
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
    if (USE_MOCK_DATA) {
      const normalized = normalizeAccessCode(accessCode);
      return {
        id: `mock-pending-${normalized}`,
        name,
        access_code: normalized,
        is_admin: false,
        approved: false,
        created_at: new Date().toISOString(),
      };
    }

    const supabase = getSupabaseClient();
    const normalizedAccessCode = normalizeAccessCode(accessCode);

    const { data, error } = await supabase.rpc("request_player_access", {
      p_name: name.trim(),
      p_access_code: normalizedAccessCode,
      p_password: password,
    });

    if (error) {
      throw new Error(`Failed to create pending player: ${error.message}`);
    }

    return data as Player;
  },

  async approvePlayer(playerId: string): Promise<void> {
    if (USE_MOCK_DATA) return;

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
    if (USE_MOCK_DATA) return;

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