import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { StandingsSection } from './StandingsSection';
import { Game } from '@/types/game';
import { TeamStanding } from '@/types/standings';

const mockGames: Game[] = [
  { id: 'g1', phase: 'groups', group_name: 'A', match_order: 1, match_date: '2026-06-10', team_a: 'BRA', team_b: 'ARG', official_score_a: 2, official_score_b: 1, locked: true },
  { id: 'g2', phase: 'groups', group_name: 'A', match_order: 2, match_date: '2026-06-11', team_a: 'MEX', team_b: 'URU', official_score_a: null, official_score_b: null, locked: false },
  { id: 'g3', phase: 'groups', group_name: 'B', match_order: 3, match_date: '2026-06-12', team_a: 'FRA', team_b: 'GER', official_score_a: 1, official_score_b: 1, locked: true },
];

const mockStandings: Record<string, TeamStanding[]> = {
  A: [
    { team: 'BRA', points: 3, played: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 1, goalDiff: 1 },
    { team: 'ARG', points: 0, played: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 2, goalDiff: -1 },
  ],
  B: [
    { team: 'FRA', points: 1, played: 1, wins: 0, draws: 1, losses: 0, goalsFor: 1, goalsAgainst: 1, goalDiff: 0 },
    { team: 'GER', points: 1, played: 1, wins: 0, draws: 1, losses: 0, goalsFor: 1, goalsAgainst: 1, goalDiff: 0 },
  ],
};

const baseProps = {
  games: mockGames,
  predictions: [],
  allGroupStandings: mockStandings,
  bestThirdPlace: [],
  calculateGroupStandingsFromPredictions: vi.fn(() => []),
  currentUserId: 'p1',
};

describe('StandingsSection Component', () => {
  it('should render group headings', () => {
    render(<StandingsSection {...baseProps} />);
    expect(screen.getByText('Grupo A')).toBeInTheDocument();
    expect(screen.getByText('Grupo B')).toBeInTheDocument();
  });

  it('should render team names in standings', () => {
    render(<StandingsSection {...baseProps} />);
    expect(screen.getAllByText('BRA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ARG').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('FRA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('GER').length).toBeGreaterThanOrEqual(1);
  });

  it('should render classification table headers', () => {
    render(<StandingsSection {...baseProps} />);
    const pHeaders = screen.getAllByText('P');
    expect(pHeaders.length).toBeGreaterThanOrEqual(1);
  });

  it('should render points for each team', () => {
    render(<StandingsSection {...baseProps} />);
    const threePoints = screen.getAllByText('3');
    expect(threePoints.length).toBeGreaterThanOrEqual(1);
  });

  it('should render with empty standings gracefully', () => {
    render(<StandingsSection {...baseProps} allGroupStandings={{}} />);
    expect(screen.getByText('Grupo A')).toBeInTheDocument();
  });

  it('should render with no games', () => {
    render(<StandingsSection {...baseProps} games={[]} allGroupStandings={{}} />);
    expect(screen.queryByText('Grupo A')).not.toBeInTheDocument();
  });
});
