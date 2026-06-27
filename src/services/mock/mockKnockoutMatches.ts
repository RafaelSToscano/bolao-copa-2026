import { KnockoutMatchRecord, KnockoutRound } from "@/types/knockout";

// Slots and matchups mirror the create_knockout_matches migration 1:1
// (same home_slot/away_slot order per FIFA World Cup 26 regulations,
// article 12.6-12.11), with illustrative team names filled in for the
// Round of 32 so the mock fixture looks plausible. "3(...)" slots stand
// in for a "best 3rd place" team — the real fixture depends on the
// Annexe C lookup, not implemented here; the mock just picks a team
// from one of the listed groups for visual purposes.
const ROUND_32: ReadonlyArray<{
  homeSlot: string;
  awaySlot: string;
  homeTeam: string;
  awayTeam: string;
}> = [
  { homeSlot: "2A", awaySlot: "2B", homeTeam: "Coreia do Sul", awayTeam: "Bósnia" },
  { homeSlot: "1E", awaySlot: "3(ABCDF)", homeTeam: "Alemanha", awayTeam: "África do Sul" },
  { homeSlot: "1F", awaySlot: "2C", homeTeam: "Holanda", awayTeam: "Marrocos" },
  { homeSlot: "1C", awaySlot: "2F", homeTeam: "Brasil", awayTeam: "Japão" },
  { homeSlot: "1I", awaySlot: "3(CDFGH)", homeTeam: "França", awayTeam: "Catar" },
  { homeSlot: "2E", awaySlot: "2I", homeTeam: "Curaçao", awayTeam: "Senegal" },
  { homeSlot: "1A", awaySlot: "3(CEFHI)", homeTeam: "México", awayTeam: "Haiti" },
  { homeSlot: "1L", awaySlot: "3(EHIJK)", homeTeam: "Inglaterra", awayTeam: "Austrália" },
  { homeSlot: "1D", awaySlot: "3(BEFIJ)", homeTeam: "Estados Unidos", awayTeam: "Costa do Marfim" },
  { homeSlot: "1G", awaySlot: "3(AEHIJ)", homeTeam: "Bélgica", awayTeam: "Suécia" },
  { homeSlot: "2K", awaySlot: "2L", homeTeam: "RD Congo", awayTeam: "Croácia" },
  { homeSlot: "1H", awaySlot: "2J", homeTeam: "Espanha", awayTeam: "Argélia" },
  { homeSlot: "1B", awaySlot: "3(EFGIJ)", homeTeam: "Canadá", awayTeam: "Irã" },
  { homeSlot: "1J", awaySlot: "2H", homeTeam: "Argentina", awayTeam: "Cabo Verde" },
  { homeSlot: "1K", awaySlot: "3(DEIJL)", homeTeam: "Portugal", awayTeam: "Arábia Saudita" },
  { homeSlot: "2D", awaySlot: "2G", homeTeam: "Paraguai", awayTeam: "Egito" },
];

function buildRound32(): KnockoutMatchRecord[] {
  return ROUND_32.map(({ homeSlot, awaySlot, homeTeam, awayTeam }, index) => ({
    id: index + 1,
    round: "r32" as KnockoutRound,
    match_number: index + 1,
    home_slot: homeSlot,
    away_slot: awaySlot,
    home_team: homeTeam,
    away_team: awayTeam,
    official_score_home: null,
    official_score_away: null,
    winner_team: null,
    match_date: null,
    locked: false,
  }));
}

function buildFutureRounds(): KnockoutMatchRecord[] {
  const rounds: Array<{
    round: KnockoutRound;
    startId: number;
    slots: Array<[string, string]>;
  }> = [
    {
      round: "r16",
      startId: 17,
      slots: [
        ["W2", "W5"],
        ["W1", "W3"],
        ["W4", "W6"],
        ["W7", "W8"],
        ["W11", "W12"],
        ["W9", "W10"],
        ["W14", "W16"],
        ["W13", "W15"],
      ],
    },
    {
      round: "qf",
      startId: 25,
      slots: [
        ["W17", "W18"],
        ["W21", "W22"],
        ["W19", "W20"],
        ["W23", "W24"],
      ],
    },
    {
      round: "sf",
      startId: 29,
      slots: [
        ["W25", "W26"],
        ["W27", "W28"],
      ],
    },
    { round: "third_place", startId: 31, slots: [["L29", "L30"]] },
    { round: "final", startId: 32, slots: [["W29", "W30"]] },
  ];

  return rounds.flatMap(({ round, startId, slots }) =>
    slots.map(([homeSlot, awaySlot], i) => ({
      id: startId + i,
      round,
      match_number: i + 1,
      home_slot: homeSlot,
      away_slot: awaySlot,
      home_team: null,
      away_team: null,
      official_score_home: null,
      official_score_away: null,
      winner_team: null,
      match_date: null,
      locked: false,
    }))
  );
}

export const MOCK_KNOCKOUT_MATCHES: KnockoutMatchRecord[] = [
  ...buildRound32(),
  ...buildFutureRounds(),
];
