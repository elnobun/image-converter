import { defineConfig } from 'vite';

export default defineConfig({
	root: './docs', // Set the root to the directory containing index.html


	build: {
		target: "esnext", // Use modern JavaScript
	},
	optimizeDeps: {
		esbuildOptions: {
			target: "esnext", // Ensure dependencies are optimized with ESNext features
		},
	},

});
