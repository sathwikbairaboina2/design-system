import { useSyncExternalStore } from 'react';

export type RemoteStatus = 'loading' | 'loaded' | 'failed';

let snapshot: Record<string, RemoteStatus> = {};
const listeners = new Set<() => void>();

export function setRemoteStatus(remote: string, status: RemoteStatus): void {
  if (snapshot[remote] === status) return;
  snapshot = { ...snapshot, [remote]: status };
  listeners.forEach((l) => l());
}

export function useRemoteStatuses(): Record<string, RemoteStatus> {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot,
    () => snapshot,
  );
}
