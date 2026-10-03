# ADR 0008: Exact contract versions, checked at build time and before mount

Date: 2026-10-04 · Status: accepted

## Decision
`@ds/federation-contract` exports `CONTRACT_VERSION = 1`, the expected exposes per remote and the shared singleton
list. Each remote exposes `./contract`. There are two checks:
1. Build time: `tests/contract` reads every built `dist/mf-manifest.json` and fails if the exposes differ from the
   contract, a shared package is not a singleton, or its `requiredVersion` does not satisfy the version installed in the host.
2. Runtime: the shell's `loadRemoteSafely()` races the load against `timeoutMs`, loads `<remote>/contract` first,
   and throws `ContractMismatchError` unless the version equals the host's. The route's error boundary renders an
   `EmptyState` with a retry button. A half-compatible remote is never mounted.

## What I gave up
- **Additive, minor-compatible contracts.** Any contract change is a coordinated bump of host and remotes.
- **Cancelling a stalled fetch.** The timeout stops waiting, but the browser may still finish downloading the entry.
- **Prop-level runtime checks.** Prop types are checked by TypeScript at build time only.
