import express from 'express'
import { Config } from '../config.mjs'

const serverPort = process.env.PORT || 4000
const serverHost = process.env.HOST || 'localhost'
const urlFor = (port) => `http://${serverHost}:${port}`
// Default-port URL, used by the runner and isServerRunning(). startServer() may be
// called with a different port; its returned handle carries that port's own url.
export const serverURL = urlFor(serverPort)

export function startServer(port = serverPort) {
  const app = express()

  // The project root; static serving and view resolution are relative to it.
  const cwd = process.cwd()

  // The express.static middleware serves both JavaScripts from /dist
  // and files we send with sendFile().
  app.use(express.static(cwd))
  app.set('views', cwd)
  app.set('view engine', 'ejs')

  app.get('/', (req, res) => {
    res.sendFile(cwd + '/runner/server/menu.html')
  })

  app.get('/specs', (req, res) => {
    const headers = {}

    const config = Config.fromExpressQuery(req.query)

    let cspHeader = config.toCSPHeader()
    if (cspHeader) {
      headers['Content-Security-Policy'] = cspHeader
    }

    res.set(headers).render('runner/server/runner', { config })
  })

  return new Promise((resolve, reject) => {
    // Express wires this callback as *both* the listening callback and the 'error'
    // handler, so without the check a port collision resolved with a handle to a server
    // that was not listening: `bin/test-server` announced itself and exited 0, taking
    // the dev environment down with it, and runCI aimed puppeteer at whatever else held
    // the port and died 30s later with a bare timeout.
    const httpServer = app.listen(port, serverHost, (error) => {
      if (error) {
        reject(error.code === 'EADDRINUSE'
          ? new Error(`Port ${port} is already in use — something else is listening there.`)
          : error)
        return
      }
      resolve({
        stopServer: () => stopServer(httpServer),
        url: urlFor(port),
      })
    })
  })
}

function stopServer(httpServer) {
  return new Promise((resolve) => {
    httpServer.close(() => resolve())
  })
}

export async function isServerRunning() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1000)

    const response = await fetch(serverURL, { signal: controller.signal })
    clearTimeout(timeout)

    return response.ok // true for 2xx responses, false otherwise
  } catch (_err) {
    return false // Network error, timeout, or server not responding
  }
}

