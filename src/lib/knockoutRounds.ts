import { KnockoutMatchRecord, KnockoutRound } from "@/types/knockout";

export const ROUND_LABELS: Record<KnockoutRound, string> = {
  r32: "16 avos",
  r16: "Oitavas de Final",
  qf: "Quartas de Final",
  sf: "Semifinais",
  third_place: "Disputa de 3º Lugar",
  final: "Final",
};

export const ROUND_ORDER: KnockoutRound[] = ["r32", "r16", "qf", "sf", "third_place", "final"];

export type BracketProgressionRound = Exclude<KnockoutRound, "third_place">;

const BRACKET_PROGRESSION: BracketProgressionRound[] = [
  "r32",
  "r16",
  "qf",
  "sf",
  "final",
];

/**
 * "Currently being played" is the earliest progression round with at
 * least one match still missing a winner. Returns null only when no
 * knockout matches exist at all.
 */
export function pickCurrentKnockoutRound(
  matches: KnockoutMatchRecord[]
): BracketProgressionRound | null {
  for (const round of BRACKET_PROGRESSION) {
    const roundMatches = matches.filter((m) => m.round === round);
    if (roundMatches.length === 0) continue;

    const hasPending = roundMatches.some((m) => m.winner_team === null);
    if (hasPending) return round;
  }

  return null;
}

/**
 * Picks the round that should be previewed on the dashboard once the
 * group stage is over: the round AFTER the current one. Final has no
 * successor — it is its own preview.
 *
 * Returns `null` only when no knockout matches exist at all.
 */
export function pickNextKnockoutRound(
  matches: KnockoutMatchRecord[]
): BracketProgressionRound | null {
  const current = pickCurrentKnockoutRound(matches);
  if (!current) return null;
  if (current === "final") return "final";

  const idx = BRACKET_PROGRESSION.indexOf(current);
  return BRACKET_PROGRESSION[idx + 1];
}
