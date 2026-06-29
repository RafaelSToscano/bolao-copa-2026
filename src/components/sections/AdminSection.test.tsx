import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { AdminSection } from './AdminSection';
import { Game } from '@/types/game';

vi.mock('@/lib/formatting', async (importActual) => ({
  ...(await importActual<typeof import('@/lib/formatting')>()),
  formatDate: vi.fn((d: string | null) => d ?? ''),
  exportAuditCsv: vi.fn(),
}));

const mockGames: Game[] = [
  { id: 'g1', phase: 'groups', group_name: 'A', match_order: 1, match_date: '2026-06-10', team_a: 'BRA', team_b: 'ARG', official_score_a: null, official_score_b: null, locked: false },
];

const mockPlayers = [
  { id: 'p1', name: 'João Silva', access_code: 'A1', is_admin: false, approved: true },
  { id: 'p2', name: 'Maria Santos', access_code: 'B2', is_admin: false, approved: false },
];

const mockStats = {
  totalPlayers: 2,
  approvedPlayers: 1,
  pendingPlayers: 1,
  activePlayers: 1,
  incompletePlayers: 0,
  zeroPlayers: 0,
};

const mockRanking = [
  { id: 'p1', name: 'João Silva', access_code: 'A1', is_admin: false, approved: true, total: 42, exacts: 2, position: 1 },
];

const baseProps = {
  games: mockGames,
  predictions: [],
  players: mockPlayers,
  ranking: mockRanking,
  knockoutMatches: [],
  knockoutPredictions: [],
  onUpdateResult: vi.fn(),
  onUpdateKnockoutResult: vi.fn(),
  onApprovePlayer: vi.fn(),
  onRejectPlayer: vi.fn(),
  stats: mockStats,
};

describe('AdminSection Component', () => {
  it('should render admin panel heading', () => {
    render(<AdminSection {...baseProps} />);
    expect(screen.getByText('Painel Admin')).toBeInTheDocument();
  });

  it('should render stats cards', () => {
    render(<AdminSection {...baseProps} />);
    expect(screen.getByText('Participantes')).toBeInTheDocument();
  });

  it('should render player stats counts', () => {
    render(<AdminSection {...baseProps} />);
    const twos = screen.getAllByText('2');
    expect(twos.length).toBeGreaterThanOrEqual(1);
  });

  it('should render export CSV button', () => {
    render(<AdminSection {...baseProps} />);
    expect(screen.getByRole('button', { name: /exportar auditoria/i })).toBeInTheDocument();
  });

  it('should render team names in game list', () => {
    render(<AdminSection {...baseProps} />);
    const headings = screen.getAllByText(/RESULTADOS OFICIAIS/);
    expect(headings.length).toBeGreaterThanOrEqual(1);
    // Verify teams appear in the game list section
    const braElements = screen.getAllByText('BRA');
    expect(braElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render pending player names', () => {
    render(<AdminSection {...baseProps} />);
    // Only non-approved players appear in the pending list
    expect(screen.getAllByText(/Maria Santos/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should call onApprovePlayer when approve button clicked', async () => {
    const user = userEvent.setup();
    const onApprovePlayer = vi.fn();
    render(<AdminSection {...baseProps} onApprovePlayer={onApprovePlayer} />);

    const approveButtons = screen.getAllByRole('button', { name: /aprovar/i });
    await user.click(approveButtons[0]);
    expect(onApprovePlayer).toHaveBeenCalled();
  });

  it('should call exportAuditCsv when export button is clicked', async () => {
    const user = userEvent.setup();
    const { exportAuditCsv } = await import('@/lib/formatting');
    render(<AdminSection {...baseProps} />);

    await user.click(screen.getByRole('button', { name: /exportar auditoria/i }));
    expect(exportAuditCsv).toHaveBeenCalled();
  });
});
