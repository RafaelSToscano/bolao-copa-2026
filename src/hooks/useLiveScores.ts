import { useEffect, useState } from "react";
import { Game } from "@/types/game";

export type LiveScoreMatch = {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
};

export function useLiveScores(activeGames: Game[]) {
  const [matches, setMatches] = useState<LiveScoreMatch[]>([]);

  useEffect(() => {
    if (activeGames.length === 0) {
      setMatches([]);
      return;
    }

    async function load() {
      try {
        const res = await fetch("/api/live-scores", { cache: "no-store" });
        const data = await res.json();

        const normalized = (data.matches || []).map((m: any) => ({
          id: m.id,
          utcDate: m.utcDate,
          status: m.status,
          homeTeam: m.homeTeam?.name,
          awayTeam: m.awayTeam?.name,
          homeScore: m.score?.fullTime?.home,
          awayScore: m.score?.fullTime?.away,
        }));

        setMatches(normalized);
      } catch {
        setMatches([]);
      }
    }

    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [activeGames.length]);

  return matches;
}

export function findLiveScoreForGame(
  game: Game,
  matches: LiveScoreMatch[]
): LiveScoreMatch | null {
  if (!game.match_date) return null;

  const gameTime = new Date(game.match_date).getTime();

  // Match by team-pair AND time proximity. Time alone is not enough
  // when two live games kick off within 90 minutes of each other —
  // we'd return the first match in that window for every lookup,
  // showing the same score on different cards.
  const teamPairMatches = (match: LiveScoreMatch) =>
    (match.homeTeam === game.team_a && match.awayTeam === game.team_b) ||
    (match.homeTeam === game.team_b && match.awayTeam === game.team_a);

  return (
    matches.find((match) => {
      if (!teamPairMatches(match)) return false;
      const apiTime = new Date(match.utcDate).getTime();
      const diffMinutes = Math.abs(apiTime - gameTime) / 60000;
      return diffMinutes <= 90;
    }) || null
  );
}