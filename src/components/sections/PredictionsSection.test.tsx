import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { PredictionsSection } from './PredictionsSection';
import { Game } from '@/types/game';

vi.mock('@/lib/formatting', async (importActual) => ({
  ...(await importActual<typeof import('@/lib/formatting')>()),
  formatDate: vi.fn((d: string | null) => d ?? ''),
}));

vi.mock('@/services/standings/predictionSimulation', () => ({
  calculateGroupStandingsFromPredictions: vi.fn(() => []),
}));

const mockGames: Game[] = [
  { id: 'g1', phase: 'groups', group_name: 'A', match_order: 1, match_date: '2026-06-10', team_a: 'BRA', team_b: 'ARG', official_score_a: null, official_score_b: null, locked: false },
  { id: 'g2', phase: 'groups', group_name: 'A', match_order: 2, match_date: '2026-06-11', team_a: 'MEX', team_b: 'URU', official_score_a: null, official_score_b: null, locked: false },
];

const mockStats = {
  totalUserGames: 10,
  userPredictedGames: 5,
  userPendingGames: 5,
  userCompletion: 50,
};

const baseProps = {
  games: mockGames,
  predictions: [],
  drafts: {},
  groupsLocked: false,
  currentUserId: 'p1',
  onDraftChange: vi.fn(),
  onSinglePrediction: vi.fn(),
  onSingleRandomPrediction: vi.fn(),
  onClearPredictions: vi.fn(),
  userStats: mockStats,
};

describe('PredictionsSection Component', () => {
  it('should render stats cards with user data', () => {
    render(<PredictionsSection {...baseProps} />);
    expect(screen.getAllByText('Jogos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Palpitados').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pendentes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('% concluído').length).toBeGreaterThanOrEqual(1);
  });

  it('should display stat values', () => {
    render(<PredictionsSection {...baseProps} />);
    expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(1);
  });

  it('should render team names for each game', () => {
    render(<PredictionsSection {...baseProps} />);
    expect(screen.getAllByText('BRA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ARG').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MEX').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('URU').length).toBeGreaterThanOrEqual(1);
  });

  it('should render input fields for score predictions', () => {
    render(<PredictionsSection {...baseProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('should call onSinglePrediction when input changes', async () => {
    const user = userEvent.setup();
    const onSinglePrediction = vi.fn();
    render(<PredictionsSection {...baseProps} onSinglePrediction={onSinglePrediction} />);

    const inputs = screen.getAllByRole('spinbutton');
    await user.type(inputs[0], '2');
    expect(onSinglePrediction).toHaveBeenCalled();
  });

  it('should disable inputs when groupsLocked is true', () => {
    render(<PredictionsSection {...baseProps} groupsLocked={true} />);
    const inputs = screen.getAllByRole('spinbutton');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('should render group sections', () => {
    render(<PredictionsSection {...baseProps} />);
    // "Grupo A" also appears inside NextGameBanner's MatchCards now
    // that no-score games surface regardless of kickoff timing — use
    // getAllByText so the assertion is robust to the banner content.
    expect(screen.getAllByText('Grupo A').length).toBeGreaterThanOrEqual(1);
  });
});
