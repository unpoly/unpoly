import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer } from '../server/server.mjs'

// Start on an unusual port so it doesn't clash with a dev server on :4000.
let handle, serverURL
before(async () => { handle = await startServer(4771); serverURL = handle.url })
after(async () => { await handle.stopServer() })

async function get(path) {
  let response = await fetch(serverURL + path)
  return {
    status: response.status,
    csp: response.headers.get('content-security-policy'),
    body: await response.text(),
  }
}

test('serves the menu at /', async () => {
  let response = await get('/')
  assert.equal(response.status, 200)
  assert.match(response.body, /Unpoly specs/)
})

test('csp=none sends no CSP header', async () => {
  assert.equal((await get('/specs?csp=none')).csp, null)
})

test('csp=nonce-only sends a nonce CSP header', async () => {
  assert.match((await get('/specs?csp=nonce-only')).csp, /script-src 'nonce-specs-nonce'/)
})

test('es6 loads the es6 bundles', async () => {
  let body = (await get('/specs?es6=true')).body
  assert.match(body, /specs\.es6\.js/)
  assert.match(body, /unpoly\.es6\.js/)
})

test('minify loads the minified bundles', async () => {
  assert.match((await get('/specs?minify=true')).body, /unpoly\.min\.js/)
})

test('migrate loads unpoly-migrate', async () => {
  assert.match((await get('/specs?migrate=true')).body, /unpoly-migrate\.js/)
})

test('a port collision rejects instead of resolving with a dead server', async () => {
  // Express passes the same callback for 'listening' and 'error', so the old code
  // resolved on EADDRINUSE: bin/test-server printed "serving on ..." and exited 0.
  const { startServer } = await import('../server/server.mjs')
  const first = await startServer(4781)
  try {
    await assert.rejects(startServer(4781), /already in use/)
  } finally {
    await first.stopServer()
  }
})
