import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { RankingSection } from '@/components/sections/RankingSection';
import { Player } from '@/types/player';

describe('RankingSection Component', () => {
  const mockPlayers: (Player & { total: number; exacts: number; position: number })[] = [
    {
      id: '1',
      name: 'João Silva',
      access_code: 'code1',
      is_admin: false,
      approved: true,
      total: 150,
      exacts: 5,
      position: 1,
    },
    {
      id: '2',
      name: 'Maria Santos',
      access_code: 'code2',
      is_admin: false,
      approved: true,
      total: 120,
      exacts: 3,
      position: 2,
    },
    {
      id: '3',
      name: 'Pedro Costa',
      access_code: 'code3',
      is_admin: false,
      approved: true,
      total: 100,
      exacts: 2,
      position: 3,
    },
    {
      id: '4',
      name: 'Ana Oliveira',
      access_code: 'code4',
      is_admin: false,
      approved: true,
      total: 80,
      exacts: 1,
      position: 4,
    },
    {
      id: '5',
      name: 'Carlos Souza',
      access_code: 'code5',
      is_admin: false,
      approved: true,
      total: 60,
      exacts: 0,
      position: 5,
    },
  ];

  it('should render ranking section title', () => {
    render(<RankingSection ranking={mockPlayers} />);
    expect(screen.getByText('Ranking Geral')).toBeInTheDocument();
  });

  it('should render ranking description', () => {
    render(<RankingSection ranking={mockPlayers} />);
    expect(screen.getByText('Classificação atual do bolão.')).toBeInTheDocument();
  });

  it('should render top 3 podium', () => {
    render(<RankingSection ranking={mockPlayers} />);
    expect(screen.getAllByText('1º').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2º').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('3º').length).toBeGreaterThanOrEqual(1);
  });

  it('should display top 3 player names in podium', () => {
    render(<RankingSection ranking={mockPlayers} />);
    const joaoNames = screen.getAllByText('João Silva');
    const mariaNames = screen.getAllByText('Maria Santos');
    const pedroNames = screen.getAllByText('Pedro Costa');
    expect(joaoNames.length).toBeGreaterThanOrEqual(1);
    expect(mariaNames.length).toBeGreaterThanOrEqual(1);
    expect(pedroNames.length).toBeGreaterThanOrEqual(1);
  });

  it('should display top 3 player points in podium', () => {
    render(<RankingSection ranking={mockPlayers} />);
    const points = screen.getAllByText(/pts/);
    expect(points.length).toBeGreaterThanOrEqual(3);
  });

  it('should display top 3 player exact scores in podium', () => {
    render(<RankingSection ranking={mockPlayers} />);
    const exacts = screen.getAllByText(/placares exatos/i);
    expect(exacts.length).toBeGreaterThanOrEqual(3);
  });

  it('should render podium icons for top 3', () => {
    render(<RankingSection ranking={mockPlayers} />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('should display all players in full ranking table', () => {
    render(<RankingSection ranking={mockPlayers} />);
    mockPlayers.forEach((player) => {
      const playerNames = screen.getAllByText(player.name);
      expect(playerNames.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should display player points in ranking table', () => {
    render(<RankingSection ranking={mockPlayers} />);
    expect(screen.getAllByText(/150 pts/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/120 pts/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/100 pts/).length).toBeGreaterThanOrEqual(1);
  });

  it('should handle empty ranking', () => {
    render(<RankingSection ranking={[]} />);
    expect(screen.getByText('Ranking Geral')).toBeInTheDocument();
  });

  it('should display podium cards with correct styling', () => {
    const { container } = render(<RankingSection ranking={mockPlayers} />);
    const cards = container.querySelectorAll('[class*="rounded-3xl"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should render ranking with single player', () => {
    const singlePlayer = [mockPlayers[0]];
    render(<RankingSection ranking={singlePlayer} />);
    expect(screen.getAllByText('João Silva').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('150 pts').length).toBeGreaterThanOrEqual(1);
  });

  it('should render ranking with two players', () => {
    const twoPlayers = mockPlayers.slice(0, 2);
    render(<RankingSection ranking={twoPlayers} />);
    expect(screen.getAllByText('João Silva').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Maria Santos').length).toBeGreaterThanOrEqual(1);
  });

  it('should render ranking with many players', () => {
    const manyPlayers = Array.from({ length: 20 }, (_, i) => ({
      ...mockPlayers[0],
      id: `player${i}`,
      name: `Player_${i + 1}`,
      total: 100 - i * 5,
    }));
    render(<RankingSection ranking={manyPlayers} />);
    expect(screen.getAllByText('Player_1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Player_20').length).toBeGreaterThanOrEqual(1);
  });

  it('should display exact scores correctly', () => {
    render(<RankingSection ranking={mockPlayers} />);
    expect(screen.getAllByText(/5 placares exatos/).length).toBeGreaterThanOrEqual(1);
  });
});
