import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { AppLayout } from './AppLayout';
import { Player } from '@/types/player';

let mockPathname = '/palpites';
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

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
  onLogout: vi.fn(),
  children: <div data-testid="content">Conteúdo</div>,
  userCompletion: 50,
};

describe('AppLayout Component', () => {
  it('should render the app title', () => {
    mockPathname = '/palpites';
    render(<AppLayout {...baseProps} />);
    expect(screen.getAllByText('Bolão Copa 2026').length).toBeGreaterThanOrEqual(1);
  });

  it('should render welcome message with user name', () => {
    mockPathname = '/palpites';
    render(<AppLayout {...baseProps} />);
    expect(screen.getAllByText(/Bem-vindo.*João Silva/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should render all standard nav tabs', () => {
    mockPathname = '/palpites';
    render(<AppLayout {...baseProps} />);
    expect(screen.getAllByText('Palpites').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Classificação').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Mata-mata').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ranking').length).toBeGreaterThanOrEqual(1);
  });

  it('should expose pt-BR menu hrefs', () => {
    mockPathname = '/palpites';
    render(<AppLayout {...baseProps} />);
    const rankingLinks = screen
      .getAllByText('Ranking')
      .map((el) => el.closest('a'))
      .filter((a): a is HTMLAnchorElement => a !== null);
    expect(rankingLinks.length).toBeGreaterThan(0);
    expect(rankingLinks[0].getAttribute('href')).toBe('/ranking');

    const playoffLinks = screen
      .getAllByText('Palpites da Galera')
      .map((el) => el.closest('a'))
      .filter((a): a is HTMLAnchorElement => a !== null);
    expect(playoffLinks[0].getAttribute('href')).toBe('/palpites-da-galera');
  });

  it('should not render Admin tab for non-admin user', () => {
    mockPathname = '/palpites';
    render(<AppLayout {...baseProps} />);
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('should render Admin tab for admin user', () => {
    mockPathname = '/palpites';
    render(<AppLayout {...baseProps} currentUser={adminUser} />);
    expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1);
  });

  it('should render children content', () => {
    mockPathname = '/palpites';
    render(<AppLayout {...baseProps} />);
    expect(screen.getAllByTestId('content').length).toBeGreaterThanOrEqual(1);
  });

  it('should call onLogout when logout button is clicked', async () => {
    mockPathname = '/palpites';
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<AppLayout {...baseProps} onLogout={onLogout} />);

    const logoutButtons = screen.getAllByText(/Sair/i);
    await user.click(logoutButtons[0]);
    expect(onLogout).toHaveBeenCalled();
  });

  it('should highlight the active tab based on pathname', () => {
    mockPathname = '/ranking';
    render(<AppLayout {...baseProps} />);
    const rankingLinks = screen
      .getAllByText('Ranking')
      .map((el) => el.closest('a'))
      .filter((a): a is HTMLAnchorElement => a !== null);
    const hasActiveStyle = rankingLinks.some((el) =>
      el.className.includes('yellow')
    );
    expect(hasActiveStyle).toBe(true);
  });
});
