import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { SHARED } from '@ds/federation-contract';

const shellPackage = join(import.meta.dirname, '../../apps/shell/package.json');

/** Installed versions of the shared packages, resolved the way the shell resolves them. */
export function hostVersions(): Record<string, string> {
  const require = createRequire(shellPackage);
  const out: Record<string, string> = {};
  for (const pkg of Object.keys(SHARED)) {
    // Some packages do not export ./package.json, so walk up from the resolved entry.
    let dir = dirname(require.resolve(pkg));
    while (!existsSync(join(dir, 'package.json')) || JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).name !== pkg) {
      const parent = dirname(dir);
      if (parent === dir) throw new Error(`cannot find package.json for ${pkg}`);
      dir = parent;
    }
    out[pkg] = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;
  }
  return out;
}
