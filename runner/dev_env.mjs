// The dev environment: the build watcher, the spec server, and — for whoever has
// them checked out — the sibling projects (docs site, manual tests).
//
// One process table, one supervisor, one pid file, no special cases. `bin/dev`
// runs the supervisor in the foreground (logs on your terminal, Ctrl-C stops it);
// `bin/test` spawns the very same supervisor in the background (logs to
// tmp/dev.log) when nothing is running yet. Both spawn it *detached*, so its pid
// doubles as a process group id and a single kill(-pid) sweeps every descendant.
//
// The supervisor is this very file, re-executed as `node runner/dev_env.mjs` —
// see superviseDevEnv() and the entry check at the bottom.

import { spawn } from 'node:child_process'
import { closeSync, existsSync, openSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import { isServerRunning } from './server/server.mjs'
import { readStatus } from './terminal/build_status.mjs'

// The environment, in one place. A process with a `cwd` lives in a sibling
// repository: it is skipped when that repository isn't checked out, and its death
// never takes the environment down. `test-server` deliberately sets no PORT —
// inheriting it keeps the server on the port isServerRunning() probes.
const PROCESSES = [
  { name: 'watch-dev',   command: 'npm run watch-dev' },
  { name: 'test-server', command: 'npm run test-server' },
  { name: 'docs',        command: 'bundle exec middleman server', cwd: '../unpoly-site',         env: { PORT: '4567' } },
  { name: 'manual-test', command: 'bundle exec rails server',     cwd: '../unpoly-manual-tests', env: { PORT: '4001' } },
]

const PID_FILE = 'tmp/dev.pid'
const LOG_FILE = 'tmp/dev.log'
const READY_TIMEOUT = 60_000
const SHUTDOWN_GRACE = 5_000
const SUPERVISOR = import.meta.filename

// --- Detecting -------------------------------------------------------------

// The pid of a running dev environment, or null. "Running" means the spec server
// answers *and* the build watcher is alive — the two processes everything else
// needs. The pid is the supervisor's, or the watcher's for an environment someone
// started by hand.
export async function runningDevEnvPid() {
  const watcher = watcherPid()
  if (!watcher || !(await isServerRunning())) return null
  return recordedPid() ?? watcher
}

export async function isDevEnvRunning() {
  return (await runningDevEnvPid()) !== null
}

// The build errors from the watcher's most recent build, or null if the last build
// was clean (or there is no status yet). Lets `bin/dev status` surface a broken
// build the same way `bin/test` does.
export function lastBuildErrors(read = readStatus) {
  const status = read()
  return status && status.ok === false ? (status.errors || '(no error output captured)') : null
}

// --- Starting --------------------------------------------------------------

// Starts the environment in the background and resolves once it is ready: the
// watcher's first build has finished and the server answers. The processes outlive
// this one — stop them with stopDevEnv(). Rejects, without leaking a half-started
// environment, if the supervisor dies early or readiness times out.
export function startDevEnv() {
  ensureTmp()

  // Callers only reach us when no environment *answers* yet, which includes the
  // window in which one is still booting. Starting a second one there would fight
  // over the port, the pid file and dist/, so refuse instead.
  const booting = recordedPid()
  if (booting) {
    throw new Error(`A dev environment is already starting or running (PID ${booting}). Wait for it, or stop it with \`bin/dev stop\`.`)
  }

  const logFd = openSync(LOG_FILE, 'w')
  const supervisor = spawnSupervisor(['ignore', logFd, logFd])
  closeSync(logFd) // the supervisor holds its own copy now
  supervisor.unref()
  return waitUntilReady(supervisor)
}

// Resolves when the watcher has finished a build it started *after* the spawn and
// the server answers — so a stale tmp/build-status.json can't satisfy us.
function waitUntilReady(supervisor) {
  const spawnedAt = Date.now()

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = () => {
      settled = true
      clearInterval(poll)
      clearTimeout(timer)
      supervisor.removeListener('exit', onExit)
    }

    const fail = (message) => {
      if (settled) return
      finish()
      killGroup(supervisor.pid) // don't leak the environment we just started
      reject(new Error(`${message}\n${tail(LOG_FILE)}`))
    }

    const onExit = (code) => fail(`The dev environment exited (code ${code}) before it was ready.`)
    supervisor.on('exit', onExit)

    const timer = setTimeout(
      () => fail(`The dev environment didn't become ready within ${READY_TIMEOUT / 1000}s.`),
      READY_TIMEOUT
    )

    const poll = setInterval(async () => {
      if (settled) return
      const status = readStatus()
      const built = status && status.state === 'idle' && status.startedAt >= spawnedAt
      if (built && (await isServerRunning()) && !settled) {
        finish()
        resolve(supervisor.pid)
      }
    }, 250)
  })
}

// Runs the same supervisor in the foreground: logs stream to this terminal, and
// Ctrl-C (which reaches us, not the detached supervisor) stops the environment.
// Resolves with an exit code.
export function runDevEnvForeground() {
  const supervisor = spawnSupervisor('inherit')
  const forward = () => killGroup(supervisor.pid)
  process.on('SIGINT', forward)
  process.on('SIGTERM', forward)

  return new Promise((resolve) => supervisor.on('exit', (code) => resolve(code ?? 0)))
}

// --- Stopping --------------------------------------------------------------

// Stops a running environment. Returns 'stopped', 'foreign' (something is running
// that we didn't start, so there is no pid to kill) or 'not-running'.
export async function stopDevEnv() {
  if (killRecordedEnv()) return 'stopped'
  return (await runningDevEnvPid()) ? 'foreign' : 'not-running'
}

