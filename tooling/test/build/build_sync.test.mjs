import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { waitForFreshBuild, newestSourceMtime, BROWSER_RUNNER_FILES, BuildSyncError, BuildFailedError } from '../../build/build_sync.mjs'

const noop = async () => {}

test('errors when there is no status file', async () => {
  await assert.rejects(
    waitForFreshBuild({ read: () => null, newestMtime: 0, isAlive: () => true, sleep: noop }),
    BuildSyncError
  )
})

test('errors when the watcher pid is dead', async () => {
  await assert.rejects(
    waitForFreshBuild({ read: () => ({ pid: 1, state: 'idle', startedAt: 100 }), newestMtime: 0, isAlive: () => false, sleep: noop }),
    /process is gone/
  )
})

test('resolves when idle and built after the latest edit', async () => {
  let status = await waitForFreshBuild({
    read: () => ({ pid: 1, state: 'idle', startedAt: 200 }),
    newestMtime: 100, isAlive: () => true, sleep: noop,
  })
  assert.equal(status.state, 'idle')
})

test('resolves when a fresh build reports ok:true', async () => {
  let status = await waitForFreshBuild({
    read: () => ({ pid: 1, state: 'idle', startedAt: 200, ok: true, errors: '' }),
    newestMtime: 100, isAlive: () => true, sleep: noop,
  })
  assert.equal(status.ok, true)
})

test('throws BuildFailedError carrying the errors when the fresh build failed', async () => {
  await assert.rejects(
    waitForFreshBuild({
      read: () => ({ pid: 1, state: 'idle', startedAt: 200, ok: false, errors: 'ERROR in ./src/unpoly/foo.js\nSyntaxError' }),
      newestMtime: 100, isAlive: () => true, sleep: noop,
    }),
    (error) => {
      assert.ok(error instanceof BuildFailedError)
      assert.match(error.errors, /SyntaxError/)
      return true
    }
  )
})

test('times out when the build stays older than the edit', async () => {
  let clock = 0
  await assert.rejects(
    waitForFreshBuild({
      read: () => ({ pid: 1, state: 'idle', startedAt: 50 }),
      newestMtime: 100, isAlive: () => true,
      now: () => (clock += 1000), sleep: noop, timeoutMs: 2000,
    }),
    /didn't rebuild/
  )
})

test('the browser-side runner files webpack compiles into the specs bundle are all scanned', () => {
  // The freshness check scans src/ and spec/. Anything else that reaches dist/specs.js
  // has to be listed by hand, and a hand-maintained list rots — so derive the truth from
  // the imports and fail if the list falls behind.
  const root = new URL('../../../', import.meta.url).pathname
  const entry = 'tooling/runner/browser/poster.js' // what spec/helpers/terminal_reporter.js pulls in

  const reachable = new Set()
  const visit = (relative) => {
    if (reachable.has(relative)) return
    reachable.add(relative)
    const source = readFileSync(path.join(root, relative), 'utf8')
    for (const [, target] of source.matchAll(/^import\s[^']*'(\.[^']+)'/gm)) {
      visit(path.join(path.dirname(relative), target))
    }
  }
  visit(entry)

  for (const file of reachable) {
    assert.ok(BROWSER_RUNNER_FILES.includes(file),
      `${file} reaches the specs bundle but is not in the freshness scan`)
  }
})

test('a scan that finds nothing fails closed rather than reporting "fresh"', () => {
  assert.throws(() => newestSourceMtime('/nonexistent-checkout', ['src'], []), /No source files found/)
})
