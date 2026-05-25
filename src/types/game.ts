export interface Game {
  id: string;
  phase: string;
  group_name: string | null;
  match_order: number | null;
  match_date: string | null;
  team_a: string;
  team_b: string;
  official_score_a: number | null;
  official_score_b: number | null;
  locked: boolean;
}

export interface GameScore {
  official_score_a: number;
  official_score_b: number;
}
