import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/core/index.ts', 'src/core/internals/*.ts', 'src/integrations/*.ts'],
	format: ['esm'],
	target: 'esnext',
	clean: true,
	sourcemap: true,
	dts: true,
	external: ['vite'],
});
