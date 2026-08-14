import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BuildStatusPlugin } from '../terminal/build_status.mjs'

// A minimal stand-in for a webpack compiler: it captures the callbacks the plugin
// taps onto watchRun/done so a test can fire them by hand. The real dev config
// applies one shared plugin instance to every sub-compiler, so we mirror that by
// applying to several fake compilers.
function fakeCompiler() {
  let taps = {}
  let hook = (name) => ({ tap: (_id, fn) => { taps[name] = fn } })
  return {
    hooks: { watchRun: hook('watchRun'), done: hook('done'), failed: hook('failed') },
    fire: (name, arg) => taps[name](arg),
  }
}

const okStats = { hasErrors: () => false, toString: () => '' }
const errStats = (message) => ({ hasErrors: () => true, toString: () => message })

// A plugin wired to a fresh capture array, plus `last()` for the latest status.
function pluginWithCapture() {
  let statuses = []
  let plugin = new BuildStatusPlugin({ write: (status) => statuses.push(status) })
  return { plugin, statuses, last: () => statuses.at(-1) }
}

test('a clean build writes an idle, ok status', () => {
  let { plugin, last } = pluginWithCapture()
  let compiler = fakeCompiler()
  plugin.apply(compiler)

  compiler.fire('watchRun')
  compiler.fire('done', okStats)

  assert.equal(last().state, 'idle')
  assert.equal(last().ok, true)
  assert.equal(last().errors, '')
})

test('a failed build writes ok:false and captures the error text', () => {
  let { plugin, last } = pluginWithCapture()
  let compiler = fakeCompiler()
  plugin.apply(compiler)

  compiler.fire('watchRun')
  compiler.fire('done', errStats('ERROR in ./src/unpoly/foo.js\nSyntaxError'))

  assert.equal(last().state, 'idle')
  assert.equal(last().ok, false)
  assert.match(last().errors, /SyntaxError/)
})

test('idle is only written once every sub-compiler has finished', () => {
  let { plugin, last } = pluginWithCapture()
  let a = fakeCompiler(), b = fakeCompiler()
  plugin.apply(a)
  plugin.apply(b)

  a.fire('watchRun')
  b.fire('watchRun')
  a.fire('done', okStats)
  assert.equal(last().state, 'building') // b is still building

  b.fire('done', okStats)
  assert.equal(last().state, 'idle')
})

test('an error from any sub-compiler makes the round not ok', () => {
  let { plugin, last } = pluginWithCapture()
  let a = fakeCompiler(), b = fakeCompiler()
  plugin.apply(a)
  plugin.apply(b)

  a.fire('watchRun')
  b.fire('watchRun')
  a.fire('done', okStats)
  b.fire('done', errStats('ERROR in ./src/unpoly/bar.js\nboom'))

  assert.equal(last().ok, false)
  assert.match(last().errors, /boom/)
})

test('identical errors across sub-compilers are collapsed', () => {
  let { plugin, last } = pluginWithCapture()
  let a = fakeCompiler(), b = fakeCompiler()
  plugin.apply(a)
  plugin.apply(b)

  a.fire('watchRun')
  b.fire('watchRun')
  a.fire('done', errStats('ERROR X'))
  b.fire('done', errStats('ERROR X'))

  assert.equal(last().errors, 'ERROR X')
})

test('a fresh round clears the previous round\'s errors', () => {
  let { plugin, last } = pluginWithCapture()
  let compiler = fakeCompiler()
  plugin.apply(compiler)

  compiler.fire('watchRun')
  compiler.fire('done', errStats('ERROR X'))
  assert.equal(last().ok, false)

  compiler.fire('watchRun') // new round — resets the accumulated errors
  compiler.fire('done', okStats)
  assert.equal(last().ok, true)
  assert.equal(last().errors, '')
})

test('a one-shot build never writes the status file', () => {
  // webpack/ci.js reuses the watcher's configs, plugin included, so `bin/build` runs
  // this plugin too. Only `watchRun` fires under --watch, while `done` fires for every
  // compilation — without the guard, a one-shot build overwrote a running watcher's
  // status with its own pid and the dev environment looked dead.
  let { plugin, statuses } = pluginWithCapture()
  let compiler = fakeCompiler()
  plugin.apply(compiler)

  compiler.fire('done', okStats) // no watchRun before it

  assert.deepEqual(statuses, [])
})

test('a watcher that has built once keeps reporting later builds', () => {
  let { plugin, statuses } = pluginWithCapture()
  let compiler = fakeCompiler()
  plugin.apply(compiler)

  compiler.fire('watchRun')
  compiler.fire('done', okStats)
  compiler.fire('watchRun')
  compiler.fire('done', okStats)

  assert.deepEqual(statuses.map((status) => status.state), ['building', 'idle', 'building', 'idle'])
})

test('a rebuild triggered by a later edit refreshes startedAt across overlapping rounds', () => {
  // Deterministic clock: the two logical rounds are milliseconds apart in reality.
  // The compilers rebuild independently, so a fast one can finish round 1 and start
  // round 2 while a slow one is still on round 1 — the in-flight counter never returns
  // to zero between the two logical rounds. Keying startedAt off that counter left it
  // stuck at round 1's time, and waitForFreshBuild() then timed out insisting the
  // watcher had not picked up an edit it had in fact built.
  let clock = 1000
  let statuses = []
  let plugin = new BuildStatusPlugin({ write: (status) => statuses.push(status), now: () => clock })
  let last = () => statuses.at(-1)
  let fast = fakeCompiler()
  let slow = fakeCompiler()
  plugin.apply(fast)
  plugin.apply(slow)

  fast.fire('watchRun')                 // round 1 for edit #1
  slow.fire('watchRun')
  const round1 = last().startedAt

  clock = 1100
  fast.fire('done', okStats)            // fast finishes round 1
  const editAt = clock                  // ... edit #2 lands here
  clock = 1200
  fast.fire('watchRun')                 // fast starts round 2 (counter never hits 0)
  slow.fire('done', okStats)            // slow finishes round 1
  clock = 1250
  slow.fire('watchRun')                 // slow starts round 2 too
  fast.fire('done', okStats)
  slow.fire('done', okStats)            // busy period ends

  assert.equal(last().state, 'idle')
  assert.equal(round1, 1000)
  assert.ok(last().startedAt >= editAt,
    `startedAt must cover edit #2 at ${editAt}, got ${last().startedAt}`)
})

test('a hard watch failure settles the status instead of leaving it "building" for ever', () => {
  // Webpack fires `failed` — not `done` — when a watch cycle dies outside compilation
  // (fs error on emit, EMFILE, a plugin throwing). Untapped, the counter never returned
  // to zero and every later bin/test timed out blaming a healthy watcher.
  let { plugin, last } = pluginWithCapture()
  let compiler = fakeCompiler()
  plugin.apply(compiler)

  compiler.fire('watchRun')
  assert.equal(last().state, 'building')

  compiler.fire('failed', new Error('EMFILE: too many open files'))

  assert.equal(last().state, 'idle')
  assert.equal(last().ok, false)
  assert.match(last().errors, /EMFILE/)
})
