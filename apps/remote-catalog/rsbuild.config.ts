import { SHARED } from '@ds/federation-contract';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const PORT = 5442;

export default defineConfig({
  server: { port: PORT, strictPort: true, cors: true },
  output: { assetPrefix: process.env.DS_CATALOG_PUBLIC_URL ?? `http://localhost:${PORT}/` },
  source: { define: { DS_FORCE_CONTRACT: 'undefined' } },
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'catalog',
      filename: 'remoteEntry.js',
      manifest: true,
      dts: false,
      exposes: {
        './CatalogPage': './src/CatalogPage.tsx',
        './ProductPicker': './src/ProductPicker.tsx',
        './contract': './src/contract.ts',
      },
      shared: { ...SHARED },
    }),
  ],
});
