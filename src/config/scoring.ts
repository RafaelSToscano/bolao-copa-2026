// Scoring configuration
export const SCORING_RULES = {
  EXACT_SCORE: 15,
  CORRECT_OUTCOME: 7,
  CORRECT_TEAM_SCORE: 2,
};

// Group phase deadline - after this time, no more group predictions can be made
export const GROUPS_PHASE_DEADLINE = new Date("2026-06-10T23:59:59");

// Playoffs 16-avos deadline - Sunday June 28 at 15h BRT (18:00 UTC)
export const PLAYOFFS_AVOS_DEADLINE = new Date("2026-06-28T18:00:00Z");

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
