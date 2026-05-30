import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { AppLayout } from './AppLayout';
import { Player } from '@/types/player';

const mockUser: Player = {
  id: 'p1',
  name: 'João Silva',
  access_code: 'A1',
  is_admin: false,
  approved: true,
};

const adminUser: Player = {
  ...mockUser,
  is_admin: true,
};

const baseProps = {
  currentUser: mockUser,
  activeTab: 'palpites' as const,
  onTabChange: vi.fn(),
  onLogout: vi.fn(),
  children: <div data-testid="content">Conteúdo</div>,
};

describe('AppLayout Component', () => {
  it('should render the app title', () => {
    render(<AppLayout {...baseProps} />);
    expect(screen.getAllByText('Bolão Copa 2026').length).toBeGreaterThanOrEqual(1);
  });

  it('should render welcome message with user name', () => {
    render(<AppLayout {...baseProps} />);
    expect(screen.getAllByText(/Bem-vindo.*João Silva/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should render all standard nav tabs', () => {
    render(<AppLayout {...baseProps} />);
    expect(screen.getAllByText('Palpites').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Classificação').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Mata-mata').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ranking').length).toBeGreaterThanOrEqual(1);
  });

  it('should not render Admin tab for non-admin user', () => {
    render(<AppLayout {...baseProps} />);
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('should render Admin tab for admin user', () => {
    render(<AppLayout {...baseProps} currentUser={adminUser} />);
    expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1);
  });

  it('should render children content', () => {
    render(<AppLayout {...baseProps} />);
    expect(screen.getAllByTestId('content').length).toBeGreaterThanOrEqual(1);
  });

  it('should call onTabChange when a nav tab is clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<AppLayout {...baseProps} onTabChange={onTabChange} />);

    const rankingButtons = screen.getAllByText('Ranking');
    await user.click(rankingButtons[0]);
    expect(onTabChange).toHaveBeenCalledWith('ranking');
  });

  it('should call onLogout when logout button is clicked', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<AppLayout {...baseProps} onLogout={onLogout} />);

    const logoutButtons = screen.getAllByText(/Sair/i);
    await user.click(logoutButtons[0]);
    expect(onLogout).toHaveBeenCalled();
  });

  it('should highlight the active tab', () => {
    render(<AppLayout {...baseProps} activeTab="ranking" />);
    // Active tab buttons have yellow styling — verify by checking the class on one of them
    const rankingButtons = screen.getAllByText('Ranking');
    const hasActiveStyle = rankingButtons.some((el) =>
      el.closest('button')?.className.includes('yellow')
    );
    expect(hasActiveStyle).toBe(true);
  });
});
