export class RemoteError extends Error {
  remote: string;
  constructor(remote: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.remote = remote;
  }
}

export class RemoteTimeoutError extends RemoteError {
  timeoutMs: number;
  constructor(remote: string, timeoutMs: number) {
    super(remote, `${remote}: did not load within ${timeoutMs} ms`);
    this.timeoutMs = timeoutMs;
  }
}

export class ContractMismatchError extends RemoteError {
  expected: number;
  actual: unknown;
  constructor(remote: string, expected: number, actual: unknown) {
    super(remote, `${remote}: contract ${String(actual)} is incompatible with host contract ${expected}`);
    this.expected = expected;
    this.actual = actual;
  }
}

export class RemoteLoadError extends RemoteError {
  constructor(remote: string, reason: string, cause?: unknown) {
    super(remote, `${remote}: ${reason}`, { cause });
  }
}

export interface LoadRemoteOptions {
  remote: string;
  module: string;
  timeoutMs: number;
  expectedContract: number;
  /** Loads a federated module by id, e.g. `billing/BillingPage`. */
  load: (id: string) => Promise<unknown>;
}

function reasonOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Loads `<remote>/<module>` only if `<remote>/contract` matches the host contract version.
 * The whole sequence races a timer; failures become typed errors the shell can render.
 */
export async function loadRemoteSafely<T = unknown>(options: LoadRemoteOptions): Promise<T> {
  const { remote, module, timeoutMs, expectedContract, load } = options;

  const run = async (): Promise<T> => {
    try {
      const contract = (await load(`${remote}/contract`)) as { CONTRACT_VERSION?: unknown } | null | undefined;
      if (contract == null) throw new RemoteLoadError(remote, 'contract module is empty');
      if (contract.CONTRACT_VERSION !== expectedContract) {
        throw new ContractMismatchError(remote, expectedContract, contract.CONTRACT_VERSION);
      }
      const mod = (await load(`${remote}/${module}`)) as { default?: T } | null | undefined;
      if (mod == null) throw new RemoteLoadError(remote, `module ${module} is empty`);
      return ('default' in mod && mod.default !== undefined ? mod.default : mod) as T;
    } catch (e) {
      if (e instanceof RemoteError) throw e;
      throw new RemoteLoadError(remote, reasonOf(e), e);
    }
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RemoteTimeoutError(remote, timeoutMs)), timeoutMs);
  });
  try {
    return await Promise.race([run(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
