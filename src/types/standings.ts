export interface TeamStanding {
  team: string;
  group?: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  position?: string;
}

export interface GroupStandings {
  [groupName: string]: TeamStanding[];
}

export interface QualifiedTeam extends TeamStanding {
  position: "1" | "2" | "3";
  group: string;
}
