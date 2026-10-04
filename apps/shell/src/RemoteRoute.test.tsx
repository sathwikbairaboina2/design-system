import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoteRoute } from './RemoteRoute';

const entry = { entry: 'http://localhost:5442/mf-manifest.json', contract: 1, timeoutMs: 1000 };
const Page = () => <p>remote page</p>;

function makeLoad(contract: number) {
  return vi.fn(async (id: string) => (id.endsWith('/contract') ? { CONTRACT_VERSION: contract } : { default: Page }));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('RemoteRoute', () => {
  it('shows short copy on a timeout and keeps the reason out of the text', async () => {
    const never = vi.fn(() => new Promise<unknown>(() => {}));
    render(<RemoteRoute remote="catalog" module="CatalogPage" entry={{ ...entry, timeoutMs: 100 }} fallbackTitle="Catalog is unavailable" load={never} />);
    const fallback = await screen.findByTestId('catalog-fallback');
    expect(fallback).toHaveTextContent('It took longer than 0.1 s to load.');
    expect(fallback).toHaveAttribute('data-reason', expect.stringContaining('did not load within 100 ms'));
  });

  it('renders the remote module on success', async () => {
    render(<RemoteRoute remote="catalog" module="CatalogPage" entry={entry} fallbackTitle="Catalog is unavailable" load={makeLoad(1)} />);
    expect(await screen.findByText('remote page')).toBeInTheDocument();
    expect(screen.queryByTestId('catalog-fallback')).toBeNull();
  });

  it('renders the fallback with the reason on a contract mismatch', async () => {
    render(<RemoteRoute remote="catalog" module="CatalogPage" entry={entry} fallbackTitle="Catalog is unavailable" load={makeLoad(2)} />);
    const fallback = await screen.findByTestId('catalog-fallback');
    expect(fallback).toHaveTextContent('Catalog is unavailable');
    expect(fallback).toHaveTextContent('This version is not compatible with the shell.');
    expect(fallback).not.toHaveTextContent('contract 2');
    expect(fallback).toHaveAttribute('data-reason', expect.stringContaining('contract 2 is incompatible with host contract 1'));
    expect(screen.queryByText('remote page')).toBeNull();
  });

  it('Retry loads again and then renders the module', async () => {
    const user = userEvent.setup();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failed to get manifest'))
      .mockImplementation(async (id: string) => (id.endsWith('/contract') ? { CONTRACT_VERSION: 1 } : { default: Page }));
    render(<RemoteRoute remote="catalog" module="CatalogPage" entry={entry} fallbackTitle="Catalog is unavailable" load={load} />);
    const first = await screen.findByTestId('catalog-fallback');
    expect(first).toHaveTextContent('It could not be reached.');
    expect(first).not.toHaveTextContent('Failed to get manifest');
    expect(first).toHaveAttribute('data-reason', expect.stringContaining('Failed to get manifest'));
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('remote page')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('does not carry a failure over when the same slot switches to another remote', async () => {
    const bad = makeLoad(2);
    const good = makeLoad(1);
    const { rerender } = render(<RemoteRoute remote="catalog" module="CatalogPage" entry={entry} fallbackTitle="Catalog is unavailable" load={bad} />);
    await screen.findByTestId('catalog-fallback');
    rerender(<RemoteRoute remote="billing" module="BillingPage" entry={entry} fallbackTitle="Billing is unavailable" load={good} />);
    expect(await screen.findByText('remote page')).toBeInTheDocument();
    expect(screen.queryByTestId('billing-fallback')).toBeNull();
    expect(screen.queryByTestId('catalog-fallback')).toBeNull();
  });

  it('marks start and fallback so the latency can be measured', async () => {
    const marks: string[] = [];
    const mark = vi.spyOn(performance, 'mark').mockImplementation((name: string) => {
      marks.push(name);
      return {} as PerformanceMark;
    });
    render(<RemoteRoute remote="catalog" module="CatalogPage" entry={entry} fallbackTitle="x" load={makeLoad(2)} />);
    await screen.findByTestId('catalog-fallback');
    expect(marks).toEqual(['mf:catalog:start', 'mf:catalog:fallback']);
    mark.mockRestore();
  });
});
