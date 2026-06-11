export interface PredictionAuditEntry {
  id: string;
  player_id: string;
  game_id: string;
  action: "insert" | "update";
  old_score_a: number | null;
  old_score_b: number | null;
  new_score_a: number | null;
  new_score_b: number | null;
  changed_at: string;
  player_name: string;
  team_a: string;
  team_b: string;
  match_date: string | null;
}
