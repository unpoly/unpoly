// The scratch server: a handful of real pages, served by a real server, for trying an
// Unpoly change by hand. See tooling/scratch/README.md for how to write a page, and
// docs/contributing/trying-out-changes.md for how to drive one.
//
// Its own process on its own port, not a route on the spec server — that one is booted by
// `bin/ci`, and dynamically importing whatever uncommitted files happen to be in pages/ has
// no business anywhere near a CI run.

import express from 'express'
import path from 'node:path'
import { statSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { waitForFreshBuild, BuildFailedError, BuildSyncError } from '../build/build_sync.mjs'
import { PROJECT_ROOT } from '../build/build_status.mjs'
import { listPages, resolvePage, PAGES_DIR } from './pages.mjs'
import { layout } from './helpers/layout.mjs'
import { renderView } from './helpers/view.mjs'

const SCRATCH_DIR = path.dirname(import.meta.filename)
const serverPort = process.env.PORT || 4001
const serverHost = process.env.HOST || 'localhost'
const urlFor = (port) => `http://${serverHost}:${port}`

export const serverURL = urlFor(serverPort)

// Lines go out unstamped: under `bin/dev` the supervisor prefixes and timestamps every line
// (see tooling/dev_env.mjs), and stamping here too would print two of them.
const defaultLog = (line) => console.log(line)

export function startServer(port = serverPort, { waitForBuild = waitForFreshBuild, log = defaultLog, pagesDir = PAGES_DIR } = {}) {
  const app = express()

  app.use(express.urlencoded({ extended: true }))
  app.use(logRequests(log))

  app.use('/assets', express.static(path.join(SCRATCH_DIR, 'assets')))
  app.use('/dist', express.static(path.join(PROJECT_ROOT, 'dist')))

  // The index is plain HTML that loads no bundle, so it stays readable when the build is
  // broken — which is exactly when you want to see what pages exist.
  app.get('/', (req, res) => {
    res.locals.view = 'index'
    res.send(indexPage(listPages(pagesDir)))
  })

  app.all('/:page', gateOnBuild(waitForBuild), async (req, res, next) => {
    const page = resolvePage(req.params.page, pagesDir)
    if (!page) return next()

    try {
      // The handler wins when both files exist, and renders the view itself. A static page
      // becomes a dynamic one by dropping an .mjs beside it — the markup never moves.
      if (page.handler) {
        res.locals.view = path.basename(page.handler)
        const handler = await loadHandler(page.handler, req.method)
        if (!handler) return next()
        return await handler(req, res)
      }

      if (req.method !== 'GET') return next()
      res.locals.view = path.basename(page.view)
      res.send(layout(renderView(page.view, { req }), { title: page.name }))
    } catch (error) {
      next(error)
    }
  })

  app.use((req, res) => {
    res.status(404).send(errorPage('No such page', `Nothing serves ${req.method} ${req.originalUrl}.`, listPages(pagesDir)))
  })

  // Errors are rendered *and* logged: in the browser because that is where you are looking,
  // and in the log because that is where an agent is looking.
  app.use((error, req, res, _next) => {
    if (error instanceof BuildFailedError) {
      log(`BUILD FAILED serving ${req.method} ${req.originalUrl}`)
      return res.status(503).send(errorPage('The build failed', error.errors))
    }
    if (error instanceof BuildSyncError) {
      log(`NO FRESH BUILD serving ${req.method} ${req.originalUrl}: ${error.message}`)
      return res.status(503).send(errorPage('No fresh build', error.message))
    }
    log(`ERROR serving ${req.method} ${req.originalUrl}: ${error.message}`)
    log(error.stack || String(error))
    res.status(500).send(errorPage(error.message, error.stack || String(error)))
  })

  return new Promise((resolve, reject) => {
    // Same shape as tooling/runner/server/server.mjs: express hands the one callback both
    // 'listening' and 'error', so without the check a port collision resolves with a handle
    // to a server that is not listening.
    const httpServer = app.listen(port, serverHost, (error) => {
      if (error) {
        reject(error.code === 'EADDRINUSE'
          ? new Error(`Port ${port} is already in use — something else is listening there.`)
          : error)
        return
      }
      resolve({
        stopServer: () => new Promise((done) => httpServer.close(() => done())),
        url: urlFor(port),
      })
    })
  })
}

// Blocks the request while webpack is working, so a page never shows you the previous
// build. Reuses the runner's build protocol rather than watching dist/ a second way.
const gateOnBuild = (waitForBuild) => async (req, res, next) => {
  try {
    await waitForBuild()
    next()
  } catch (error) {
    next(error)
  }
}

// Imports a page's handler and picks the export for this method: `get`, `post`, … or
// `default` for a page that answers everything.
async function loadHandler(file, method) {
  // The mtime cache-buster is not optional: without it Node keeps serving the module it
  // imported first, and an edited page goes on behaving like the old one.
  const module = await import(`${pathToFileURL(file).href}?v=${statSync(file).mtimeMs}`)
  return module[method.toLowerCase()] || module.default || null
}

function logRequests(log) {
  return (req, res, next) => {
    // On 'finish', so the line can carry the status and the response headers — which for
    // Unpoly is most of what you want to know.
    res.on('finish', () => {
      const parts = [req.method, req.originalUrl]
      if (res.locals.view) parts.push(`→ ${res.locals.view}`)
      parts.push(String(res.statusCode))
      const sent = upHeaders(req.headers)
      if (sent.length) parts.push(`| in ${sent.join(' ')}`)
      const got = upHeaders(res.getHeaders())
      if (got.length) parts.push(`| out ${got.join(' ')}`)
      log(parts.join(' '))
    })
    next()
  }
}

// The X-Up-* headers are the protocol conversation — the target, the validated field, the
// layer mode, an accepted overlay. Nothing else on the wire is as worth logging.
function upHeaders(headers) {
  return Object.entries(headers)
    .filter(([name]) => name.toLowerCase().startsWith('x-up-'))
    .map(([name, value]) => `${name}=${value}`)
}

const escapeHTML = (text) => String(text).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]))

// Neither of these pages uses the layout: both have to work when the build is missing, and
// the layout loads bundles that would not be there.
function indexPage(pages) {
  const rows = pages.map((page) => `      <li><a href="${page.url}">${page.url}</a> <small>${[page.handler, page.view].filter(Boolean).map((file) => escapeHTML(path.basename(file))).join(' + ')}</small></li>`)
  return `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8"><title>Unpoly scratch pages</title><link rel="stylesheet" href="/assets/styles.css"></head>
  <body>
    <h1>Unpoly scratch pages</h1>
    <ul>
${rows.join('\n')}
    </ul>
    <p><small>Add one by dropping a file into <code>tooling/scratch/pages</code> — see <code>tooling/scratch/README.md</code>.</small></p>
  </body>
</html>
`
}

function errorPage(title, detail, pages = null) {
  const list = pages ? `    <ul>\n${pages.map((page) => `      <li><a href="${page.url}">${page.url}</a></li>`).join('\n')}\n    </ul>\n` : ''
  return `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8"><title>${escapeHTML(title)}</title><link rel="stylesheet" href="/assets/styles.css"></head>
  <body>
    <h1>${escapeHTML(title)}</h1>
    <pre>${escapeHTML(detail)}</pre>
${list}  </body>
</html>
`
}
