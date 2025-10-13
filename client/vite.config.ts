import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { execSync } from 'child_process';

const commitHash = execSync('git rev-parse --short HEAD').toString();

// https://vite.dev/config/
export default defineConfig({
    plugins: [svelte(), devtoolsJson()],
    
    define: {
        '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
        '__GIT_COMMIT_HASH__': JSON.stringify(commitHash.trim())
    },

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
