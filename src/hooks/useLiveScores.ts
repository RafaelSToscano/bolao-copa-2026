import { useEffect, useState } from "react";
import { Game } from "@/types/game";
import { fetchJson } from "@/lib/fetchJson";

export type LiveScoreMatch = {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
};

export const LIVE_POLL_MS = 10_000;

export const LIVE_WINDOW_PRE_MS = 60 * 60 * 1000;
export const LIVE_WINDOW_POST_MS = 180 * 60 * 1000;

const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED", "LIVE", "HALF_TIME"]);
const UPCOMING_STATUSES = new Set(["TIMED", "SCHEDULED"]);

const TEAM_ALIASES: Record<string, string[]> = {
  "África do Sul": ["África do Sul", "Africa do Sul", "South Africa"],
  "Canadá": ["Canadá", "Canada"],
  "Brasil": ["Brasil", "Brazil"],
  "Japão": ["Japão", "Japan"],
  "Alemanha": ["Alemanha", "Germany"],
  "Paraguai": ["Paraguai", "Paraguay"],
  "Holanda": ["Holanda", "Países Baixos", "Netherlands"],
  "Marrocos": ["Marrocos", "Morocco"],
  "Costa do Marfim": ["Costa do Marfim", "Ivory Coast", "Côte d'Ivoire", "Cote d'Ivoire"],
  "Noruega": ["Noruega", "Norway"],
  "França": ["França", "France"],
  "Suécia": ["Suécia", "Sweden"],
  "México": ["México", "Mexico"],
  "Equador": ["Equador", "Ecuador"],
  "Inglaterra": ["Inglaterra", "England"],
  "Bélgica": ["Bélgica", "Belgium"],
  "Estados Unidos": ["Estados Unidos", "EUA", "United States", "USA"],
  "Bósnia": ["Bósnia", "Bósnia e Herzegovina", "Bosnia", "Bosnia and Herzegovina"],
  "Espanha": ["Espanha", "Spain"],
  "Croácia": ["Croácia", "Croatia"],
  "Suíça": ["Suíça", "Switzerland"],
  "Austrália": ["Austrália", "Australia"],
  "Egito": ["Egito", "Egypt"],
  "Argentina": ["Argentina"],
  "Cabo Verde": ["Cabo Verde", "Cape Verde"],
  "Colômbia": ["Colômbia", "Colombia"],
  "Gana": ["Gana", "Ghana"],
  "Argélia": ["Argélia", "Algeria"],
  "Áustria": ["Áustria", "Austria"],
  "Jordânia": ["Jordânia", "Jordan"],
};

function normalizeTeamName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function teamMatches(localTeam: string, apiTeam: string): boolean {
  const localAliases = TEAM_ALIASES[localTeam] ?? [localTeam];
  const normalizedApi = normalizeTeamName(apiTeam);

  return localAliases.some(
    (alias) => normalizeTeamName(alias) === normalizedApi
  );
}

function teamPairMatches(game: Game, match: LiveScoreMatch): boolean {
  return (
    (teamMatches(game.team_a, match.homeTeam) &&
      teamMatches(game.team_b, match.awayTeam)) ||
    (teamMatches(game.team_a, match.awayTeam) &&
      teamMatches(game.team_b, match.homeTeam))
  );
}

export function isLiveStatus(status: string): boolean {
  return LIVE_STATUSES.has(status);
}

export function isUpcomingStatus(status: string): boolean {
  return UPCOMING_STATUSES.has(status);
}

export function useLiveScores(games: Game[]) {
  const [matches, setMatches] = useState<LiveScoreMatch[]>([]);
  const shouldPoll = hasLiveOrImminent(games);

  useEffect(() => {
    if (!shouldPoll) {
      setMatches([]);
      return;
    }

    let cancelled = false;

    async function load() {
      const data = await fetchJson<{ matches?: LiveScoreMatch[] }>(
        "/api/live-scores"
      );
      if (cancelled) return;
      setMatches(data?.matches ?? []);
    }

    load();
    const id = setInterval(load, LIVE_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [shouldPoll]);

  return matches;
}

function hasLiveOrImminent(games: Game[]): boolean {
  const now = Date.now();

  for (const g of games) {
    if (!g.match_date) continue;

    const kickoff = new Date(g.match_date).getTime();
    const elapsed = now - kickoff;

    if (elapsed < 0 && -elapsed <= LIVE_WINDOW_PRE_MS) return true;
    if (elapsed >= 0 && elapsed <= LIVE_WINDOW_POST_MS) return true;
  }

  return false;
}

export function findLiveScoreForGame(
  game: Game,
  matches: LiveScoreMatch[]
): LiveScoreMatch | null {
  if (!game.match_date) return null;

  const gameTime = new Date(game.match_date).getTime();

  return (
    matches.find((match) => {
      if (!teamPairMatches(game, match)) return false;

      const apiTime = new Date(match.utcDate).getTime();
      const diffMinutes = Math.abs(apiTime - gameTime) / 60000;

      return diffMinutes <= 120;
    }) || null
  );
}