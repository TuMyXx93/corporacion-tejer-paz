import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      include: [
        'src/lib/auth/origins.ts',
        'src/lib/auth/permissions.ts',
        'src/lib/auth/guards.ts',
        'src/lib/cms/schemas.ts',
        'src/lib/contact/schema.ts',
        'src/lib/media/embeds.ts',
        'src/lib/security/rateLimiter.ts',
        'src/lib/storage/index.ts',
        'src/app/api/contact/route.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
