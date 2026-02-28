import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli/index.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist/cli',
  clean: true,
  sourcemap: true,
  // shebang handled by bin wrapper
  splitting: false,
  bundle: true,
  external: ['@anthropic-ai/sdk'],
});
