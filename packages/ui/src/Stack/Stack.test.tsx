import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Inline, Stack } from './Stack';

describe('Stack and Inline', () => {
  it('applies the gap class and defaults to gap 4', () => {
    render(<Stack data-testid="a" gap={6} />);
    render(<Stack data-testid="b" />);
    expect(screen.getByTestId('a')).toHaveClass('stack', 'gap-6');
    expect(screen.getByTestId('b')).toHaveClass('gap-4');
  });

  it('renders Inline as a wrapping row and honours as', () => {
    render(<Inline as="ul" data-testid="c" gap={2} className="extra" />);
    const el = screen.getByTestId('c');
    expect(el.tagName).toBe('UL');
    expect(el).toHaveClass('inline', 'gap-2', 'extra');
  });

  it('never uses inline px styles', () => {
    render(<Stack data-testid="d" gap={8} />);
    expect(screen.getByTestId('d')).not.toHaveAttribute('style');
  });
});
