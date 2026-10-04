import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('forwards a ref to the element', () => {
    const ref = createRef<HTMLElement>();
    render(<Card ref={ref} title="Plan">body</Card>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('SECTION');
  });

  it('renders a section by default with an h2 title', () => {
    render(<Card title="Plan">body</Card>);
    expect(screen.getByRole('heading', { level: 2, name: 'Plan' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Plan' })).toBeInTheDocument();
  });

  it('honours headingLevel', () => {
    render(
      <Card title="Plan" headingLevel={3}>
        body
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Plan' })).toBeInTheDocument();
  });

  it('renders without a title and supports as', () => {
    render(
      <Card as="article" data-testid="c">
        body
      </Card>,
    );
    expect(screen.getByTestId('c').tagName).toBe('ARTICLE');
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
