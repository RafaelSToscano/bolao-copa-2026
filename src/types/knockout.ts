export interface KnockoutMatch {
  home: QualifiedTeam | undefined;
  away: QualifiedTeam | undefined;
}

export interface QualifiedTeam {
 position: "1" | "2" | "3";
  group: string;
  team: string;
  points: number;
  goalDiff: number;
}

export interface KnockoutPrediction {
  id?: string;
  player_id: string;
  match_number: number;
  predicted_winner: "home" | "away" | null;
  predicted_score_a?: number | null;
  predicted_score_b?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DraftKnockoutPrediction {
  predicted_winner: "home" | "away" | "";
  predicted_score_a: string;
  predicted_score_b: string;
}
