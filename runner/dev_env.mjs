// Starting/stopping the dev environment (spec server + build watcher) so that
// `bin/test` can run without the developer having to manage background processes,
// and `bin/dev` can start/stop it explicitly. All the logic lives here; the bin
// scripts are thin wrappers.
//
// The environment is run by foreman (nf) from Procfile.test (watch-dev +
// test-server) — a lean procfile so it works without the maintainer's optional
// sibling repos.

import { spawn } from 'node:child_process'
import { openSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { isServerRunning } from './server/server.mjs'
import { readStatus } from './terminal/build_status.mjs'

const PROCFILE = 'Procfile.test'
const PID_FILE = 'tmp/dev.pid'
const LOG_FILE = 'tmp/dev.log'
const READY_TIMEOUT = 60_000

// Is the full dev environment already up? (server reachable AND watcher alive)
export async function isDevEnvRunning() {
  return (await isServerRunning()) && watcherAlive()
}

// Starts the environment in the background (detached) and resolves once it is
// ready — i.e. the watcher's first build has succeeded and the server answers.
// Rejects if foreman exits early, or if it isn't ready within READY_TIMEOUT.
// The started processes outlive this process; stop them with stopDevEnv().
export function startDevEnv() {
  mkdirSync('tmp', { recursive: true })
  const logFd = openSync(LOG_FILE, 'w')
  const spawnedAt = Date.now()

  const child = spawn('npx', ['nf', 'start', '--procfile', PROCFILE], {
    detached: true,
    stdio: ['ignore', logFd, logFd],
  })
  child.unref()
  writeFileSync(PID_FILE, String(child.pid))

  return new Promise((resolve, reject) => {
    let settled = false
    const stop = () => { settled = true; clearInterval(poll); clearTimeout(timer); child.removeListener('exit', onExit) }

    const fail = (message) => {
      if (settled) return
      stop()
      stopDevEnv() // kill the env we started so a failed start doesn't leak
      reject(new Error(message))
    }

    const onExit = (code) => fail(`Dev environment exited (code ${code}) before it was ready.\n${tail(LOG_FILE)}`)
    child.on('exit', onExit)

    const timer = setTimeout(
      () => fail(`Dev environment didn't become ready within ${READY_TIMEOUT / 1000}s.\n${tail(LOG_FILE)}`),
      READY_TIMEOUT
    )

    const poll = setInterval(async () => {
      if (settled) return
      const status = readStatus()
      const built = status && status.state === 'idle' && status.startedAt >= spawnedAt
      if (built && await isServerRunning() && !settled) {
        stop()
        resolve({ pid: child.pid })
      }
    }, 250)
  })
}

// Runs the environment in the foreground (inherits stdio, blocks). Used by
// `bin/dev start`; stop it with Ctrl-C. Resolves with foreman's exit code.
export function runDevEnvForeground() {
  const child = spawn('npx', ['nf', 'start', '--procfile', PROCFILE], { stdio: 'inherit' })
  return new Promise((resolve) => child.on('exit', (code) => resolve(code ?? 0)))
}

// Stops a background environment started by startDevEnv(). Returns whether one was
// found. Kills the whole process group (foreman + watcher + server).
export function stopDevEnv() {
  let pid
  try {
    pid = Number(readFileSync(PID_FILE, 'utf8').trim())
  } catch {
    return false
  }
  try {
    process.kill(-pid, 'SIGTERM') // negative pid = the detached process group
  } catch {
    try { process.kill(pid, 'SIGTERM') } catch { /* already gone */ }
  }
  try { unlinkSync(PID_FILE) } catch { /* ignore */ }
  return true
}

function watcherAlive() {
  const status = readStatus()
  return !!(status && isAlive(status.pid))
}

function isAlive(pid) {
  try { process.kill(pid, 0); return true } catch { return false }
}

function tail(file, lines = 20) {
  try {
    return readFileSync(file, 'utf8').split('\n').slice(-lines).join('\n')
  } catch {
    return ''
  }
}
