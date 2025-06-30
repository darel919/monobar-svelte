import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		proxy: {
			'/monobar/v2/watch/subtitle': {
				target: 'http://api.server.drl',
				changeOrigin: true,
				secure: false,
			},
		},
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson()
	]
});
