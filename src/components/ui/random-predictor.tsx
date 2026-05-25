import React, { useState } from "react";
import { Dice5 } from "lucide-react";
import { Button } from "./button";

export type Game = {
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
};

export type RandomPrediction = {
  game_id: string;
  predicted_score_a: number;
  predicted_score_b: number;
};

interface RandomPredictorProps {
  games: Game[];
  onGeneratePredictions: (predictions: RandomPrediction[]) => void;
  disabled?: boolean;
  buttonLabel?: string;
}

interface SingleGameRandomPredictorProps {
  gameId: string;
  onGeneratePrediction: (prediction: RandomPrediction) => void;
  disabled?: boolean;
}

/**
 * Generates a random score between 0 and maxGoals
 * Uses weighted distribution to favor lower scores (more realistic)
 */
export function generateRandomScore(maxGoals: number = 6): number {
  const rand = Math.random();
  
  // Weighted distribution: favor lower scores
  if (rand < 0.30) return 0;
  if (rand < 0.55) return 1;
  if (rand < 0.75) return 2;
  if (rand < 0.88) return 3;
  if (rand < 0.95) return 4;
  return Math.floor(Math.random() * (maxGoals - 4)) + 5;
}

/**
 * RandomPredictor Component
 * 
 * Generates random predictions for a list of games with realistic score distribution.
 * When clicked, generates random scores for each game and calls the onGeneratePredictions callback.
 * 
 * @example
 * ```tsx
 * const [predictions, setPredictions] = useState<RandomPrediction[]>([]);
 * 
 * <RandomPredictor 
 *   games={games}
 *   onGeneratePredictions={(preds) => setPredictions(preds)}
 * />
 * ```
 */
export function RandomPredictor({
  games,
  onGeneratePredictions,
  disabled = false,
  buttonLabel = "Palpites Aleatórios",
}: RandomPredictorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePredictions = () => {
    setIsGenerating(true);

    // Small delay for animation/UX feedback
    setTimeout(() => {
      const predictions: RandomPrediction[] = games.map((game) => ({
        game_id: game.id,
        predicted_score_a: generateRandomScore(),
        predicted_score_b: generateRandomScore(),
      }));

      onGeneratePredictions(predictions);
      setIsGenerating(false);
    }, 300);
  };

  if (games.length === 0) {
    return null;
  }

  return (
    <Button
      onClick={handleGeneratePredictions}
      disabled={disabled || isGenerating}
      className="bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold gap-2 md:gap-2"
      title={`Gerar ${games.length} palpites aleatórios`}
    >
      <Dice5 size={18} />
      {buttonLabel}
    </Button>
  );
}

/**
 * SingleGameRandomPredictor Component
 * 
 * Generates a random prediction for a single match.
 * Used as an inline button within each game row.
 * 
 * @example
 * ```tsx
 * <SingleGameRandomPredictor 
 *   gameId={game.id}
 *   onGeneratePrediction={(pred) => handleSinglePrediction(pred)}
 *   disabled={groupsLocked}
 * />
 * ```
 */
export function SingleGameRandomPredictor({
  gameId,
  onGeneratePrediction,
  disabled = false,
}: SingleGameRandomPredictorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePrediction = () => {
    setIsGenerating(true);

    // Small delay for animation/UX feedback
    setTimeout(() => {
      const prediction: RandomPrediction = {
        game_id: gameId,
        predicted_score_a: generateRandomScore(),
        predicted_score_b: generateRandomScore(),
      };

      onGeneratePrediction(prediction);
      setIsGenerating(false);
    }, 200);
  };

  return (
  <button
    onClick={handleGeneratePrediction}
    disabled={disabled || isGenerating}
    className="
      flex items-center gap-2
      px-3 py-2
      rounded-xl
      bg-slate-900/80
      border border-slate-700
      hover:border-yellow-500
      hover:bg-slate-800
      disabled:opacity-50
      disabled:cursor-not-allowed
      text-slate-300
      hover:text-yellow-400
      transition-all
      text-xs
      font-bold
      shadow-lg
    "
    title="Gerar palpite aleatório para este jogo"
  >
    <Dice5 size={15} />

    <span className="hidden xl:inline">
      Aleatório
    </span>
  </button>
);
}
