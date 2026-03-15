import { defineConfig } from 'vitest/config';

export default defineConfig({
  include: ['**/*.{test,spec}.*'],
  exclude: ['node_modules'],
  root: './src',
  testMatch: 'files',
  testTimeout: 10000,
  watch: false,
  globals: true,
  environment: 'node',
});
