import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Rounds, affectedBundles } from '../../build/watch.mjs'

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
