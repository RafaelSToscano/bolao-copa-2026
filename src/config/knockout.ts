import { KnockoutMatchRecord, KnockoutRound } from "@/types/knockout";

export const ROUND_OF_32: KnockoutRound = "r32";
export const ROUND_OF_16: KnockoutRound = "r16";
export const QUARTER_FINALS: KnockoutRound = "qf";
export const SEMI_FINALS: KnockoutRound = "sf";
export const THIRD_PLACE: KnockoutRound = "third_place";
export const FINAL: KnockoutRound = "final";

export const PREDICTABLE_KNOCKOUT_ROUNDS: KnockoutRound[] = [
  ROUND_OF_32,
  ROUND_OF_16,
  QUARTER_FINALS,
  SEMI_FINALS,
  THIRD_PLACE,
  FINAL,
];

export const KNOCKOUT_ROUND_LOCK_DEADLINES: Record<KnockoutRound, Date> = {
  r32: new Date("2026-06-28T15:00:00-03:00"),
  r16: new Date("2026-07-04T13:00:00-03:00"),
  qf: new Date("2026-07-09T16:00:00-03:00"),
  sf: new Date("2026-07-14T15:00:00-03:00"),
  third_place: new Date("2026-07-18T17:00:00-03:00"),
  final: new Date("2026-07-19T15:00:00-03:00"),
};

export const KNOCKOUT_ROUND_LOCK_LABELS: Record<KnockoutRound, string> = {
  r32: "28/06 às 15:00h",
  r16: "04/07 às 13:00h",
  qf: "09/07 às 16:00h",
  sf: "14/07 às 15:00h",
  third_place: "18/07 às 17:00h",
  final: "19/07 às 15:00h",
};

export const ROUND_OF_32_LOCK_DEADLINE =
  KNOCKOUT_ROUND_LOCK_DEADLINES.r32;

type LockableKnockoutMatch = Pick<
  KnockoutMatchRecord,
  "round" | "locked" | "match_date"
> &
  Partial<Pick<KnockoutMatchRecord, "home_team" | "away_team">>;

export function isPredictableKnockoutRound(round: KnockoutRound): boolean {
  return PREDICTABLE_KNOCKOUT_ROUNDS.includes(round);
}

export function getKnockoutRoundLockDeadline(
  round: KnockoutRound
): Date | null {
  return KNOCKOUT_ROUND_LOCK_DEADLINES[round] ?? null;
}

export function formatKnockoutRoundLockDeadline(
  round: KnockoutRound
): string {
  return KNOCKOUT_ROUND_LOCK_LABELS[round] ?? "a definir";
}

export function isKnockoutMatchPredictionLocked(
  match: LockableKnockoutMatch,
  now: Date = new Date()
): boolean {
  if (!isPredictableKnockoutRound(match.round)) return true;

  const hasBothStoredTeams = Boolean(match.home_team && match.away_team);
  const hasDuplicateStoredTeams =
    Boolean(match.home_team && match.away_team) &&
    match.home_team === match.away_team;

  if (match.locked && (!hasBothStoredTeams || hasDuplicateStoredTeams)) {
    return true;
  }

  const deadline = getKnockoutRoundLockDeadline(match.round);
  if (!deadline) return true;

  return now.getTime() >= deadline.getTime();
}

export function formatRoundOf32LockDeadline(): string {
  return formatKnockoutRoundLockDeadline("r32");
}