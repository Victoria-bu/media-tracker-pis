import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: ['verbose', 'json'],
    outputFile: { json: 'logs/vitest-output.json' },
    env: {
      NODE_ENV: 'test',
      BCRYPT_ROUNDS: '1',
    },
  },
});
