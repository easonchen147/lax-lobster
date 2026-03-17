import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  base: '/games/lobster/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      phaser3spectorjs: path.resolve(__dirname, 'tests/mocks/phaser3spectorjs.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
