import type { ComponentType } from 'react';

export const CONTRACT_VERSION = 1;

export const REMOTES = {
  billing: { exposes: ['./BillingPage', './InvoiceWidget', './contract'] },
  catalog: { exposes: ['./CatalogPage', './ProductPicker', './contract'] },
} as const;
export type RemoteName = keyof typeof REMOTES;

export const SHARED = {
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  '@sathwik/ui': { singleton: true, requiredVersion: '^0.1.0' },
} as const;

export interface BillingRemote {
  BillingPage: ComponentType<{ accountId: string }>;
  InvoiceWidget: ComponentType<{ invoiceId: string; compact?: boolean }>;
}

export interface CatalogRemote {
  CatalogPage: ComponentType<Record<string, never>>;
  ProductPicker: ComponentType<{ onSelect(id: string): void }>;
}

export * from './load.js';
