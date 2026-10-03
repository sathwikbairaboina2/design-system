import { CONTRACT_VERSION, loadRemoteSafely } from '@ds/federation-contract';
import { loadRemote } from '@module-federation/enhanced/runtime';
import { Button, EmptyState } from '@sathwik/ui';
import { Component, lazy, Suspense, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import type { RemoteEntry } from './registry';
import { setRemoteStatus } from './status';

export interface RemoteRouteProps {
  remote: string;
  module: string;
  entry: RemoteEntry;
  props?: Record<string, unknown>;
  fallbackTitle: string;
  /** Loads a federated module by id; defaults to the Module Federation runtime. */
  load?: (id: string) => Promise<unknown>;
}

const defaultLoad = (id: string): Promise<unknown> => loadRemote(id);

interface FallbackProps {
  remote: string;
  entry: RemoteEntry;
  title: string;
  error: unknown;
  retry: () => void;
}

function Fallback({ remote, entry, title, error, retry }: FallbackProps) {
  const reason = error instanceof Error ? error.message : String(error);
  useEffect(() => {
    performance.mark(`mf:${remote}:fallback`);
    setRemoteStatus(remote, 'failed');
    console.error(`[mf] remote=${remote} entry=${entry.entry} reason=${reason}`);
  }, [remote, entry.entry, reason]);
  return (
    <div data-testid={`${remote}-fallback`}>
      <EmptyState title={title} description={reason} action={<Button onClick={retry}>Retry</Button>} />
    </div>
  );
}

class Boundary extends Component<{ children: ReactNode; render: (error: unknown) => ReactNode }, { error: unknown; failed: boolean }> {
  state = { error: undefined as unknown, failed: false };
  static getDerivedStateFromError(error: unknown) {
    return { error, failed: true };
  }
  render() {
    return this.state.failed ? this.props.render(this.state.error) : this.props.children;
  }
}

export function RemoteRoute({ remote, module, entry, props, fallbackTitle, load = defaultLoad }: RemoteRouteProps) {
  const [attempt, setAttempt] = useState(0);
  const Remote = useMemo(
    () =>
      lazy(async () => {
        performance.mark(`mf:${remote}:start`);
        setRemoteStatus(remote, 'loading');
        const component = await loadRemoteSafely<ComponentType<Record<string, unknown>>>({
          remote,
          module,
          timeoutMs: entry.timeoutMs,
          expectedContract: CONTRACT_VERSION,
          load,
        });
        setRemoteStatus(remote, 'loaded');
        return { default: component };
      }),
    // `attempt` is the retry key: a new lazy component forces a fresh load.
    [remote, module, entry.timeoutMs, load, attempt],
  );
  return (
    <Boundary
      key={attempt}
      render={(error) => (
        <Fallback remote={remote} entry={entry} title={fallbackTitle} error={error} retry={() => setAttempt((a) => a + 1)} />
      )}
    >
      <Suspense fallback={<p>Loading {remote}...</p>}>
        <Remote {...props} />
      </Suspense>
    </Boundary>
  );
}
