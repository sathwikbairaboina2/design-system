import { mergeRsbuildConfig } from '@rsbuild/core';
import base from './rsbuild.config';

// e2e only: same remote built with CONTRACT_VERSION 2 so the shell must refuse to mount it.
export default mergeRsbuildConfig(base, {
  server: { port: 5443 },
  output: { distPath: { root: 'dist-incompatible' }, assetPrefix: 'http://localhost:5443/' },
  source: { define: { DS_FORCE_CONTRACT: '2' } },
});
