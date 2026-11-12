import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Rounds, affectedBundles, watchSources } from '../../build/watch.mjs'
import { REQUEST_PATH, requestBuild } from '../../build/build_status.mjs'
import { SOURCE_DIRS } from '../../build/build_sync.mjs'

// --- Rounds -------------------------------------------------------------------

// A Rounds whose timers run when the test says so, with a recording status.
function rounds({ run }) {
  let timers = []
  let log = []
  let starts = []
  let status = {
    start: (round) => { starts.push(round); log.push('building') },
    finish: (errors) => log.push(errors.length ? `idle: ${errors.join(', ')}` : 'idle'),
  }
  let subject = new Rounds({
    status,
    run,
    setTimer: (fn) => { timers.push(fn); return fn },
    clearTimer: (fn) => { timers = timers.filter((timer) => timer !== fn) },
  })
  let fireTimers = () => { let due = timers; timers = []; due.forEach((fn) => fn()) }
  return { subject, log, starts, fireTimers }
}

test('changes within the debounce time make one round', async () => {
  let calls = []
  let { subject, log, fireTimers } = rounds({ run: async (files) => { calls.push([...files]); return [] } })

  subject.change('/a.js')
  subject.change('/b.js')
  fireTimers()
  await subject.idle

  assert.deepEqual(calls, [['/a.js', '/b.js']])
  assert.deepEqual(log, ['building', 'idle'])
})

test('a change during a round starts another round before reporting idle', async () => {
  // The bug this prevents: reporting idle for a dist/ that an edit we already saw has not
  // reached. A runner would then test stale bundles.
  let calls = []
  let { subject, log, fireTimers } = rounds({
    run: async (files) => {
      calls.push([...files])
      if (calls.length === 1) {
        subject.change('/during.js')
        fireTimers() // the debounce expires while we are still building
      }
      return []
    },
  })

  subject.change('/before.js')
  fireTimers()
  await subject.idle

  assert.deepEqual(calls, [['/before.js'], ['/during.js']])
  assert.deepEqual(log, ['building', 'building', 'idle'])
})

test('a round that throws still ends, with the error as a build error', async () => {
  // Otherwise the status says "building" for ever, and every later bin/test times out blaming a
  // watcher that is fine.
  let { subject, log, fireTimers } = rounds({ run: async () => { throw new Error('EMFILE: too many open files') } })

  subject.change(null)
  fireTimers()
  await subject.idle

  assert.equal(log.length, 2)
  assert.match(log[1], /^idle: Error: EMFILE/)
})

test('the errors of a round go to the status', async () => {
  let { subject, log, fireTimers } = rounds({ run: async () => ['ERROR X'] })

  subject.change('/a.js')
  fireTimers()
  await subject.idle

  assert.deepEqual(log, ['building', 'idle: ERROR X'])
})

test('a change without a file name is passed on as null', async () => {
  let calls = []
  let { subject, fireTimers } = rounds({ run: async (files) => { calls.push([...files]); return [] } })

  subject.change(null)
  fireTimers()
  await subject.idle

  assert.deepEqual(calls, [[null]])
})

test('a change that needs no rebuild still makes a round, with no files', async () => {
  // A guide page saved by rename moves its directory's mtime, which bin/test waits for. Without a
  // round, every run waited out the grace period until the next source edit.
  let calls = []
  let { subject, log, fireTimers } = rounds({ run: async (files) => { calls.push([...files]); return [] } })

  subject.touch()
  fireTimers()
  await subject.idle

  assert.deepEqual(calls, [[]])
  assert.deepEqual(log, ['building', 'idle'])
})

test('a change that needs no rebuild joins a round with real changes', async () => {
  let calls = []
  let { subject, fireTimers } = rounds({ run: async (files) => { calls.push([...files]); return [] } })

  subject.touch()
  subject.change('/a.js')
  fireTimers()
  await subject.idle

  assert.deepEqual(calls, [['/a.js']])
})

test('the status learns which paths a round has seen', async () => {
  // waitForFreshBuild() checks each source against them (see BuildStatus).
  let { subject, starts, fireTimers } = rounds({ run: async () => [] })

  subject.touch('/src/pages')
  subject.change('/src/a.js')
  fireTimers()
  await subject.idle
  subject.change(null)
  fireTimers()
  await subject.idle

  assert.deepEqual(starts, [{ seen: ['/src/pages', '/src/a.js'], full: false }, { seen: [], full: true }])
})

// --- affectedBundles() ------------------------------------------------------

const unpoly = new Set(['/src/unpoly.js', '/src/unpoly/util.js'])
const specs = new Set(['/spec/specs.js', '/spec/unpoly/util_spec.js'])

test('only bundles that read a changed file rebuild', () => {
  assert.deepEqual(affectedBundles([unpoly, specs], new Set(['/src/unpoly/util.js'])), [0])
  assert.deepEqual(affectedBundles([unpoly, specs], new Set(['/spec/unpoly/util_spec.js'])), [1])
  assert.deepEqual(affectedBundles([unpoly, specs], new Set(['/src/unpoly/util.js', '/spec/specs.js'])), [0, 1])
})

