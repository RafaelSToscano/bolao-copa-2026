import { Game } from "./game";
import { Player } from "./player";
import { Prediction } from "./prediction";
import { TeamStanding } from "./standings";

export type RankingRow = Player & {
  total: number;
  exacts: number;
  position: number;
};

/**
 * A row that carries both the live (with in-progress scores folded
 * in) and the DB-source-of-truth values, so the client can render a
 * stable +N/-N delta against the official ranking for the entire
 * duration of a live match.
 *
 * `lastRoundDelta` mirrors the "since last round" arrow shown on the
 * Ranking screen: positive = moved up, negative = moved down, 0 = no
 * change (or no completed round yet). The dashboard surfaces this
 * when no live match is in progress so both screens agree.
 */
export type LiveRankingRow = RankingRow & {
  officialPosition: number;
  officialTotal: number;
  lastRoundDelta: number;
};

export interface DashboardRankingTopPayload {
  top: LiveRankingRow[];
  lanterna: LiveRankingRow | null;
  relegationZone: LiveRankingRow[];
  /** True when at least one in-progress game contributed live points */
  provisional: boolean;
}

export interface DashboardUpcomingPayload {
  games: Game[];
}

export interface DashboardRecentItem {
  game: Game;
  myPrediction: Prediction | null;
  myPoints: number;
}

export interface DashboardRecentPayload {
  items: DashboardRecentItem[];
}

export interface DashboardMyStatusPayload {
  position: number | null;
  total: number;
  exacts: number;
  completion: number;
  /** True when in-progress games contributed live points to total/position */
  provisional: boolean;
}

export interface DashboardGroupLeader {
  group: string;
  leader: TeamStanding | null;
}

export interface DashboardGroupLeadersPayload {
  groups: DashboardGroupLeader[];
}
