import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
    rollupOptions: { external: [/^react($|\/)/, /^react-dom($|\/)/, /^@radix-ui\//] },
    cssCodeSplit: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setup.ts'],
    css: { include: /\.module\.css$/, modules: { classNameStrategy: 'non-scoped' } },
  },
});
