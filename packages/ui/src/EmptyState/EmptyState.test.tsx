import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('is a status region with title and description', () => {
    render(<EmptyState title="Nothing here" description="Add your first item" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Nothing here');
    expect(status).toHaveTextContent('Add your first item');
  });

  it('renders the action', () => {
    render(<EmptyState title="t" description="d" action={<button type="button">Add</button>} />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});
