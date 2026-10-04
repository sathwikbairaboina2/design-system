import { describe, expect, it } from 'vitest';
import { CONTRACT_VERSION } from '@ds/federation-contract';
import { parseRegistry } from './registry';

const good = {
  billing: { entry: 'http://localhost:5441/mf-manifest.json', contract: 1, timeoutMs: 5000 },
  catalog: { entry: 'https://example.com/mf-manifest.json', contract: 1, timeoutMs: 1500 },
};

describe('parseRegistry', () => {
  it('accepts a valid registry', () => {
    expect(parseRegistry(good).catalog.timeoutMs).toBe(1500);
  });

  it('throws on a missing remote', () => {
    expect(() => parseRegistry({ billing: good.billing })).toThrow(/missing remote "catalog"/);
  });

  it('throws on a non-http entry', () => {
    expect(() => parseRegistry({ ...good, billing: { ...good.billing, entry: 'file:///x' } })).toThrow(/billing\.entry/);
  });

  it('throws on a non-positive timeout', () => {
    expect(() => parseRegistry({ ...good, billing: { ...good.billing, timeoutMs: 0 } })).toThrow(/billing\.timeoutMs/);
  });

  it('throws when the registry contract differs from the host contract', () => {
    expect(() => parseRegistry({ ...good, catalog: { ...good.catalog, contract: CONTRACT_VERSION + 1 } })).toThrow(/catalog\.contract/);
  });

  it('throws on a non-integer contract', () => {
    expect(() => parseRegistry({ ...good, catalog: { ...good.catalog, contract: 1.5 } })).toThrow(/catalog\.contract/);
  });

  it('throws when the document is not an object', () => {
    expect(() => parseRegistry(null)).toThrow(/expected an object/);
  });
});
