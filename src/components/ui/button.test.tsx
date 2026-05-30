import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render button with default text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should render with default variant', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'default');
  });

  it('should render with default size', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'default');
  });

  it('should render different variants', () => {
    const variants = ['outline', 'secondary', 'ghost', 'destructive', 'link'];
    variants.forEach((variant) => {
      const { unmount } = render(
        <Button variant={variant as any}>Test</Button>
      );
      expect(screen.getByRole('button')).toHaveAttribute(
        'data-variant',
        variant
      );
      unmount();
    });
  });

  it('should render different sizes', () => {
    const sizes = ['xs', 'sm', 'default', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'];
    sizes.forEach((size) => {
      const { unmount } = render(<Button size={size as any}>Test</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('data-size', size);
      unmount();
    });
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');
    button.click();
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should not trigger click when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    const button = screen.getByRole('button');
    button.click();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Test</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should have data-slot attribute', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button');
  });

  it('should combine variant and size correctly', () => {
    render(
      <Button variant="outline" size="lg">
        Test
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('should render children correctly', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });
});
