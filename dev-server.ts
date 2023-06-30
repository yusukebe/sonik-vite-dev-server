import express from 'express'
import { createServer as createViteServer, build, PluginOption } from 'vite'

import type { Hono } from 'hono'
import { getRequestListener } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { sonikVitePlugin } from 'sonik/vite'

import { fileURLToPath } from 'url'
import { dirname, join, relative, isAbsolute } from 'path'

const buildClient = async () => {
  await build({
    plugins: [sonikVitePlugin()],
    build: {
      outDir: './site/static',
      lib: {
        entry: './app/client.tsx',
        fileName: 'client',
        formats: ['es']
      },
      manifest: true
    }
  })
}

const createServer = async () => {
  const server = express()

  const ssrReloadHook: PluginOption = {
    name: 'ssr-reload-hook',
    handleHotUpdate: async ({ server, file }) => {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)

      const appDirectory = join(__dirname, './app')
      const relativePath = relative(appDirectory, file)
      const isUnderAppDirectory = !relativePath.startsWith('..') && !isAbsolute(relativePath)

      if (!isUnderAppDirectory) {
        return
      }
      await buildClient()
    }
  }

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [sonikVitePlugin(), ssrReloadHook],
    ssr: {
      noExternal: true,
      format: 'esm'
    },
    build: {
      rollupOptions: {
        external: ['__STATIC_CONTENT_MANIFEST', 'preact']
      },
      ssr: './app/server.ts'
    }
  })

  server.use(vite.middlewares)

  server.use('*', async (req, res) => {
    const { app } = (await vite.ssrLoadModule('/app/app.ts')) as { app: Hono }

    app.use('/static/*', serveStatic({ root: './site/' }))

    req.url = req.originalUrl
    getRequestListener(app.fetch)(req, res)
  })

  await buildClient()

  server.listen(5173, () => {
    console.log('http://localhost:5173')
  })
}

createServer()
