// Scoring configuration
export const SCORING_RULES = {
  EXACT_SCORE: 15,
  CORRECT_OUTCOME: 7,
  CORRECT_TEAM_SCORE: 2,
};

// Group phase deadline - after this time, no more group predictions can be made
export const GROUPS_PHASE_DEADLINE = new Date("2026-06-10T23:59:59");

export interface KnockoutPhase {
  name: string;
  opensAt: Date;       // UTC - when the prediction banner opens
  deadline: Date;      // UTC - when the prediction window closes
  deadlineLabel: string; // human-readable BRT label shown in the open banner
  opensAtLabel: string;  // human-readable BRT label shown in the blocked banner
}

// Each knockout phase has a 1-hour prediction window before the first kickoff.
// 16 avos was manually opened earlier; subsequent phases auto-open 1h before kickoff.
export const KNOCKOUT_PHASES: KnockoutPhase[] = [
  {
    name: "16 avos de final",
    opensAt: GROUPS_PHASE_DEADLINE,                  // opened as soon as groups closed
    deadline: new Date("2026-06-28T18:00:00Z"),      // dom 28/jun 15h BRT (1h before kickoff)
    deadlineLabel: "dom 28/jun às 15h BRT",
    opensAtLabel: "dom 28/jun às 15h BRT",
  },
  {
    name: "Oitavas de final",
    opensAt: new Date("2026-07-04T16:00:00Z"),       // sáb 04/jul 13h BRT
    deadline: new Date("2026-07-04T17:00:00Z"),      // sáb 04/jul 14h BRT (kickoff)
    deadlineLabel: "sáb 04/jul às 14h BRT",
    opensAtLabel: "sáb 04/jul às 13h BRT",
  },
  {
    name: "Quartas de final",
    opensAt: new Date("2026-07-09T19:00:00Z"),       // qui 09/jul 16h BRT
    deadline: new Date("2026-07-09T20:00:00Z"),      // qui 09/jul 17h BRT (kickoff)
    deadlineLabel: "qui 09/jul às 17h BRT",
    opensAtLabel: "qui 09/jul às 16h BRT",
  },
  {
    name: "Semifinais",
    opensAt: new Date("2026-07-14T18:00:00Z"),       // ter 14/jul 15h BRT
    deadline: new Date("2026-07-14T19:00:00Z"),      // ter 14/jul 16h BRT (kickoff)
    deadlineLabel: "ter 14/jul às 16h BRT",
    opensAtLabel: "ter 14/jul às 15h BRT",
  },
  {
    name: "Final",
    opensAt: new Date("2026-07-19T18:00:00Z"),       // dom 19/jul 15h BRT
    deadline: new Date("2026-07-19T19:00:00Z"),      // dom 19/jul 16h BRT (kickoff)
    deadlineLabel: "dom 19/jul às 16h BRT",
    opensAtLabel: "dom 19/jul às 15h BRT",
  },
];

// Team flag country codes mapping
export const TEAM_FLAG_CODES: Record<string, string> = {
  "México": "mx",
  "África do Sul": "za",
  "Coreia do Sul": "kr",
  "República Tcheca": "cz",
  "Rep. Checa": "cz",

  "Canadá": "ca",
  "Bósnia": "ba",
  "Catar": "qa",
  "Suíça": "ch",

  "Brasil": "br",
  "Marrocos": "ma",
  "Haiti": "ht",
  "Escócia": "gb-sct",

  "Estados Unidos": "us",
  "EUA": "us",
  "Paraguai": "py",
  "Austrália": "au",
  "Turquia": "tr",

  "Alemanha": "de",
  "Curaçao": "cw",
  "Curaçau": "cw",
  "Costa do Marfim": "ci",
  "Equador": "ec",

  "Holanda": "nl",
  "Japão": "jp",
  "Suécia": "se",
  "Tunísia": "tn",

  "Bélgica": "be",
  "Egito": "eg",
  "Irã": "ir",
  "Nova Zelândia": "nz",

  "Espanha": "es",
  "Cabo Verde": "cv",
  "Arábia Saudita": "sa",
  "Uruguai": "uy",

  "França": "fr",
  "Senegal": "sn",
  "Iraque": "iq",
  "Noruega": "no",

  "Argentina": "ar",
  "Argélia": "dz",
  "Áustria": "at",
  "Jordânia": "jo",

  "Portugal": "pt",
  "RD Congo": "cd",
  "Uzbequistão": "uz",
  "Colômbia": "co",

  "Inglaterra": "gb-eng",
  "Croácia": "hr",
  "Gana": "gh",
  "Panamá": "pa",
};

// Colors used throughout the application
export const COLORS = {
  green: "#3CAC3B",
  blue: "#2A398D",
  red: "#E61D25",
  lightGray: "#D1D4D1",
  darkGray: "#474A4A",
};

// Random prediction score distribution (weighted)
export const RANDOM_SCORE_DISTRIBUTION = {
  0: 0.30, // 30% -> 0 goals
  1: 0.25, // 25% -> 1 goal
  2: 0.20, // 20% -> 2 goals
  3: 0.13, // 13% -> 3 goals
  4: 0.07, // 7% -> 4 goals
  5: 0.05, // 5% -> 5+ goals
};
