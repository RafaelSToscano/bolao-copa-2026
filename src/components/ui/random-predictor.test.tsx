import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import {
  RandomPredictor,
  SingleGameRandomPredictor,
  generateRandomScore,
} from './random-predictor';

// ─── generateRandomScore ────────────────────────────────────────────────────

describe('generateRandomScore', () => {
  it('should return a number between 0 and 4', () => {
    for (let i = 0; i < 100; i++) {
      const score = generateRandomScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(4);
    }
  });

  it('should return a number between 0 and custom maxGoals', () => {
    for (let i = 0; i < 50; i++) {
      const score = generateRandomScore(6);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(6);
    }
  });

  it('should return integers only', () => {
    for (let i = 0; i < 50; i++) {
      expect(Number.isInteger(generateRandomScore())).toBe(true);
    }
  });

  it('should favour lower scores (weighted distribution)', () => {
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < 1000; i++) {
      counts[generateRandomScore()]++;
    }
    // 0 and 1 together should account for more than 50% of results
    expect(counts[0] + counts[1]).toBeGreaterThan(500);
  });
});

// ─── RandomPredictor ────────────────────────────────────────────────────────

const mockGames = [
  { id: 'g1', phase: 'groups', group_name: 'A', match_order: 1, match_date: null, team_a: 'BRA', team_b: 'ARG', official_score_a: null, official_score_b: null, locked: false },
  { id: 'g2', phase: 'groups', group_name: 'A', match_order: 2, match_date: null, team_a: 'FRA', team_b: 'GER', official_score_a: null, official_score_b: null, locked: false },
];

describe('RandomPredictor Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the default button label', () => {
    render(<RandomPredictor games={mockGames} onGeneratePredictions={vi.fn()} />);
    expect(screen.getByText('Palpites Aleatórios')).toBeInTheDocument();
  });

  it('should render a custom button label', () => {
    render(
      <RandomPredictor
        games={mockGames}
        onGeneratePredictions={vi.fn()}
        buttonLabel="Sortear"
      />
    );
    expect(screen.getByText('Sortear')).toBeInTheDocument();
  });

  it('should return null when games list is empty', () => {
    const { container } = render(
      <RandomPredictor games={[]} onGeneratePredictions={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <RandomPredictor games={mockGames} onGeneratePredictions={vi.fn()} disabled={true} />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should call onGeneratePredictions with a prediction per game after click', async () => {
    const onGeneratePredictions = vi.fn();
    render(<RandomPredictor games={mockGames} onGeneratePredictions={onGeneratePredictions} />);

    screen.getByRole('button').click();
    await vi.runAllTimersAsync();

    expect(onGeneratePredictions).toHaveBeenCalledTimes(1);
    const [predictions] = onGeneratePredictions.mock.calls[0];
    expect(predictions).toHaveLength(2);
    expect(predictions[0]).toMatchObject({ game_id: 'g1' });
    expect(predictions[1]).toMatchObject({ game_id: 'g2' });
  });

  it('should include valid scores in generated predictions', async () => {
    const onGeneratePredictions = vi.fn();
    render(<RandomPredictor games={mockGames} onGeneratePredictions={onGeneratePredictions} />);

    screen.getByRole('button').click();
    await vi.runAllTimersAsync();

    const [predictions] = onGeneratePredictions.mock.calls[0];
    predictions.forEach((p: any) => {
      expect(p.predicted_score_a).toBeGreaterThanOrEqual(0);
      expect(p.predicted_score_b).toBeGreaterThanOrEqual(0);
    });
  });

  it('should show title with game count', () => {
    render(<RandomPredictor games={mockGames} onGeneratePredictions={vi.fn()} />);
    expect(screen.getByTitle('Gerar 2 palpites aleatórios')).toBeInTheDocument();
  });
});

// ─── SingleGameRandomPredictor ───────────────────────────────────────────────

describe('SingleGameRandomPredictor Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the button', () => {
    render(
      <SingleGameRandomPredictor gameId="g1" onGeneratePrediction={vi.fn()} />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <SingleGameRandomPredictor gameId="g1" onGeneratePrediction={vi.fn()} disabled={true} />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should call onGeneratePrediction with the correct gameId after click', async () => {
    const onGeneratePrediction = vi.fn();
    render(
      <SingleGameRandomPredictor gameId="g1" onGeneratePrediction={onGeneratePrediction} />
    );

    screen.getByRole('button').click();
    await vi.runAllTimersAsync();

    expect(onGeneratePrediction).toHaveBeenCalledTimes(1);
    const [prediction] = onGeneratePrediction.mock.calls[0];
    expect(prediction.game_id).toBe('g1');
    expect(prediction.predicted_score_a).toBeGreaterThanOrEqual(0);
    expect(prediction.predicted_score_b).toBeGreaterThanOrEqual(0);
  });

  it('should show tooltip title', () => {
    render(
      <SingleGameRandomPredictor gameId="g1" onGeneratePrediction={vi.fn()} />
    );
    expect(screen.getByTitle('Gerar palpite aleatório para este jogo')).toBeInTheDocument();
  });
});
