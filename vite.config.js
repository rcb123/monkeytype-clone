import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$root: path.resolve('./src'),
			$components: path.resolve('./src/components'),
			$static: path.resolve('./src/static'),
		}
	}
};

export default config;
