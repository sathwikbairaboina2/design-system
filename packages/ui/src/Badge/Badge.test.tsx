import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('defaults to the neutral tone', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toHaveClass('badge', 'neutral');
  });

  it.each(['neutral', 'accent', 'danger', 'success'] as const)('applies the %s tone class', (tone) => {
    render(<Badge tone={tone}>{tone}</Badge>);
    expect(screen.getByText(tone)).toHaveClass(tone);
  });
});