// Kills the environment recorded in tmp/dev.pid, if it is still alive. Returns
// whether there was one. A live environment's pid file belongs to its supervisor,
// which removes it as it dies — we only clear one that nobody owns any more, so a
// supervisor that ignores SIGTERM stays reachable for a second `bin/dev stop`.
function killRecordedEnv() {
  const pid = recordedPid()
  if (!pid) {
    clearPidFile()
    return false
  }
  return killGroup(pid)
}

// --- Process plumbing ------------------------------------------------------

// Spawns the supervisor detached — its pid becomes a process group id, so
// killGroup() reaches every descendant — and records it in tmp/dev.pid. We write
// the file here because the caller needs the pid right away; the supervisor
// removes it again when it exits. A file left behind by a SIGKILLed supervisor is
// harmless: recordedPid() only reports pids that are still alive.
function spawnSupervisor(stdio) {
  ensureTmp()
  const supervisor = spawn(process.execPath, [SUPERVISOR], { detached: true, stdio })
  writeFileSync(PID_FILE, String(supervisor.pid))
  return supervisor
}

// Signals the process group led by `pid`. Everything we spawn is detached, so its
// pid *is* a group id. There is deliberately no fallback to signalling the bare
// pid: that would hit one process and leave the sh/npm/webpack/Ruby descendants we
// are trying to sweep, while reporting success.
function killGroup(pid, signal = 'SIGTERM') {
  try {
    process.kill(-pid, signal)
    return true
  } catch {
    return false
  }
}

// --- The supervisor --------------------------------------------------------

// Runs the process table and stays alive until it is signalled or a required
// process dies. Runs in the child spawned by spawnSupervisor(), never in-process.
function superviseDevEnv() {
  const processes = PROCESSES.filter(shouldRun)
  const width = Math.max(...processes.map((proc) => proc.name.length))
  const children = []
  let stopping = false

  const stop = (reason, code) => {
    if (stopping) return
    stopping = true
    note(reason)
    // Sweeps the children — and signals us too, hence the guard above. If we are
    // not a group leader (someone ran this file by hand from a non-interactive
    // shell), signal the children we know about instead.
    if (!killGroup(process.pid)) for (const child of children) child.kill('SIGTERM')

    const deadline = Date.now() + SHUTDOWN_GRACE
    const wait = setInterval(() => {
      const timedOut = Date.now() > deadline
      if (!children.every(hasExited) && !timedOut) return
      clearInterval(wait)
      if (recordedPid() === process.pid) clearPidFile() // before SIGKILL, which hits us too
      if (timedOut) killGroup(process.pid, 'SIGKILL')
      process.exit(code)
    }, 50)
  }

  processes.forEach((proc, index) => {
    const child = spawn(proc.command, {
      shell: true,
      cwd: proc.cwd && path.resolve(proc.cwd),
      env: { ...process.env, ...proc.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    prefixOutput(child, label(proc.name, index, width))
    child.on('exit', (code) => {
      if (stopping) return
      if (isOptional(proc)) {
        note(`${proc.name} exited (code ${code}) — carrying on without it.`)
      } else {
        stop(`${proc.name} exited (code ${code}) — stopping the dev environment.`, code ?? 1)
      }
    })
    children.push(child)
  })

  process.on('SIGINT', () => stop('Stopping the dev environment…', 0))
  process.on('SIGTERM', () => stop('Stopping the dev environment…', 0))
}

// A child killed by a signal reports its signal, not an exit code — reading only
// exitCode would leave every shutdown waiting out the full grace period.
const hasExited = (child) => child.exitCode !== null || child.signalCode !== null

// Only processes from a sibling repository are optional — and they are skipped
// when that repository isn't checked out.
const isOptional = (proc) => Boolean(proc.cwd)

function shouldRun(proc) {
  if (!isOptional(proc) || existsSync(path.resolve(proc.cwd))) return true
  note(`Skipping ${proc.name} — ${proc.cwd} is not checked out.`)
  return false
}

const LABEL_COLORS = [pc.cyan, pc.magenta, pc.yellow, pc.green]

const label = (name, index, width) => LABEL_COLORS[index % LABEL_COLORS.length](`${name.padEnd(width)} |`)

// Prefixes each line a child prints with its name, so one stream stays readable.
function prefixOutput(child, label) {
  for (const [stream, out] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    let rest = ''
    stream.on('data', (chunk) => {
      const lines = (rest + chunk).split('\n')
      rest = lines.pop()
      for (const line of lines) out.write(`${label} ${line}\n`)
    })
  }
}

const note = (message) => console.log(pc.blue(`dev | ${message}`))

// --- Small helpers ---------------------------------------------------------

function recordedPid() {
  try {
    const pid = Number(readFileSync(PID_FILE, 'utf8').trim())
    return isAlive(pid) ? pid : null
  } catch {
    return null
  }
}

function watcherPid() {
  const status = readStatus()
  return status && isAlive(status.pid) ? status.pid : null
}

function isAlive(pid) {
  if (!pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code === 'EPERM' // alive, but not ours to signal
  }
}

const ensureTmp = () => mkdirSync(path.dirname(PID_FILE), { recursive: true })

function clearPidFile() {
  try {
    unlinkSync(PID_FILE)
  } catch { /* already gone */ }
}

function tail(file, lines = 20) {
  try {
    return readFileSync(file, 'utf8').split('\n').slice(-lines).join('\n')
  } catch {
    return ''
  }
}

// Spawned as `node runner/dev_env.mjs` by spawnSupervisor(); a plain import of this
// module (bin/dev, run.mjs) never gets here.
if (process.argv[1] === SUPERVISOR) superviseDevEnv()
