import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { BuildStatus, requestBuild, takeBuildRequest } from '../../build/build_status.mjs'

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

test('a full round vouches for everything, other rounds for the paths they saw', () => {
  // waitForFreshBuild() checks every source against these, so that a round for one file doesn't
  // vouch for an edit to another one that the watcher never saw.
  let statuses = []
  let clock = { now: 1000 }
  let status = new BuildStatus({ write: (written) => statuses.push(written), now: () => clock.now, root: '/project' })
  let last = () => statuses.at(-1)

  status.start({ full: true })
  assert.equal(last().fullStartedAt, 1000)
  assert.deepEqual(last().seen, {})

  clock.now = 2000
  status.start({ seen: ['/project/src/unpoly/link.ts', '/project/src/unpoly'] })
  clock.now = 3000
  status.start({ seen: ['/project/src/unpoly/link.ts'] })
  status.finish([])
  assert.equal(last().fullStartedAt, 1000)
  assert.deepEqual(last().seen, { 'src/unpoly/link.ts': 3000, 'src/unpoly': 2000 })

  clock.now = 4000
  status.start({ seen: ['/project/src/unpoly/form.ts'], full: true })
  assert.equal(last().fullStartedAt, 4000)
  assert.deepEqual(last().seen, {}, 'a full round includes what the others saw')
})

test('the type check reports in its own fields, and never fails the build', () => {
  // bin/test refuses to run specs for `ok: false`, and runs them for a type error. A watcher from
  // before the type check writes no `types`, so they had to be new fields.
  let { status, statuses, last } = statusWithCapture()

  status.start()
  assert.deepEqual(last().types, { state: 'checking', startedAt: null, ok: null, errors: '' }, 'nothing checked yet')
  status.finish([])
  status.finishTypes(1200, ['src/a.ts\n  1:1  error  X', 'src/a.ts\n  1:1  error  X'])
  assert.equal(last().state, 'idle')
  assert.equal(last().ok, true)
  assert.equal(last().errors, '')
  assert.deepEqual(last().types, { state: 'done', startedAt: 1200, ok: false, errors: 'src/a.ts\n  1:1  error  X' })

  status.startTypes()
  assert.deepEqual(last().types, { state: 'checking', startedAt: null, ok: null, errors: '' }, 'no results while checking')
  assert.equal(last().state, 'idle', 'a type check leaves the build alone')
  status.finishTypes(1300, [])
  assert.deepEqual(last().types, { state: 'done', startedAt: 1300, ok: true, errors: '' })

  status.start()
  status.finish(['ERROR X'])
  assert.equal(last().types.state, 'done', 'a round leaves the type check alone')
  assert.equal(statuses.length, 7)
})

test('a rebuild request carries the files to the watcher, once', (t) => {
  let root = mkdtempSync(path.join(tmpdir(), 'build-request-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  assert.equal(takeBuildRequest(root), null)
  requestBuild(['src/unpoly/link.ts', 'spec/helpers'], root)
  assert.deepEqual(takeBuildRequest(root), ['src/unpoly/link.ts', 'spec/helpers'])
  assert.equal(takeBuildRequest(root), null, 'a request is served once')
  requestBuild('src/unpoly/link.ts', root)
  assert.deepEqual(takeBuildRequest(root), ['src/unpoly/link.ts'])
  requestBuild(null, root)
  assert.deepEqual(takeBuildRequest(root), [])
  assert.deepEqual(readdirSync(path.join(root, 'tmp')), [], 'nothing is left behind')
})
