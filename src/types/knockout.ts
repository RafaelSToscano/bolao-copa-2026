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

export type KnockoutRound = "r32" | "r16" | "qf" | "sf" | "third_place" | "final";

// Row from the `knockout_matches` table: the fixed 32-slot bracket catalog.
export interface KnockoutMatchRecord {
  id: number;
  round: KnockoutRound;
  match_number: number;
  home_slot: string;
  away_slot: string;
  home_team: string | null;
  away_team: string | null;
  official_score_home: number | null;
  official_score_away: number | null;
  winner_team: string | null;
  match_date: string | null;
  locked: boolean;
}

export interface KnockoutPrediction {
  id?: string;
  player_id: string;
  match_id: number;
  predicted_score_home: number | null;
  predicted_score_away: number | null;
  predicted_winner: "home" | "away" | null;
  created_at?: string;
  updated_at?: string;
}

export interface DraftKnockoutPrediction {
  predicted_score_home: string;
  predicted_score_away: string;
  predicted_winner: "home" | "away" | "";
}
