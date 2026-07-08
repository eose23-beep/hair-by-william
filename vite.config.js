import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, '.'),
  server: {
    watch: {
      ignored: [
        '**/node_modules/**', 
        '**/.git/**', 
        '**/C:/Users/SysMigrator/.bun/**',
        '**/.bun/**',
        'C:/Users/SysMigrator/*',
        'C:\\Users\\SysMigrator\\.bun\\**'
      ],
      usePolling: true,
      interval: 100
    },
    fs: {
      strict: true,
      allow: ['.']
    }
  }
})