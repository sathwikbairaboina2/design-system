import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractMismatchError, loadRemoteSafely, RemoteLoadError, RemoteTimeoutError } from '../src/index';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const Component = () => null;

describe('loadRemoteSafely', () => {
  it('returns the default export and loads contract before module', async () => {
    const calls: string[] = [];
    const load = vi.fn(async (id: string) => {
      calls.push(id);
      return id.endsWith('/contract') ? { CONTRACT_VERSION: 1 } : { default: Component };
    });
    const result = await loadRemoteSafely({ remote: 'billing', module: 'BillingPage', timeoutMs: 1000, expectedContract: 1, load });
    expect(result).toBe(Component);
    expect(calls).toEqual(['billing/contract', 'billing/BillingPage']);
  });

  it('returns the module itself when it has no default export', async () => {
    const mod = { Named: Component };
    const load = async (id: string) => (id.endsWith('/contract') ? { CONTRACT_VERSION: 1 } : mod);
    const result = await loadRemoteSafely({ remote: 'billing', module: 'X', timeoutMs: 1000, expectedContract: 1, load });
    expect(result).toBe(mod);
  });

  it('rejects an incompatible contract without loading the module', async () => {
    const load = vi.fn(async () => ({ CONTRACT_VERSION: 2 }));
    const promise = loadRemoteSafely({ remote: 'catalog', module: 'CatalogPage', timeoutMs: 1000, expectedContract: 1, load });
    await expect(promise).rejects.toBeInstanceOf(ContractMismatchError);
    await expect(promise).rejects.toMatchObject({
      remote: 'catalog',
      expected: 1,
      actual: 2,
      message: 'catalog: contract 2 is incompatible with host contract 1',
    });
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith('catalog/contract');
  });

  it('wraps loader failures in RemoteLoadError with the cause', async () => {
    const boom = new Error('Failed to get manifest');
    const load = async () => {
      throw boom;
    };
    const promise = loadRemoteSafely({ remote: 'billing', module: 'BillingPage', timeoutMs: 1000, expectedContract: 1, load });
    await expect(promise).rejects.toBeInstanceOf(RemoteLoadError);
    await expect(promise).rejects.toMatchObject({ remote: 'billing', cause: boom });
  });

  it('treats a null module as a load error', async () => {
    const load = async (id: string) => (id.endsWith('/contract') ? { CONTRACT_VERSION: 1 } : null);
    await expect(
      loadRemoteSafely({ remote: 'billing', module: 'BillingPage', timeoutMs: 1000, expectedContract: 1, load }),
    ).rejects.toBeInstanceOf(RemoteLoadError);
  });

  it('times out at timeoutMs while the loader is still pending, and not before', async () => {
    const load = () => new Promise<never>(() => {});
    let settled: unknown = 'pending';
    const promise = loadRemoteSafely({ remote: 'catalog', module: 'CatalogPage', timeoutMs: 1500, expectedContract: 1, load });
    promise.catch((e) => {
      settled = e;
    });
    await vi.advanceTimersByTimeAsync(1499);
    expect(settled).toBe('pending');
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBeInstanceOf(RemoteTimeoutError);
    expect((settled as RemoteTimeoutError).message).toBe('catalog: did not load within 1500 ms');
  });

  it('clears its timer on success and on failure', async () => {
    const ok = async (id: string) => (id.endsWith('/contract') ? { CONTRACT_VERSION: 1 } : { default: Component });
    await loadRemoteSafely({ remote: 'billing', module: 'BillingPage', timeoutMs: 1000, expectedContract: 1, load: ok });
    expect(vi.getTimerCount()).toBe(0);
    const bad = async () => {
      throw new Error('x');
    };
    await loadRemoteSafely({ remote: 'billing', module: 'BillingPage', timeoutMs: 1000, expectedContract: 1, load: bad }).catch(() => {});
    expect(vi.getTimerCount()).toBe(0);
  });
});
