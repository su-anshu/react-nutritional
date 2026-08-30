import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      {
        name: 'api-ai-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url.startsWith('/api/ai/')) {
              return next()
            }

            const urlPath = req.url.split('?')[0]

            // Helper to parse JSON body
            let body = {}
            if (req.method === 'POST') {
              try {
                const chunks = []
                for await (const chunk of req) {
                  chunks.push(chunk)
                }
                const buffer = Buffer.concat(chunks).toString()
                if (buffer) {
                  body = JSON.parse(buffer)
                }
              } catch (e) {
                console.error('Error parsing JSON body in dev server:', e)
              }
            }

            // Express/Vercel response compatibility
            const responseObj = {
              status(code) {
                res.statusCode = code
                return this
              },
              json(data) {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(data))
              },
            }

            const requestObj = {
              method: req.method,
              url: req.url,
              headers: req.headers,
              body,
            }

            try {
              if (urlPath === '/api/ai/models') {
                const { default: modelsHandler } = await import('./api/ai/models.js')
                return modelsHandler(requestObj, responseObj)
              } else if (urlPath === '/api/ai/test') {
                const { default: testHandler } = await import('./api/ai/test.js')
                return testHandler(requestObj, responseObj)
              } else if (urlPath === '/api/ai/research') {
                const { default: researchHandler } = await import('./api/ai/research.js')
                return researchHandler(requestObj, responseObj)
              } else {
                return responseObj.status(404).json({ error: 'Endpoint not found' })
              }
            } catch (err) {
              console.error('Dev server API handler error:', err)
              return responseObj.status(500).json({ error: err.message || 'Internal server error' })
            }
          })
        },
      },
    ],
  }
})
