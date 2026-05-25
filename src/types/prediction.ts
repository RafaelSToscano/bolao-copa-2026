export interface Prediction {
  id?: string;
  player_id: string;
  game_id: string;
  predicted_score_a: number | null;
  predicted_score_b: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DraftPrediction {
  predicted_score_a: string;
  predicted_score_b: string;
}

export interface PredictionPoints {
  points: number;
  exact: number;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  total: number;
  exacts: number;
}
