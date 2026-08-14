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
    hooks: { watchRun: hook('watchRun'), done: hook('done') },
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
