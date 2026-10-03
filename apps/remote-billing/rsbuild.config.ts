import { SHARED } from '@ds/federation-contract';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const PORT = 5441;

export default defineConfig({
  server: { port: PORT, strictPort: true, cors: true },
  output: { assetPrefix: process.env.DS_BILLING_PUBLIC_URL ?? `http://localhost:${PORT}/` },
  source: { define: { DS_FORCE_CONTRACT: 'undefined' } },
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'billing',
      filename: 'remoteEntry.js',
      manifest: true,
      dts: false,
      exposes: {
        './BillingPage': './src/BillingPage.tsx',
        './InvoiceWidget': './src/InvoiceWidget.tsx',
        './contract': './src/contract.ts',
      },
      shared: { ...SHARED },
    }),
  ],
});
