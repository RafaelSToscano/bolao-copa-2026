import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('should render input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('data-slot', 'input');
  });

  it('should render with default type text', () => {
    render(<Input />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.type).toBe('text');
  });

  it('should accept different input types', () => {
    const types = ['email', 'password', 'number', 'tel', 'url', 'date'];
    types.forEach((type) => {
      const { unmount } = render(<Input type={type} />);
      const input = screen.getByDisplayValue('') as HTMLInputElement;
      expect(input.type).toBe(type);
      unmount();
    });
  });

  it('should accept placeholder text', () => {
    render(<Input placeholder="Enter text..." />);
    const input = screen.getByPlaceholderText('Enter text...');
    expect(input).toBeInTheDocument();
  });

  it('should accept value prop', () => {
    render(<Input value="test value" onChange={() => {}} />);
    const input = screen.getByDisplayValue('test value') as HTMLInputElement;
    expect(input.value).toBe('test value');
  });

  it('should handle value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'hello');
    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should accept custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-class');
  });

  it('should support aria-invalid for error state', () => {
    render(<Input aria-invalid="true" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should handle blur events', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();
    render(<Input onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    await user.tab();
    expect(handleBlur).toHaveBeenCalled();
  });

  it('should handle focus events', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();
    render(<Input onFocus={handleFocus} />);
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalled();
  });

  it('should be readonly when readonly prop is true', () => {
    render(<Input readOnly value="test" />);
    const input = screen.getByDisplayValue('test') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });

  it('should accept required attribute', () => {
    render(<Input required />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });
});
