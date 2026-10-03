import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkManifest, type Manifest } from './check';
import { hostVersions } from './hostVersions';

const read = (path: string): Manifest => JSON.parse(readFileSync(path, 'utf8'));

function builtManifest(remote: 'billing' | 'catalog'): Manifest {
  const path = join(import.meta.dirname, `../../apps/remote-${remote}/dist/mf-manifest.json`);
  if (!existsSync(path)) throw new Error(`missing ${path}: run pnpm build first`);
  return read(path);
}

describe('built remotes honour the federation contract', () => {
  const versions = hostVersions();

  it('resolves real host versions', () => {
    expect(versions.react).toMatch(/^19\./);
    expect(versions['react-dom']).toMatch(/^19\./);
    expect(versions['@sathwik/ui']).toBe('0.1.0');
  });

  for (const remote of ['billing', 'catalog'] as const) {
    it(`${remote}: zero problems`, () => {
      expect(checkManifest(builtManifest(remote), remote, versions)).toEqual([]);
    });
  }

  it('catches a doctored manifest: missing expose and non-singleton react', () => {
    const bad = read(join(import.meta.dirname, 'fixtures/bad-manifest.json'));
    const problems = checkManifest(bad, 'billing', versions);
    expect(problems).toHaveLength(2);
    expect(problems.join('\n')).toMatch(/exposes: missing \[\.\/InvoiceWidget\]/);
    expect(problems.join('\n')).toMatch(/shared react: singleton must be true/);
  });

  it('flags a host whose React does not satisfy the required range', () => {
    const problems = checkManifest(builtManifest('billing'), 'billing', { ...versions, react: '18.3.1' });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/shared react: requiredVersion \^19\.0\.0 is not satisfied by host 18\.3\.1/);
  });

  it('flags a manifest published under the wrong remote name', () => {
    const problems = checkManifest(builtManifest('billing'), 'catalog', versions);
    expect(problems.some((p) => p.startsWith('name:'))).toBe(true);
    expect(problems.some((p) => p.startsWith('exposes:'))).toBe(true);
  });
});
