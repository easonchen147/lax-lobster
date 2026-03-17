import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/__vitest_smoke__.test.ts'],
    testTimeout: 5000,
    hookTimeout: 5000,
  },
});
