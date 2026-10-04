import { CONTRACT_VERSION, REMOTES, type RemoteName } from '@ds/federation-contract';

export interface RemoteEntry {
  entry: string;
  contract: number;
  timeoutMs: number;
}

export type Registry = Record<RemoteName, RemoteEntry>;

export function parseRegistry(json: unknown): Registry {
  if (typeof json !== 'object' || json === null) throw new Error('remotes.json: expected an object');
  const out: Partial<Registry> = {};
  for (const name of Object.keys(REMOTES) as RemoteName[]) {
    const raw = (json as Record<string, unknown>)[name];
    if (typeof raw !== 'object' || raw === null) throw new Error(`remotes.json: missing remote "${name}"`);
    const { entry, contract, timeoutMs } = raw as Record<string, unknown>;
    if (typeof entry !== 'string' || !/^https?:\/\//.test(entry)) {
      throw new Error(`remotes.json: ${name}.entry must be an http(s) URL`);
    }
    if (typeof contract !== 'number' || !Number.isInteger(contract)) {
      throw new Error(`remotes.json: ${name}.contract must be an integer`);
    }
    if (contract !== CONTRACT_VERSION) {
      throw new Error(`remotes.json: ${name}.contract ${contract} does not match the host contract ${CONTRACT_VERSION}`);
    }
    if (typeof timeoutMs !== 'number' || !(timeoutMs > 0)) {
      throw new Error(`remotes.json: ${name}.timeoutMs must be a positive number`);
    }
    out[name] = { entry, contract, timeoutMs };
  }
  return out as Registry;
}
