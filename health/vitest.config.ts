import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  define: {
    'process.env': process.env,
  },
  esbuild: {
    target: 'node14',
  },
  optimizeDeps: {
    exclude: ['next-auth'],
  },
})
