import { Game } from "@/types/game";
import { TeamStanding, QualifiedTeam } from "@/types/standings";

/**
 * Initializes a team standing entry
 */
function initializeTeam(team: string): TeamStanding {
  return {
    team,
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
  };
}

/**
 * Calculates group standings from completed games
 * @param groupGames - Games in the group
 * @returns Sorted standings
 */
export function calculateGroupStandings(groupGames: Game[]): TeamStanding[] {
  const table: Record<string, TeamStanding> = {};

  for (const game of groupGames) {
    // Skip games without official result
    if (game.official_score_a === null || game.official_score_b === null) {
      continue;
    }

    // Ensure teams exist in table
    if (!table[game.team_a]) {
      table[game.team_a] = initializeTeam(game.team_a);
    }
    if (!table[game.team_b]) {
      table[game.team_b] = initializeTeam(game.team_b);
    }

    const teamA = table[game.team_a];
    const teamB = table[game.team_b];

    const goalsA = game.official_score_a;
    const goalsB = game.official_score_b;

    // Update basic stats
    teamA.played += 1;
    teamB.played += 1;

    teamA.goalsFor += goalsA;
    teamA.goalsAgainst += goalsB;

    teamB.goalsFor += goalsB;
    teamB.goalsAgainst += goalsA;

    // Update points and records
    if (goalsA > goalsB) {
      teamA.points += 3;
      teamA.wins += 1;
      teamB.losses += 1;
    } else if (goalsA < goalsB) {
      teamB.points += 3;
      teamB.wins += 1;
      teamA.losses += 1;
    } else {
      teamA.points += 1;
      teamB.points += 1;
      teamA.draws += 1;
      teamB.draws += 1;
    }
  }

  // Calculate goal difference and sort
  const standings = Object.values(table)
    .map((team) => ({
      ...team,
      goalDiff: team.goalsFor - team.goalsAgainst,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.localeCompare(b.team);
    });

  return standings;
}

/**
 * Groups games by group_name and calculates standings
 * @param games - All games
 * @returns Record of group name to standings
 */
export function calculateAllGroupStandings(games: Game[]): Record<string, TeamStanding[]> {
  const grouped = games.reduce((acc: Record<string, Game[]>, game) => {
    const group = game.group_name || "Outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(game);
    return acc;
  }, {});

  const standings: Record<string, TeamStanding[]> = {};
  for (const [group, groupGames] of Object.entries(grouped)) {
    standings[group] = calculateGroupStandings(groupGames);
  }

  return standings;
}

/**
 * Calculates the best third-place teams
 * @param games - All games
 * @returns Sorted list of third-place teams
 */
export function calculateBestThirdPlace(games: Game[]): TeamStanding[] {
  const grouped = games.reduce((acc: Record<string, Game[]>, game) => {
    const group = game.group_name || "Outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(game);
    return acc;
  }, {});

  const thirds = Object.entries(grouped)
    .map(([group, groupGames]) => {
      const standings = calculateGroupStandings(groupGames);
      const thirdPlace = standings[2];

      if (!thirdPlace) return null;

      return {
        ...thirdPlace,
        group,
      };
    })
    .filter((t): t is TeamStanding & { group: string } => t !== null);

  return thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team);
  });
}

/**
 * Calculates qualified teams (1st and 2nd place from each group + best third-place teams)
 * @param games - All games
 * @returns List of qualified teams with position info
 */
export function calculateQualifiedTeams(games: Game[]): QualifiedTeam[] {
  const grouped = games.reduce((acc: Record<string, Game[]>, game) => {
    const group = game.group_name || "Outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(game);
    return acc;
  }, {});

  const qualified: QualifiedTeam[] = [];

  Object.entries(grouped).forEach(([group, groupGames]) => {
    const standings = calculateGroupStandings(groupGames);

    if (standings[0]) {
      qualified.push({
        position: "1",
        group,
        ...standings[0],
      } as QualifiedTeam);
    }

    if (standings[1]) {
      qualified.push({
        position: "2",
        group,
        ...standings[1],
      } as QualifiedTeam);
    }
  });

  const bestThirds = calculateBestThirdPlace(games)
    .slice(0, 8)
    .map((team) => ({
      position: "3",
      group: (team as TeamStanding & { group: string }).group,
      ...team,
    })) as QualifiedTeam[];

  return [...qualified, ...bestThirds].sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return Number(a.position) - Number(b.position);
  });
}