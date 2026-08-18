import { test } from 'node:test'
import assert from 'node:assert/strict'
import { closeSync, mkdtempSync, readFileSync, rmSync, writeSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { devEnvState, isSupervisor, lastBuildErrors, startUnderLock, withStartLock } from '../dev_env.mjs'

const SERVING = async () => true
const SILENT = async () => false
const owned = (pid, owner) => () => ({ pid, owner })
const NOTHING_RUNNING = async () => ({ state: 'none', pid: null })
const noStdio = () => ({ stdio: 'ignore', close: () => {} })

// --- devEnvState: the one decision -----------------------------------------

test('running: our supervisor is alive and the server answers', async () => {
  assert.deepEqual(await devEnvState({ owner: owned(42, 'ours'), serving: SERVING }),
    { state: 'running', pid: 42 })
})

test('booting: our supervisor is alive but the server is not up yet', async () => {
  assert.deepEqual(await devEnvState({ owner: owned(42, 'ours'), serving: SILENT }),
    { state: 'booting', pid: 42 })
})

test('foreign: something answers that we did not start', async () => {
  assert.deepEqual(await devEnvState({ owner: owned(null, 'gone'), serving: SERVING }),
    { state: 'foreign', pid: null })
})

test('none: nothing recorded and nothing answering', async () => {
  assert.deepEqual(await devEnvState({ owner: owned(null, 'gone'), serving: SILENT }),
    { state: 'none', pid: null })
})

test('a recycled pid belonging to a stranger reads as absent, not as an environment', async () => {
  // The wedge this replaced: process.kill(pid, 0) said "alive" for an unrelated
  // process that had inherited our old pid, so startup refused for good.
  assert.deepEqual(await devEnvState({ owner: owned(42, 'stranger'), serving: SILENT }),
    { state: 'none', pid: null })
})

test('a live pid we cannot identify is neither ours nor absent', async () => {
  // No /proc and no usable `ps` — busybox, or hidepid. (Not a zombie: its /proc entry
  // reads empty, which is a proven stranger.) Treating this as absent would clear the
  // file and start a second environment beside a healthy one.
  assert.deepEqual(await devEnvState({ owner: owned(42, 'unknown'), serving: SILENT }),
    { state: 'unidentified', pid: 42 })
})

// --- isSupervisor: whose process is that ------------------------------------

// The real supervisor path, since isSupervisor() compares against it.
const SUPERVISOR = new URL('../dev_env.mjs', import.meta.url).pathname

test('a node process running this file is ours', () => {
  assert.equal(isSupervisor(['/usr/bin/node', SUPERVISOR]), true)
  assert.equal(isSupervisor(`/home/x/.nvm/versions/node/v22.0.0/bin/node ${SUPERVISOR}`), true)
})

test('a process that merely mentions the file is not ours', () => {
  // The case that made a bare substring match unsafe: with a recycled pid we would
  // otherwise signal an editor's — or a pgrep's — whole process group.
  assert.equal(isSupervisor(['/usr/bin/vim', SUPERVISOR]), false)
  assert.equal(isSupervisor(`tail -f ${SUPERVISOR}`), false)
})

test('a node process running some other file is not ours', () => {
  assert.equal(isSupervisor(['/usr/bin/node', '/repo/tooling/run.mjs']), false)
  assert.equal(isSupervisor('/usr/bin/node /repo/tooling/run.mjs'), false)
})

test('a ps line truncated before the path is not mistaken for ours', () => {
  // Why the fallback passes -ww: without it `ps` clips to the terminal width (80
  // columns when piped), which is shorter than a typical node + supervisor path, so
  // every real supervisor looked foreign.
  assert.equal(isSupervisor(`/usr/bin/node ${SUPERVISOR}`.slice(0, 40)), false)
})

// --- withStartLock: the mutex -----------------------------------------------

test('the lock is held for the whole body, so an overlapping start is refused', async () => {
  // The property three attempts got wrong. The body is the entire critical section —
  // probe, clear a leftover, claim, spawn, write the pid — and releasing the lock any
  // earlier let a racer see the winner's not-yet-written claim as a stale file and
  // clear it. If this ever allows two bodies at once, that race is back.
  let concurrent = 0
  let peak = 0
  const body = async () => {
    peak = Math.max(peak, ++concurrent)
    await new Promise((resolve) => setTimeout(resolve, 50))
    concurrent--
    return 'started'
  }

  const results = await Promise.allSettled([withStartLock(body), withStartLock(body)])

  assert.equal(peak, 1, 'only one body may run at a time')
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  assert.match(results.find((result) => result.status === 'rejected').reason.message, /is taken/)
})

test('the lock is released once the body settles, including when it throws', async () => {
  await assert.rejects(withStartLock(async () => { throw new Error('boom') }), /boom/)
  assert.equal(await withStartLock(async () => 'free again'), 'free again')
})

// --- lastBuildErrors -------------------------------------------------------

test('lastBuildErrors is null when there is no status', () => {
  assert.equal(lastBuildErrors(() => null), null)
})

test('lastBuildErrors is null when the last build was ok', () => {
  assert.equal(lastBuildErrors(() => ({ ok: true, errors: '' })), null)
})

test('lastBuildErrors returns the errors when the last build failed', () => {
  assert.equal(lastBuildErrors(() => ({ ok: false, errors: 'boom' })), 'boom')
})

test('lastBuildErrors falls back to a placeholder when a failed build has no text', () => {
  assert.match(lastBuildErrors(() => ({ ok: false, errors: '' })), /no error output/)
})

// --- startUnderLock: the sequence that broke three times ---------------------

test('the pid file names the supervisor before the critical section returns', async () => {
  // Every generation of this bug left the pid file empty (or someone else's) at the
  // moment the lock was released, because the write happened outside the critical
  // section. Nothing but this assertion pins the ordering.
  const dir = mkdtempSync(path.join(tmpdir(), 'unpoly-under-lock-'))
  const file = path.join(dir, 'dev.pid')
  try {
    const spawnIt = (_stdio, claim) => {
      writeSync(claim, '4242')
      closeSync(claim)
      return { pid: 4242 }
    }
    const supervisor = await startUnderLock(noStdio, { probe: NOTHING_RUNNING, spawnIt, file })
    assert.equal(supervisor.pid, 4242)
    assert.equal(readFileSync(file, 'utf8').trim(), '4242', 'pid written before returning')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('nothing is touched when an environment already exists', async () => {
  // The probe must be consulted before the pid file is cleared and before stdio is
  // opened — opening the log truncates it, which used to wipe a booting environment's.
  let stdioOpened = false
  const openStdio = () => { stdioOpened = true; return noStdio() }
  const spawnIt = () => { throw new Error('must not spawn') }

  await assert.rejects(
    startUnderLock(openStdio, { probe: async () => ({ state: 'booting', pid: 7 }), spawnIt }),
    /already booting \(PID 7\)/
  )
  assert.equal(stdioOpened, false, 'stdio must not be opened before the state is known')
})

test('the supervisor is spawned as node <dev_env.mjs> with no extra arguments', () => {
  // isSupervisor() matches argv[1] exactly, so a node flag added to this spawn would
  // make every running environment unidentifiable — and unstoppable.
  const source = readFileSync(new URL('../dev_env.mjs', import.meta.url), 'utf8')
  assert.match(source, /spawn\(process\.execPath, \[SUPERVISOR\], \{ detached: true, stdio \}\)/)
})
