import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/**/*.js'
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/manual/**'
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      },
      all: true
    },
    include: [
      'tests/**/*.test.js'
    ],
    exclude: [
      'node_modules/**',
      'tests/manual/**',
      'dist/**'
    ]
  }
});
