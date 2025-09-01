import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
    plugins: [svelte(), devtoolsJson()],

    server: {
        proxy: {
            '/ws': {
                target: 'ws://localhost:3000',
                ws: true,
                changeOrigin: true
            },
            '/login': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/logout': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
})