test('a file no bundle has read rebuilds everything', () => {
  // A new spec helper (picked up by a glob), a Sass partial, a file that only a failed build
  // would have read: we can't tell who needs it.
  assert.deepEqual(affectedBundles([unpoly, specs], new Set(['/spec/helpers/new_helper.js'])), [0, 1])
})

test('a change without a file name rebuilds everything', () => {
  assert.deepEqual(affectedBundles([unpoly, specs], new Set([null])), [0, 1])
})

test('a bundle that has not built yet always rebuilds everything', () => {
  assert.deepEqual(affectedBundles([unpoly, null], new Set(['/src/unpoly/util.js'])), [0, 1])
})

// --- watchSources() ----------------------------------------------------------

// A project in a temp directory, watched for real, with a Rounds stand-in that records what it
// is told. `expect(calls, action)` runs `action` and waits up to a second for those calls.
function project(t) {
  let root = mkdtempSync(path.join(tmpdir(), 'watch-sources-'))
  for (let dir of SOURCE_DIRS) mkdirSync(path.join(root, dir, 'sub'), { recursive: true })
  writeFileSync(path.join(root, 'package.json'), '{}')
  let calls = []
  let logs = []
  let rounds = {
    change: (file) => calls.push(['change', file && path.relative(root, file)]),
    touch: (file) => calls.push(['touch', file && path.relative(root, file)]),
  }
  let watcher = watchSources(rounds, { root, log: (message) => logs.push(message) })
  t.after(() => {
    watcher.close()
    rmSync(root, { recursive: true, force: true })
  })
  let at = (file) => path.join(root, file)
  let has = (call) => calls.some((other) => JSON.stringify(other) === JSON.stringify(call))
  let expect = async (expected, action) => {
    calls.length = 0
    await action()
    let deadline = Date.now() + 1000
    while (!expected.every(has)) {
      if (Date.now() > deadline) assert.fail(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(calls)}`)
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
  let settle = () => new Promise((resolve) => setTimeout(resolve, 50))
  return { root, at, calls, logs, expect, settle }
}

test('a source rebuilds, and its directory counts as seen', async (t) => {
  let { at, calls, expect } = project(t)
  for (let dir of SOURCE_DIRS) {
    await expect([['touch', `${dir}/sub`], ['change', `${dir}/sub/a.js`]], () => writeFileSync(at(`${dir}/sub/a.js`), '1'))
  }
  await expect([['touch', 'src/sub']], () => writeFileSync(at('src/sub/guide.md'), '1'))
  assert.ok(!calls.some(([kind, file]) => kind === 'change' && file?.endsWith('guide.md')), 'a guide page builds nothing')
})

test('a new or moved directory rebuilds everything', async (t) => {
  let { at, expect, settle } = project(t)
  await expect([['change', null]], () => mkdirSync(at('spec/new')))
  await settle()
  await expect([['change', null]], () => renameSync(at('spec/new'), at('spec/moved')))
  await settle()
  await expect([['change', 'spec/moved/a.js']], () => writeFileSync(at('spec/moved/a.js'), '1'))
})

test('package.json rebuilds everything, also when saved by rename again', async (t) => {
  // The version number in the bundle comes from there.
  let { at, expect } = project(t)
  for (let i = 0; i < 2; i++) {
    await expect([['change', null]], () => {
      writeFileSync(at('package.json.tmp'), `{"version": "${i}"}`)
      renameSync(at('package.json.tmp'), at('package.json'))
    })
  }
})

test('a rebuild request rebuilds the files it names, once', async (t) => {
  let { root, at, calls, logs, expect, settle } = project(t)
  await expect([['change', 'src/sub/a.js'], ['change', null]], () => requestBuild(['src/sub/a.js', 'spec/sub'], root))
  assert.match(logs.join('\n'), /requested for src\/sub\/a\.js, spec\/sub/)
  assert.ok(!existsSync(at(REQUEST_PATH)), 'the request is taken')
  await settle()
  assert.equal(calls.filter(([kind]) => kind === 'change').length, 2, 'and served once')
})

test('rebuild requests still arrive after tmp/ was deleted', async (t) => {
  let { root, at, expect, settle } = project(t)
  rmSync(at('tmp'), { recursive: true })
  await settle()
  await expect([['change', 'src/sub/a.js']], () => requestBuild('src/sub/a.js', root))
  await settle()
  await expect([['change', 'src/sub/b.js']], () => requestBuild('src/sub/b.js', root))
})

test('a source directory deleted and created again is watched again', async (t) => {
  // A checkout that replaces spec/, say.
  let { at, expect, settle } = project(t)
  await expect([['change', null]], () => rmSync(at('spec'), { recursive: true }))
  await expect([['change', null]], () => mkdirSync(at('spec')))
  await settle()
  await expect([['change', 'spec/a.js']], () => writeFileSync(at('spec/a.js'), '1'))
})
