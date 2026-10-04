import { execFileSync } from 'node:child_process';

/** The commit under test. Docker has no git history, so scripts/visual.ps1 passes DS_COMMIT in. */
export const commit: string =
  process.env.DS_COMMIT ?? execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
