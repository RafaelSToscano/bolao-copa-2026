// Scoring configuration
export const SCORING_RULES = {
  EXACT_SCORE: 15,
  CORRECT_OUTCOME: 7,
  CORRECT_TEAM_SCORE: 2,
};

// Group phase deadline - after this time, no more group predictions can be made
export const GROUPS_PHASE_DEADLINE = new Date("2026-06-10T23:59:00-03:00");

// Team flag country codes mapping
export const TEAM_FLAG_CODES: Record<string, string> = {
  "México": "mx",
  "África do Sul": "za",
  "Coreia do Sul": "kr",
  "Rep. Checa": "cz",
  "Canadá": "ca",
  "Catar": "qa",
  "Suíça": "ch",
  "Bósnia": "ba",
  "Brasil": "br",
  "Marrocos": "ma",
  "Haiti": "ht",
  "Escócia": "gb-sct",
  "EUA": "us",
  "Paraguai": "py",
  "Austrália": "au",
  "Turquia": "tr",
  "Alemanha": "de",
  "Curaçau": "cw",
  "Costa do Marfim": "ci",
  "Equador": "ec",
  "Holanda": "nl",
  "Japão": "jp",
  "Suécia": "se",
  "Tunísia": "tn",
  "Portugal": "pt",
  "Egito": "eg",
  "Irã": "ir",
  "Cabo Verde": "cv",
  "Bélgica": "be",
  "Argélia": "dz",
  "Arábia Saudita": "sa",
  "Iraque": "iq",
  "Argentina": "ar",
  "Jordânia": "jo",
  "Croácia": "hr",
  "Nigéria": "ng",
  "França": "fr",
  "Chile": "cl",
  "Senegal": "sn",
  "Costa Rica": "cr",
  "Inglaterra": "gb-eng",
  "Camarões": "cm",
  "Uruguai": "uy",
  "Emirados Árabes": "ae",
  "Espanha": "es",
  "Gana": "gh",
  "Colômbia": "co",
  "Nova Zelândia": "nz",
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
