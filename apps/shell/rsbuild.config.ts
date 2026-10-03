import { SHARED } from '@ds/federation-contract';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  server: { port: 5440, strictPort: true, historyApiFallback: true },
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'shell',
      remotes: {},
      shared: { ...SHARED },
      dts: false,
    }),
  ],
});
