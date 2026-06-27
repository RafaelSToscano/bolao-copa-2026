/**
 * EN → PT canonical team-name map. football-data.org returns English
 * names ("United States", "Brazil"), but the rest of the app — DB
 * rows, mock games, flag lookup, prediction matching — uses Portuguese
 * names ("Estados Unidos", "Brasil"). Translate at the upstream seam
 * so every consumer downstream of `getCachedLiveScores()` works with
 * one canonical shape.
 *
 * Aliases cover spellings the upstream has shifted between historically
 * (e.g. "Czech Republic" vs "Czechia", "Türkiye" vs "Turkey").
 */
const EN_TO_PT: Record<string, string> = {
  "Mexico": "México",
  "South Korea": "Coreia do Sul",
  "Korea Republic": "Coreia do Sul",
  "South Africa": "África do Sul",
  "Czech Republic": "República Tcheca",
  "Czechia": "República Tcheca",
  "Canada": "Canadá",
  "Bosnia and Herzegovina": "Bósnia",
  "Bosnia-Herzegovina": "Bósnia",
  "Qatar": "Catar",
  "Switzerland": "Suíça",
  "Brazil": "Brasil",
  "Morocco": "Marrocos",
  "Haiti": "Haiti",
  "Scotland": "Escócia",
  "United States": "Estados Unidos",
  "USA": "Estados Unidos",
  "Paraguay": "Paraguai",
  "Australia": "Austrália",
  "Turkey": "Turquia",
  "Türkiye": "Turquia",
  "Germany": "Alemanha",
  "Curacao": "Curaçao",
  "Curaçao": "Curaçao",
  "Curaçau": "Curaçao",
  "Ivory Coast": "Costa do Marfim",
  "Côte d'Ivoire": "Costa do Marfim",
  "Ecuador": "Equador",
  "Netherlands": "Holanda",
  "Japan": "Japão",
  "Sweden": "Suécia",
  "Tunisia": "Tunísia",
  "Belgium": "Bélgica",
  "Egypt": "Egito",
  "Iran": "Irã",
  "IR Iran": "Irã",
  "Islamic Republic of Iran": "Irã",
  "New Zealand": "Nova Zelândia",
  "Spain": "Espanha",
  "Cape Verde": "Cabo Verde",
  "Cape Verde Islands": "Cabo Verde",
  "Cabo Verde": "Cabo Verde",
  "Saudi Arabia": "Arábia Saudita",
  "Uruguay": "Uruguai",
  "France": "França",
  "Senegal": "Senegal",
  "Iraq": "Iraque",
  "Norway": "Noruega",
  "Argentina": "Argentina",
  "Algeria": "Argélia",
  "Austria": "Áustria",
  "Jordan": "Jordânia",
  "Portugal": "Portugal",
  "DR Congo": "RD Congo",
  "Congo DR": "RD Congo",
  "Democratic Republic of the Congo": "RD Congo",
  "Uzbekistan": "Uzbequistão",
  "Colombia": "Colômbia",
  "England": "Inglaterra",
  "Croatia": "Croácia",
  "Ghana": "Gana",
  "Panama": "Panamá",
};

export function toCanonicalTeamName(upstream: string): string {
  return EN_TO_PT[upstream] ?? upstream;
}
