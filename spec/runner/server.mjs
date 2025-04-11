import express from 'express'
import { execSync } from 'child_process'
import { Config } from './config.mjs'

const serverPort = process.env.PORT || 4000
const serverHost = process.env.HOST || 'localhost'
export const serverURL = `http://${serverHost}:${serverPort}`

export function startServer() {
  const app = express()
  // const opn = require('opn')

  // Can't use __dirname while /spec is a symlink
  const cwd = execSync('pwd').toString().trim()

  // The express.static middleware serves both JavaScripts from /dist
  // and files we send with sendFile().
  app.use(express.static(cwd))
  app.set('views', cwd)
  app.set('view engine', 'ejs')

  app.get('/', function(req, res) {
    res.sendFile(cwd + '/spec/runner/menu.html')
  })

  app.get('/specs', function(req, res) {
    const headers = {}

    const config = Config.fromExpressQuery(req.query)

    let cspHeader = config.toCSPHeader()
    if (cspHeader) {
      headers['Content-Security-Policy'] = cspHeader
    }

    res.set(headers).render('spec/runner/runner', { config })
  })

  return new Promise((resolve, _reject) => {
    const httpServer = app.listen(serverPort, serverHost, function() {
      // console.log(`Unpoly specs serving on ${URL}.`)
      // console.log("Press CTRL+C to quit.")
      // opn(URL)
      resolve({
        stopServer: () => stopServer(httpServer)
      })
    })

  })

}

function stopServer(httpServer) {
  return new Promise((resolve, reject) => {
    httpServer.close(() => {
      resolve()
    })
  })
}

// function startBackgroundServer() {
//   const { spawn } = require('child_process')
//
//   const child = spawn('node', ['bin/test-server.mjs'], {
//     detached: true,
//     stdio: 'ignore',
//   })
//
//   const pid = child.pid
//
//   child.unref()
//
//
// }

export async function isServerRunning() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1000)

    const response = await fetch(serverURL, { signal: controller.signal })
    clearTimeout(timeout)

    return response.ok // true for 2xx responses, false otherwise
  } catch (err) {
    return false // Network error, timeout, or server not responding
  }
}

