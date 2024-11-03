import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { purgeCss } from 'vite-plugin-tailwind-purgecss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte(), purgeCss()],
	css: {
		postcss: {
			plugins: [tailwindcss(), autoprefixer()],
		},
	},
})
