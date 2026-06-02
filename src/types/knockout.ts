export interface KnockoutMatch {
  home: QualifiedTeam | undefined;
  away: QualifiedTeam | undefined;
}

export interface QualifiedTeam {
 position: "1" | "2" | "3";
  group: string;
  team: string;
  points: number;
  goalDiff: number;
}
