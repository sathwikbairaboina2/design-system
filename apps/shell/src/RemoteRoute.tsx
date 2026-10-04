import { ContractMismatchError, loadRemoteSafely, RemoteTimeoutError } from '@ds/federation-contract';
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

/** Short, user-facing copy. The raw reason stays in the console and in `data-reason`. */
function friendlyMessage(error: unknown): string {
  if (error instanceof RemoteTimeoutError) return `It took longer than ${+(error.timeoutMs / 1000).toFixed(2)} s to load.`;
  if (error instanceof ContractMismatchError) return 'This version is not compatible with the shell.';
  return 'It could not be reached.';
}

function Fallback({ remote, entry, title, error, retry }: FallbackProps) {
  const reason = error instanceof Error ? error.message : String(error);
  useEffect(() => {
    performance.mark(`mf:${remote}:fallback`);
    setRemoteStatus(remote, 'failed');
    console.error(`[mf] remote=${remote} entry=${entry.entry} reason=${reason}`);
  }, [remote, entry.entry, reason]);
  return (
    <div data-testid={`${remote}-fallback`} data-reason={reason}>
      <EmptyState title={title} description={friendlyMessage(error)} action={<Button onClick={retry}>Retry</Button>} />
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
          expectedContract: entry.contract,
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
      key={`${remote}/${module}/${attempt}`}
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
