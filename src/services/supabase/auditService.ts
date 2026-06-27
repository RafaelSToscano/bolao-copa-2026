import { getSupabaseClient } from "./supabaseClient";
import { PredictionAuditEntry } from "@/types/audit";

export const auditService = {
  async getPredictionAudit(limit = 200): Promise<PredictionAuditEntry[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("prediction_audit")
      .select(`
        id,
        player_id,
        game_id,
        action,
        old_score_a,
        old_score_b,
        new_score_a,
        new_score_b,
        changed_at,
        players ( name ),
        games ( team_a, team_b, match_date )
      `)
      .order("changed_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch audit log: ${error.message}`);

    return (data ?? []).map((row: any) => ({
      id:          row.id,
      player_id:   row.player_id,
      game_id:     row.game_id,
      action:      row.action,
      old_score_a: row.old_score_a,
      old_score_b: row.old_score_b,
      new_score_a: row.new_score_a,
      new_score_b: row.new_score_b,
      changed_at:  row.changed_at,
      player_name: row.players?.name ?? "—",
      team_a:      row.games?.team_a ?? "—",
      team_b:      row.games?.team_b ?? "—",
      match_date:  row.games?.match_date ?? null,
    }));
  },
    async getFinalPredictionsAudit() {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("final_predictions")
      .select(`
        player_id,
        champion,
        runner_up,
        third_place,
        updated_at,
        players ( name )
      `)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch final predictions audit: ${error.message}`);
    }

    return (data ?? []).map((row: any) => ({
      player_id: row.player_id,
      player_name: row.players?.name ?? "—",
      champion: row.champion ?? "—",
      runner_up: row.runner_up ?? "—",
      third_place: row.third_place ?? "—",
      updated_at: row.updated_at,
    }));
  },
};
