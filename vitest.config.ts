import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    setupFiles: ['./test/setup.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: ['dist/**', 'examples/**', 'src/react.ts', 'vitest.config.ts', 'test/setup.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    projects: [
      {
        test: {
          name: 'node',
          include: ['test/core/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['./test/setup.ts'],
        },
      },
      {
        test: {
          name: 'react',
          include: ['test/react/**/*.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
        },
      },
    ],
  },
});
