import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [svelte()],
	build: {
		lib: {
			entry: resolve(import.meta.dirname, 'src/lib/index.ts'),
			formats: ['es'],
			fileName: 'index',
			cssFileName: 'styles'
		},
		rollupOptions: {
			external: (id) => id === 'svelte' || id.startsWith('svelte/')
		}
	}
});
