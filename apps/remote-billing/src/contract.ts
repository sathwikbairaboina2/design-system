import { CONTRACT_VERSION as HOST } from '@ds/federation-contract';

// Replaced at build time; the incompatible e2e build forces a different version.
declare const DS_FORCE_CONTRACT: number | undefined;

export const CONTRACT_VERSION: number = DS_FORCE_CONTRACT ?? HOST;
