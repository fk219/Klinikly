import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      MONGOMS_STARTUP_TIMEOUT: '120000',
    },
    hookTimeout: 120000,
    testTimeout: 30000,
    fileParallelism: false,
  },
});
