import { KnockoutRound } from "@/types/knockout";

type KnockoutMatchForVisibility = {
  round: KnockoutRound;
  match_date: string | null;
};

type KnockoutMatchForSort = KnockoutMatchForVisibility & {
  match_number: number;
  id: number;
};

const PROGRESSION_STAGES: KnockoutRound[] = [
  "r32",
  "r16",
  "qf",
  "sf",
  "final",
];

export const KNOCKOUT_ROUND_SECTION_TITLES: Record<KnockoutRound, string> = {
  r32: "16 AVOS DE FINAL",
  r16: "OITAVAS DE FINAL",
  qf: "QUARTAS DE FINAL",
  sf: "SEMIFINAIS",
  third_place: "DISPUTA DE 3º LUGAR",
  final: "FINAL",
};

export function getKnockoutStageRounds(stage: KnockoutRound): KnockoutRound[] {
  if (stage === "final" || stage === "third_place") {
    return ["third_place", "final"];
  }

  return [stage];
}

export function getNextKnockoutStage(
  stage: KnockoutRound
): KnockoutRound | null {
  if (stage === "third_place") return null;

  const index = PROGRESSION_STAGES.indexOf(stage);
  if (index === -1) return null;

  return PROGRESSION_STAGES[index + 1] ?? null;
}

function earliestDateForRounds(
  matches: KnockoutMatchForVisibility[],
  rounds: KnockoutRound[]
): Date | null {
  const times = matches
    .filter((match) => rounds.includes(match.round))
    .map((match) =>
      match.match_date ? new Date(match.match_date).getTime() : null
    )
    .filter((time): time is number => time !== null && !Number.isNaN(time));

  if (times.length === 0) return null;

  return new Date(Math.min(...times));
}

export function getCurrentKnockoutStage(
  matches: KnockoutMatchForVisibility[],
  now: Date = new Date()
): KnockoutRound {
  let currentStage: KnockoutRound = "r32";

  for (const stage of PROGRESSION_STAGES) {
    const stageStart = earliestDateForRounds(
      matches,
      getKnockoutStageRounds(stage)
    );

    if (!stageStart) continue;

    if (now.getTime() >= stageStart.getTime()) {
      currentStage = stage;
    }
  }

  return currentStage;
}

export function getVisiblePredictionKnockoutRounds(
  matches: KnockoutMatchForVisibility[],
  now: Date = new Date()
): KnockoutRound[] {
  const currentStage = getCurrentKnockoutStage(matches, now);
  const nextStage = getNextKnockoutStage(currentStage);

  const rounds = new Set<KnockoutRound>();

  getKnockoutStageRounds(currentStage).forEach((round) => rounds.add(round));

  if (nextStage) {
    getKnockoutStageRounds(nextStage).forEach((round) => rounds.add(round));
  }

  return Array.from(rounds);
}

export function getVisibleAdminKnockoutRounds(
  matches: KnockoutMatchForVisibility[],
  now: Date = new Date()
): KnockoutRound[] {
  const currentStage = getCurrentKnockoutStage(matches, now);

  return getKnockoutStageRounds(currentStage);
}

export function formatKnockoutRoundSectionTitle(
  round: KnockoutRound
): string {
  return KNOCKOUT_ROUND_SECTION_TITLES[round];
}

export function formatKnockoutStageSectionTitle(
  stage: KnockoutRound
): string {
  if (stage === "final" || stage === "third_place") {
    return "FINAL E 3º LUGAR";
  }

  return formatKnockoutRoundSectionTitle(stage);
}

export function sortKnockoutMatchesByDateAndNumber<T extends KnockoutMatchForSort>(
  matches: T[]
): T[] {
  return [...matches].sort((a, b) => {
    const dateA = a.match_date
      ? new Date(a.match_date).getTime()
      : Number.MAX_SAFE_INTEGER;
    const dateB = b.match_date
      ? new Date(b.match_date).getTime()
      : Number.MAX_SAFE_INTEGER;

    if (dateA !== dateB) return dateA - dateB;

    if (a.match_number !== b.match_number) {
      return a.match_number - b.match_number;
    }

    return a.id - b.id;
  });
}