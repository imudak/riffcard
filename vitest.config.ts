import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@lib/db': path.resolve(__dirname, 'lib/db/src'),
      '@lib/audio': path.resolve(__dirname, 'lib/audio/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'lib/**/tests/**/*.test.ts',
      'app/src/**/*.test.{ts,tsx}',
    ],
  },
});
