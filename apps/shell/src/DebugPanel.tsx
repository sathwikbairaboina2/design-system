import { Card, Stack, UI_INSTANCE_ID } from '@sathwik/ui';
import { useEffect, useState } from 'react';
import type { Registry } from './registry';
import { useRemoteStatuses } from './status';

interface ShareEntry {
  loaded?: boolean;
}
type ShareScope = Record<string, Record<string, ShareEntry>>;

function readShareScope(): ShareScope {
  const fed = (
    globalThis as unknown as { __FEDERATION__?: { __INSTANCES__?: Array<{ shareScopeMap?: { default?: ShareScope } }> } }
  ).__FEDERATION__;
  return fed?.__INSTANCES__?.[0]?.shareScopeMap?.default ?? {};
}

/** Shown at `?mf-debug=1`: what the host registered and which shared versions were really loaded. */
export function DebugPanel({ registry }: { registry: Registry }) {
  const statuses = useRemoteStatuses();
  const [shared, setShared] = useState<ShareScope>(readShareScope);
  useEffect(() => {
    const id = setInterval(() => setShared(readShareScope()), 250);
    return () => clearInterval(id);
  }, []);
  return (
    <div data-testid="mf-debug" className="debug">
      <Card title="Module Federation debug" headingLevel={2}>
        <Stack gap={4}>
          <p>
            Shell @sathwik/ui instance: <code>{UI_INSTANCE_ID}</code>
          </p>
          <table>
            <caption>Remotes</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Entry</th>
                <th scope="col">Status</th>
                <th scope="col">Contract</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(registry).map(([name, r]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{r.entry}</td>
                  <td>{statuses[name] ?? 'idle'}</td>
                  <td>{r.contract}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <caption>Shared packages</caption>
            <thead>
              <tr>
                <th scope="col">Package</th>
                <th scope="col">Versions</th>
                <th scope="col">Loaded</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(shared).map(([pkg, versions]) => {
                const loaded = Object.entries(versions).filter(([, v]) => v.loaded);
                return (
                  <tr key={pkg} data-testid={`shared-${pkg}`} data-loaded-count={loaded.length}>
                    <td>{pkg}</td>
                    <td>{Object.keys(versions).join(', ')}</td>
                    <td>{loaded.map(([v]) => v).join(', ') || 'none'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Stack>
      </Card>
    </div>
  );
}
