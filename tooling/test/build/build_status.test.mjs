import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BuildStatus } from '../../build/build_status.mjs'

// A status wired to a capture array and a hand-driven clock, plus `last()` for the latest write.
function statusWithCapture() {
  let statuses = []
  let clock = { now: 1000 }
  let status = new BuildStatus({ write: (written) => statuses.push(written), now: () => clock.now })
  return { status, statuses, clock, last: () => statuses.at(-1) }
}

test('a clean round writes building, then an idle, ok status', () => {
  let { status, statuses, last } = statusWithCapture()

  status.start()
  status.finish([])

  assert.deepEqual(statuses.map((written) => written.state), ['building', 'idle'])
  assert.equal(last().ok, true)
  assert.equal(last().errors, '')
  assert.equal(last().pid, process.pid)
})

test('a failed round writes ok:false and the error text', () => {
  let { status, last } = statusWithCapture()

  status.start()
  status.finish(['✘ [ERROR] Unexpected end of file\n\n    src/unpoly/foo.js:12:0'])

  assert.equal(last().state, 'idle')
  assert.equal(last().ok, false)
  assert.match(last().errors, /Unexpected end of file/)
})

test('identical errors from several bundles are collapsed', () => {
  // The modern and es6 bundles read the same file and report the same syntax error.
  let { status, last } = statusWithCapture()

  status.start()
  status.finish(['ERROR X', 'ERROR X', 'ERROR Y'])

  assert.equal(last().errors, 'ERROR X\n\nERROR Y')
})

test('a new round reports building and ok, whatever the last round did', () => {
  let { status, last } = statusWithCapture()

  status.start()
  status.finish(['ERROR X'])
  status.start()

  assert.equal(last().state, 'building')
  assert.equal(last().ok, true)
})

test('startedAt is when the round started, not when it finished', () => {
  // waitForFreshBuild() trusts a round to include an edit only if it started after the edit's
  // mtime. A round's end time would certify edits that landed while it was already building.
  let { status, clock, last } = statusWithCapture()

  clock.now = 2000
  status.start()
  clock.now = 2500
  status.finish([])

  assert.equal(last().startedAt, 2000)
})
