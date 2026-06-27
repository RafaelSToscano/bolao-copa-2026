import { KnockoutRound } from "@/types/knockout";

export const ROUND_LABELS: Record<KnockoutRound, string> = {
  r32: "16 avos",
  r16: "Oitavas de Final",
  qf: "Quartas de Final",
  sf: "Semifinais",
  third_place: "Disputa de 3º Lugar",
  final: "Final",
};

export const ROUND_ORDER: KnockoutRound[] = ["r32", "r16", "qf", "sf", "third_place", "final"];
