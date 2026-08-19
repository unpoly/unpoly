import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startServer } from '../../scratch/server.mjs'
import { BuildFailedError, BuildSyncError } from '../../build/build_sync.mjs'

// Fixture pages, deliberately self-contained: a handler in a temp directory cannot reach
// ../helpers, and what these tests are about is the server's routing, not the helpers.
function fixturePages() {
  const dir = mkdtempSync(path.join(tmpdir(), 'unpoly-scratch-'))
  const write = (name, body) => writeFileSync(path.join(dir, name), body)
  write('plain.ejs', '<p>a plain fragment</p>')
  write('doc.ejs', '<!DOCTYPE html>\n<html><head><title>mine</title></head><body>my own document</body></html>')
  write('both.ejs', '<p>from the view</p>')
  write('both.mjs', "export const get = (req, res) => res.send('<p>from the handler</p>')\n")
  write('poster.mjs', "export const post = (req, res) => res.set('X-Up-Accept-Layer', 'null').status(201).send('posted ' + req.body.name)\n")
  write('boom.mjs', "export const get = () => { throw new Error('the page exploded') }\n")
  return dir
}

const NO_WAIT = async () => {}

let handle, url, logged
before(async () => {
  logged = []
  handle = await startServer(4791, { waitForBuild: NO_WAIT, log: (line) => logged.push(line), pagesDir: fixturePages() })
  url = handle.url
})
after(async () => { await handle.stopServer() })

const get = async (pathname, options) => {
  const response = await fetch(url + pathname, options)
  return { status: response.status, body: await response.text(), headers: response.headers }
}

test('the index lists every page and which files back it', () => {
  return get('/').then((response) => {
    assert.equal(response.status, 200)
    assert.match(response.body, /href="\/plain"/)
    assert.match(response.body, /both\.mjs \+ both\.ejs/)
    // It loads no bundle, so it stays readable when the build is broken.
    assert.ok(!response.body.includes('/dist/unpoly.js'), 'the index must not depend on a build')
  })
})

test('an .ejs page is wrapped in the layout', async () => {
  const response = await get('/plain')
  assert.equal(response.status, 200)
  assert.match(response.body, /^<!DOCTYPE html>/)
  assert.match(response.body, /\/dist\/unpoly\.js/)
  assert.match(response.body, /a plain fragment/)
})

test('an .ejs that is already a document is served untouched', async () => {
  const response = await get('/doc')
  assert.match(response.body, /my own document/)
  assert.ok(!response.body.includes('/dist/unpoly.js'), 'a page that owns its <head> keeps it')
})

test('the .mjs wins when both files exist', async () => {
  const response = await get('/both')
  assert.match(response.body, /from the handler/)
  assert.ok(!response.body.includes('from the view'), 'the view is the handler\'s to render, not the server\'s')
})

test('a handler answers the method it exports', async () => {
  const response = await get('/poster', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Up-Validate': 'name' },
    body: 'name=henning',
  })
  assert.equal(response.status, 201)
  // express.urlencoded() must be mounted, or req.body is undefined and a form silently
  // posts nothing.
  assert.match(response.body, /posted henning/)
})

test('a method the page does not export is a 404, not a crash', async () => {
  assert.equal((await get('/plain', { method: 'DELETE' })).status, 404)
})

test('an unknown page is a 404 that lists what does exist', async () => {
  const response = await get('/nope')
  assert.equal(response.status, 404)
  assert.match(response.body, /href="\/plain"/)
})

test('a page name cannot escape the pages directory', async () => {
  assert.equal((await get('/../../package.json')).status, 404)
})

test('a page that throws is rendered and logged, and the server survives', async () => {
  const response = await get('/boom')
  assert.equal(response.status, 500)
  assert.match(response.body, /the page exploded/)
  assert.match(response.body, /boom\.mjs/, 'the stack should say where')
  assert.ok(logged.some((line) => line.includes('the page exploded')), 'the log needs it too — that is where an agent looks')
  assert.equal((await get('/plain')).status, 200, 'the server must still be serving')
})

test('the request log carries the view, the status and the X-Up headers', async () => {
  logged.length = 0
  await get('/poster', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Up-Target': '#form' },
    body: 'name=x',
  })
  const line = logged.find((entry) => entry.includes('/poster'))
  assert.match(line, /POST \/poster → poster\.mjs 201/)
  assert.match(line, /in x-up-target=#form/)
  assert.match(line, /out x-up-accept-layer=null/)
})

// --- The build gate --------------------------------------------------------

test('a missing watcher is reported in the page, not left to 404 mysteriously', async () => {
  const server = await startServer(4792, {
    waitForBuild: async () => { throw new BuildSyncError('Build watcher not running (no tmp/build-status.json). Start it with `bin/dev`.') },
    log: () => {},
    pagesDir: fixturePages(),
  })
  try {
    const response = await fetch(`${server.url}/plain`)
    assert.equal(response.status, 503)
    assert.match(await response.text(), /Start it with `bin\/dev`/)
  } finally { await server.stopServer() }
})

test('a failed build puts the compile errors in the page', async () => {
  // Otherwise the page just silently is not Unpoly, and you debug a phantom.
  const server = await startServer(4793, {
    waitForBuild: async () => { throw new BuildFailedError("TS1005: ';' expected.") },
    log: () => {},
    pagesDir: fixturePages(),
  })
  try {
    const response = await fetch(`${server.url}/plain`)
    assert.equal(response.status, 503)
    assert.match(await response.text(), /TS1005/)
  } finally { await server.stopServer() }
})

test('a port collision rejects instead of resolving with a dead server', async () => {
  const first = await startServer(4794, { waitForBuild: NO_WAIT, log: () => {}, pagesDir: fixturePages() })
  try {
    await assert.rejects(startServer(4794, { waitForBuild: NO_WAIT, log: () => {}, pagesDir: fixturePages() }), /already in use/)
  } finally { await first.stopServer() }
})
