import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

/** Local /api/edit-hair mirror so `npm run dev` works without `vercel dev`. */
function editHairDevApi() {
  return {
    name: 'edit-hair-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/edit-hair', async (req, res, next) => {
        const origin = req.headers.origin || 'http://localhost:5173'
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        res.setHeader('Vary', 'Origin')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const raw = Buffer.concat(chunks).toString('utf8')
          const payload = raw ? JSON.parse(raw) : {}
          const env = loadEnv(server.config.mode, process.cwd(), '')
          const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
          const { runEditHair } = await import('./api/edit-hair.js')
          const result = await runEditHair(payload, { apiKey })
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(result))
        } catch (error) {
          const status = error?.statusCode || error?.status || 500
          res.statusCode = status >= 400 && status < 600 ? status : 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: error?.message || 'Hair edit failed' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), editHairDevApi()],
  root: resolve(__dirname, '.'),
  server: {
    host: true,
    port: 5173,
    strictPort: true,
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
