import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { Flag } from '@/components/ui/Flag';

// Mock the formatting function
vi.mock('@/lib/formatting', () => ({
  getFlagCode: vi.fn((team: string) => {
    const codes: Record<string, string | null> = {
      'Brasil': 'br',
      'México': 'mx',
      'Argentina': 'ar',
      'Germany': 'de',
      'France': 'fr',
      'Unknown': null,
    };
    return codes[team] || null;
  }),
}));

describe('Flag Component', () => {
  it('should render flag image for known team', () => {
    render(<Flag team="Brasil" />);
    const img = screen.getByAltText('Brasil') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('flagcdn.com');
  });

  it('should set correct flag code in src', () => {
    render(<Flag team="Brasil" />);
    const img = screen.getByAltText('Brasil') as HTMLImageElement;
    expect(img.src).toContain('br.png');
  });

  it('should render different flag codes for different teams', () => {
    const { unmount } = render(<Flag team="México" />);
    let img = screen.getByAltText('México') as HTMLImageElement;
    expect(img.src).toContain('mx.png');
    unmount();

    render(<Flag team="Argentina" />);
    img = screen.getByAltText('Argentina') as HTMLImageElement;
    expect(img.src).toContain('ar.png');
  });

  it('should render with small size by default', () => {
    render(<Flag team="Brasil" />);
    const img = screen.getByAltText('Brasil');
    expect(img.className).toContain('h-4');
    expect(img.className).toContain('w-6');
  });

  it('should render with medium size', () => {
    render(<Flag team="Brasil" size="medium" />);
    const img = screen.getByAltText('Brasil');
    expect(img.className).toContain('h-6');
    expect(img.className).toContain('w-9');
  });

  it('should render with large size', () => {
    render(<Flag team="Brasil" size="large" />);
    const img = screen.getByAltText('Brasil');
    expect(img.className).toContain('h-8');
    expect(img.className).toContain('w-12');
  });

  it('should have rounded-sm class', () => {
    render(<Flag team="Brasil" />);
    const img = screen.getByAltText('Brasil');
    expect(img.className).toContain('rounded-sm');
  });

  it('should have object-cover class', () => {
    render(<Flag team="Brasil" />);
    const img = screen.getByAltText('Brasil');
    expect(img.className).toContain('object-cover');
  });

  it('should have mr-2 class', () => {
    render(<Flag team="Brasil" />);
    const img = screen.getByAltText('Brasil');
    expect(img.className).toContain('mr-2');
  });

  it('should render as inline-block', () => {
    render(<Flag team="Brasil" />);
    const img = screen.getByAltText('Brasil');
    expect(img.className).toContain('inline-block');
  });

  it('should return null for unknown team', () => {
    const { container } = render(<Flag team="Unknown" />);
    expect(container.firstChild).toBeNull();
  });

  it('should set team name as alt text', () => {
    render(<Flag team="Brasil" />);
    expect(screen.getByAltText('Brasil')).toBeInTheDocument();
  });

  it('should use correct CDN URL', () => {
    render(<Flag team="Brasil" />);
    const img = screen.getByAltText('Brasil') as HTMLImageElement;
    expect(img.src).toMatch(/https:\/\/flagcdn\.com\/w40\//);
  });

  it('should combine all size classes correctly for small', () => {
    render(<Flag team="Brasil" size="small" />);
    const img = screen.getByAltText('Brasil');
    const classes = img.className;
    expect(classes).toContain('inline-block');
    expect(classes).toContain('rounded-sm');
    expect(classes).toContain('object-cover');
    expect(classes).toContain('mr-2');
    expect(classes).toContain('h-4');
    expect(classes).toContain('w-6');
  });

  it('should combine all size classes correctly for medium', () => {
    render(<Flag team="Brasil" size="medium" />);
    const img = screen.getByAltText('Brasil');
    const classes = img.className;
    expect(classes).toContain('inline-block');
    expect(classes).toContain('rounded-sm');
    expect(classes).toContain('object-cover');
    expect(classes).toContain('mr-2');
    expect(classes).toContain('h-6');
    expect(classes).toContain('w-9');
  });

  it('should combine all size classes correctly for large', () => {
    render(<Flag team="Brasil" size="large" />);
    const img = screen.getByAltText('Brasil');
    const classes = img.className;
    expect(classes).toContain('inline-block');
    expect(classes).toContain('rounded-sm');
    expect(classes).toContain('object-cover');
    expect(classes).toContain('mr-2');
    expect(classes).toContain('h-8');
    expect(classes).toContain('w-12');
  });
});
