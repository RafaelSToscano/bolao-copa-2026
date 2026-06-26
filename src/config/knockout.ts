import { KnockoutMatchRecord, KnockoutRound } from "@/types/knockout";

export const ROUND_OF_32: KnockoutRound = "r32";
export const PREDICTABLE_KNOCKOUT_ROUNDS: KnockoutRound[] = [ROUND_OF_32];

export const ROUND_OF_32_LOCK_DEADLINE = new Date("2026-06-28T15:00:00-03:00");

export function isPredictableKnockoutRound(round: KnockoutRound): boolean {
  return PREDICTABLE_KNOCKOUT_ROUNDS.includes(round);
}

export function isKnockoutMatchPredictionLocked(
  match: Pick<KnockoutMatchRecord, "round" | "locked" | "match_date">,
  now: Date = new Date()
): boolean {
  if (!isPredictableKnockoutRound(match.round)) return true;
  if (match.locked) return true;

  if (now.getTime() >= ROUND_OF_32_LOCK_DEADLINE.getTime()) return true;

  return false;
}

export function formatRoundOf32LockDeadline(): string {
  return "28/06 às 15:00h";
}