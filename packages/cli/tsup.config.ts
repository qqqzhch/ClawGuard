import { defineConfig } from 'tsup';
import { builtinModules } from 'module';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'es2022',
  platform: 'node',
  shims: true,
  outExtension: () => ({ js: '.mjs' }),
  external: [...builtinModules, ...builtinModules.map(m => `node:${m}`), 'pino', 'pino-pretty'],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});
