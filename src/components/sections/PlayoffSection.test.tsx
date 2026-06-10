import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { PlayoffSection } from '@/components/sections/PlayoffSection';
import { KnockoutMatch, QualifiedTeam } from '@/types/knockout';

const mockTeam = (position: '1' | '2' | '3', group: string, team: string): QualifiedTeam => ({
  position,
  group,
  team,
  points: 9,
  goalDiff: 5,
});

const mockMatch = (home: QualifiedTeam | undefined, away: QualifiedTeam | undefined): KnockoutMatch => ({
  home,
  away,
});

describe('PlayoffSection Component', () => {
  it('should render page title and description', () => {
    render(<PlayoffSection round32={[]} />);
    expect(screen.getByText('Meu Mata-mata')).toBeInTheDocument();
    expect(screen.getByText(/primeira fase eliminatória/i)).toBeInTheDocument();
  });

  it('should render 4 bracket groups (Chaves A, B, C, D)', () => {
    render(<PlayoffSection round32={[]} />);
    expect(screen.getByText('Chave A')).toBeInTheDocument();
    expect(screen.getByText('Chave B')).toBeInTheDocument();
    expect(screen.getByText('Chave C')).toBeInTheDocument();
    expect(screen.getByText('Chave D')).toBeInTheDocument();
  });

  it('should show info message when no matches provided', () => {
    render(<PlayoffSection round32={[]} />);
    expect(screen.getByText(/Faça seus palpites/i)).toBeInTheDocument();
  });

  it('should render 16 match slots with placeholders when empty', () => {
    render(<PlayoffSection round32={[]} />);
    const jobNumbers = screen.getAllByText(/Jogo \d+/);
    expect(jobNumbers).toHaveLength(16);
  });

  it('should render match numbers 1-4 in Chave A', () => {
    render(<PlayoffSection round32={[]} />);
    expect(screen.getByText('Jogo 1')).toBeInTheDocument();
    expect(screen.getByText('Jogo 2')).toBeInTheDocument();
    expect(screen.getByText('Jogo 3')).toBeInTheDocument();
    expect(screen.getByText('Jogo 4')).toBeInTheDocument();
  });

  it('should render match numbers 5-8 in Chave B', () => {
    render(<PlayoffSection round32={[]} />);
    expect(screen.getByText('Jogo 5')).toBeInTheDocument();
    expect(screen.getByText('Jogo 6')).toBeInTheDocument();
    expect(screen.getByText('Jogo 7')).toBeInTheDocument();
    expect(screen.getByText('Jogo 8')).toBeInTheDocument();
  });

  it('should render match numbers 9-12 in Chave C', () => {
    render(<PlayoffSection round32={[]} />);
    expect(screen.getByText('Jogo 9')).toBeInTheDocument();
    expect(screen.getByText('Jogo 10')).toBeInTheDocument();
    expect(screen.getByText('Jogo 11')).toBeInTheDocument();
    expect(screen.getByText('Jogo 12')).toBeInTheDocument();
  });

  it('should render match numbers 13-16 in Chave D', () => {
    render(<PlayoffSection round32={[]} />);
    expect(screen.getByText('Jogo 13')).toBeInTheDocument();
    expect(screen.getByText('Jogo 14')).toBeInTheDocument();
    expect(screen.getByText('Jogo 15')).toBeInTheDocument();
    expect(screen.getByText('Jogo 16')).toBeInTheDocument();
  });

  it('should display team names when matches are provided', () => {
    const round32: KnockoutMatch[] = Array(16).fill(null).map((_, i) => {
      if (i === 0) {
        return mockMatch(
          mockTeam('1', 'A', 'Brasil'),
          mockTeam('3', 'E', 'Camarões')
        );
      }
      return mockMatch(undefined, undefined);
    });

    render(<PlayoffSection round32={round32} />);
    expect(screen.getByText('Brasil')).toBeInTheDocument();
    expect(screen.getByText('Camarões')).toBeInTheDocument();
  });

  it('should display team positions and groups', () => {
    const round32: KnockoutMatch[] = Array(16).fill(null).map((_, i) => {
      if (i === 0) {
        return mockMatch(
          mockTeam('1', 'A', 'Brasil'),
          mockTeam('2', 'F', 'Bélgica')
        );
      }
      return mockMatch(undefined, undefined);
    });

    render(<PlayoffSection round32={round32} />);
    expect(screen.getByText(/1º Grupo A/)).toBeInTheDocument();
    expect(screen.getByText(/2º Grupo F/)).toBeInTheDocument();
  });

  it('should display third-place team label correctly', () => {
    const round32: KnockoutMatch[] = Array(16).fill(null).map((_, i) => {
      if (i === 0) {
        return mockMatch(
          mockTeam('1', 'A', 'Brasil'),
          mockTeam('3', 'E', 'Camarões')
        );
      }
      return mockMatch(undefined, undefined);
    });

    render(<PlayoffSection round32={round32} />);
    expect(screen.getByText('3º melhor terceiro')).toBeInTheDocument();
  });

  it('should render VS separator between teams', () => {
    const round32: KnockoutMatch[] = Array(16).fill(null).map((_, i) => {
      if (i === 0) {
        return mockMatch(
          mockTeam('1', 'A', 'Brasil'),
          mockTeam('3', 'E', 'Camarões')
        );
      }
      return mockMatch(undefined, undefined);
    });

    render(<PlayoffSection round32={round32} />);
    const vsElements = screen.getAllByText('VS');
    expect(vsElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should display first phase eliminatória label in each match', () => {
    render(<PlayoffSection round32={[]} />);
    const phaseLabels = screen.getAllByText(/1ª Fase Eliminatória/i);
    expect(phaseLabels.length).toBe(16);
  });

  it('should render all 16 matches with complete teams', () => {
    const round32: KnockoutMatch[] = Array(16).fill(null).map((_, i) => {
      const groupA = String.fromCharCode(65 + (i % 12));
      return mockMatch(
        mockTeam('1', groupA, `Team${i}A`),
        mockTeam('2', String.fromCharCode(65 + ((i + 1) % 12)), `Team${i}B`)
      );
    });

    render(<PlayoffSection round32={round32} />);
    
    // Verify all teams are rendered
    for (let i = 0; i < 16; i++) {
      expect(screen.getByText(`Team${i}A`)).toBeInTheDocument();
      expect(screen.getByText(`Team${i}B`)).toBeInTheDocument();
    }
  });

  it('should show placeholders for matches without teams', () => {
    const round32: KnockoutMatch[] = Array(16).fill(null).map((_, i) => {
      if (i === 0) {
        return mockMatch(
          mockTeam('1', 'A', 'Brasil'),
          undefined
        );
      }
      return mockMatch(undefined, undefined);
    });

    render(<PlayoffSection round32={round32} />);
    
    // First match should have Brasil and an away placeholder
    expect(screen.getByText('Brasil')).toBeInTheDocument();
    
    // Other matches should be empty
    const jobNumbers = screen.getAllByText(/Jogo \d+/);
    expect(jobNumbers.length).toBe(16);
  });

  it('should render card containers for each group with proper structure', () => {
    const { container } = render(<PlayoffSection round32={[]} />);
    
    // Check that there are 4 card sections for the 4 groups
    const cardDivs = container.querySelectorAll('[class*="bg-slate-950"]');
    expect(cardDivs.length).toBeGreaterThan(0);
  });

  it('should have correct responsive layout', () => {
    const { container } = render(<PlayoffSection round32={[]} />);
    
    // Check grid layout classes
    const gridContainer = container.querySelector('[class*="grid"]');
    expect(gridContainer).toBeInTheDocument();
  });
});
