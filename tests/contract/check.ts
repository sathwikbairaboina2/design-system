import { REMOTES, SHARED, type RemoteName } from '@ds/federation-contract';
import semver from 'semver';

export interface Manifest {
  name: string;
  exposes: Array<{ name?: string; path: string }>;
  shared: Array<{ name: string; version?: string; singleton?: boolean; requiredVersion?: string }>;
}

/** Returns human-readable problems; an empty array means the built remote honours the contract. */
export function checkManifest(manifest: Manifest, remote: RemoteName, hostVersions: Record<string, string>): string[] {
  const problems: string[] = [];

  if (manifest.name !== remote) problems.push(`name: expected "${remote}", got "${manifest.name}"`);

  const have = new Set(manifest.exposes.map((e) => e.path));
  const want = new Set<string>(REMOTES[remote].exposes);
  const missing = [...want].filter((p) => !have.has(p));
  const extra = [...have].filter((p) => !want.has(p));
  if (missing.length > 0 || extra.length > 0) {
    problems.push(`exposes: missing [${missing.join(', ')}], unexpected [${extra.join(', ')}]`);
  }

  for (const [pkg, config] of Object.entries(SHARED)) {
    const entry = manifest.shared.find((s) => s.name === pkg);
    if (!entry) {
      problems.push(`shared ${pkg}: missing from manifest`);
      continue;
    }
    if (entry.singleton !== true) problems.push(`shared ${pkg}: singleton must be true`);
    const required = entry.requiredVersion ?? config.requiredVersion;
    const installed = hostVersions[pkg];
    if (installed === undefined) {
      problems.push(`shared ${pkg}: host version unknown`);
    } else if (!semver.satisfies(installed, required)) {
      problems.push(`shared ${pkg}: requiredVersion ${required} is not satisfied by host ${installed}`);
    }
  }
  return problems;
}
