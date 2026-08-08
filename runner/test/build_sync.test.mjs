import { test } from 'node:test'
import assert from 'node:assert/strict'
import { waitForFreshBuild, BuildSyncError } from '../terminal/build_sync.mjs'

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
