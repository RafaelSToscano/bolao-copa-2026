import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { KnockoutSection } from './KnockoutSection';
import { KnockoutMatch, QualifiedTeam } from '@/types/knockout';

const mockRound32: KnockoutMatch[] = [
  {
    home: { team: 'BRA', group: 'A', position: '1', points: 9, goalDiff: 5 },
    away: { team: 'ARG', group: 'B', position: '2', points: 6, goalDiff: 2 },
  },
  {
    home: { team: 'FRA', group: 'C', position: '1', points: 7, goalDiff: 3 },
    away: undefined,
  },
];

const mockQualifiedTeams: QualifiedTeam[] = [
  { team: 'BRA', group: 'A', position: '1', points: 9, goalDiff: 5 },
];

const baseProps = {
  games: [],
  predictions: [],
  round32: mockRound32,
  qualifiedTeams: mockQualifiedTeams,
  currentUserId: 'p1',
};

describe('KnockoutSection Component', () => {
  it('should render section heading', () => {
    render(<KnockoutSection {...baseProps} />);
    expect(screen.getByText('Mata-mata')).toBeInTheDocument();
  });

  it('should render 1ª fase eliminatória heading', () => {
    render(<KnockoutSection {...baseProps} />);
    expect(screen.getByText(/1ª fase eliminatória/i)).toBeInTheDocument();
  });

  it('should render team names from round32 matches', () => {
    render(<KnockoutSection {...baseProps} />);
    expect(screen.getAllByText('BRA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ARG').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('FRA').length).toBeGreaterThanOrEqual(1);
  });

  it('should show "A definir" for undefined teams', () => {
    render(<KnockoutSection {...baseProps} />);
    expect(screen.getByText('---')).toBeInTheDocument();
  });

  it('should render match numbers', () => {
    render(<KnockoutSection {...baseProps} />);
    expect(screen.getByText('Jogo 1')).toBeInTheDocument();
    expect(screen.getByText('Jogo 2')).toBeInTheDocument();
  });

  it('should render group/position labels for defined teams', () => {
    render(<KnockoutSection {...baseProps} />);
    expect(screen.getByText('1º Grupo A')).toBeInTheDocument();
    expect(screen.getByText('2º Grupo B')).toBeInTheDocument();
  });

  it('should render empty state when no round32 matches', () => {
    render(<KnockoutSection {...baseProps} round32={[]} />);
    expect(screen.queryByText('Jogo 1')).not.toBeInTheDocument();
  });
});
