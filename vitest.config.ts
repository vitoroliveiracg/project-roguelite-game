import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/typescript/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['typescript/domain/**/*.ts'],
      exclude: [
        'typescript/**/*.d.ts',
        'typescript/**/*.type.ts',
        'typescript/domain/ports/**',
      ],
    },
  },
});