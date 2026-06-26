import { KnockoutMatchRecord, KnockoutRound } from "@/types/knockout";

export const ROUND_OF_32: KnockoutRound = "r32";
export const PREDICTABLE_KNOCKOUT_ROUNDS: KnockoutRound[] = [ROUND_OF_32];

// Regra de produto atual: os palpites dos 16 avos travam no domingo às 15h.
// Considerando a data atual do projeto (25/06/2026), esse domingo é 28/06/2026
// no horário de Brasília/São Paulo.
export const ROUND_OF_32_LOCK_DEADLINE = new Date("2026-06-28T15:00:00-03:00");

export function isPredictableKnockoutRound(round: KnockoutRound): boolean {
  return PREDICTABLE_KNOCKOUT_ROUNDS.includes(round);
}

export function isKnockoutMatchPredictionLocked(
  match: Pick<KnockoutMatchRecord, "round" | "home_team" | "away_team" | "locked" | "match_date">,
  now: Date = new Date()
): boolean {
  if (!isPredictableKnockoutRound(match.round)) return true;
  if (!match.home_team || !match.away_team) return true;
  if (match.locked) return true;

  if (now.getTime() >= ROUND_OF_32_LOCK_DEADLINE.getTime()) return true;

  if (match.match_date) {
    const kickoff = new Date(match.match_date);
    if (!Number.isNaN(kickoff.getTime()) && now.getTime() >= kickoff.getTime()) {
      return true;
    }
  }

  return false;
}

export function formatRoundOf32LockDeadline(): string {
  return ROUND_OF_32_LOCK_DEADLINE.toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
