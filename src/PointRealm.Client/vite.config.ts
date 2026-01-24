import { defineConfig, loadEnv } from 'vite'

import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5219';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/hubs': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    // @ts-expect-error - vitest types are not automatically picked up by vite define config
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './test/setup.ts',
    }
  }
})
