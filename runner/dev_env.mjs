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

import { execFileSync, spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { closeSync, existsSync, openSync, readFileSync, writeSync, unlinkSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import { isServerRunning } from './server/server.mjs'
import { readStatus } from './terminal/build_status.mjs'

// The environment, in one place. A process with a `cwd` lives in a sibling
// repository: it is skipped when that repository isn't checked out, and its death
// never takes the environment down. `server` deliberately sets no PORT —
// inheriting it keeps the server on the port isServerRunning() probes.
const PROCESSES = [
  { name: 'watch',       command: 'bin/build --config=development --watch' },
  { name: 'server',      command: 'bin/test-server' },
  { name: 'docs',        command: 'bundle exec middleman server', cwd: '../unpoly-site',         env: { PORT: '4567' } },
  { name: 'manual-test', command: 'bundle exec rails server',     cwd: '../unpoly-manual-tests', env: { PORT: '4001' } },
]

const SUPERVISOR = import.meta.filename
// The repo root (this file lives in runner/). Local processes run from here so the
// relative `bin/…` commands resolve no matter where `bin/dev` was invoked.
const PROJECT_ROOT = path.dirname(path.dirname(SUPERVISOR))

// Absolute, not cwd-relative, so every caller refers to the same files no matter where it
// was invoked from. That is not enough to make bin/test work from a subdirectory: the
// build status is still resolved against the cwd, so such a run either fails in
// waitForFreshBuild() or — if it started the environment itself — waits out
// READY_TIMEOUT and then kills the healthy environment it just booted. Run from the root.
const PID_FILE = path.join(PROJECT_ROOT, 'tmp/dev.pid')
const LOG_FILE = path.join(PROJECT_ROOT, 'tmp/dev.log')
// Held only while a start is in progress, to serialise concurrent starts. Not a
// service: nothing ever connects to it.
const START_LOCK_PORT = 4099
const READY_TIMEOUT = 60_000
const SHUTDOWN_GRACE = 5_000

// --- Detecting -------------------------------------------------------------

// devEnvState() is the *only* place that decides whether an environment exists.
// Everything asks here and switches on the answer. Two functions read the file directly
// without deciding anything: startUnderLock() confirms its own claim, and the supervisor
// checks whether the file is still its own before removing it.
//
// Two rules make that answer trustworthy:
//
//   1. A live pid proves nothing. The OS recycles pids, so tmp/dev.pid can name a
//      stranger — we once refused to start because an unrelated `node` had inherited
//      our old pid. We therefore also check that the process *is* one of our
//      supervisors, and we never signal a pid that isn't.
//   2. Liveness comes from the spec server's socket, which the OS closes when the
//      process dies. It cannot go stale and no other process can forge it. In
//      particular we no longer read tmp/build-status.json here: any one-shot build
//      could overwrite it and make a healthy environment look dead.
//
//   'running'      our supervisor is alive and the server answers — usable
//   'booting'      our supervisor is alive, the server does not answer yet
//   'foreign'      the server answers but we didn't start it (someone ran the
//                  processes by hand) — usable, but not ours to stop
//   'unidentified' tmp/dev.pid names a live process we cannot identify — we neither
//                  signal it nor start alongside it, and say so
//   'none'         nothing is running
//
// The dependencies are injectable so the state machine can be unit-tested.
export async function devEnvState({ owner = pidFileOwner, serving = isServerRunning } = {}) {
  const { pid, owner: whose } = owner()
  const answers = await serving()

  if (whose === 'ours') return { state: answers ? 'running' : 'booting', pid }
  if (whose === 'unknown') return { state: 'unidentified', pid }
  // 'gone', or a recycled pid belonging to a stranger: nothing of ours is recorded.
  return { state: answers ? 'foreign' : 'none', pid: null }
}

// Whether specs can be run: something is serving, ours or not.
export async function isDevEnvRunning() {
  const { state } = await devEnvState()
  return state === 'running' || state === 'foreign'
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
export async function startDevEnv() {
  // The lock covers everything up to and including the pid write — see startUnderLock().
  // Waiting for readiness takes up to a minute and deliberately happens outside it: by
  // then tmp/dev.pid names a live supervisor, so another start sees 'booting' and stops.
  const supervisor = await withStartLock(() => startUnderLock(backgroundStdio))
  supervisor.unref()
  return waitUntilReady(supervisor)
}

// The critical section: decide, take over a leftover, claim, spawn, record the pid.
// Every step must be inside the lock. Two earlier versions released it before the pid
// was written, and since readPidFile() maps an empty file to null, a racer arriving in
// that window saw 'none' and cleared the winner's own fresh claim.
export async function startUnderLock(openStdio, { probe = devEnvState, spawnIt = spawnSupervisor, file = PID_FILE } = {}) {
  const { state, pid } = await probe()
  if (state !== 'none') throw existingEnvError(state, pid)

  // Safe only under the lock: 'none' means no live supervisor owns this file, so it is
  // a leftover from a SIGKILLed one, and nobody else can be claiming it right now.
  clearPidFile(file)
  const claim = claimPidFile(file)
  if (!claim) throw new Error(`Could not claim ${file}. Remove it and try again.`)

  // Only now, past the point of no return, do we touch the log — opening it truncates,
  // and a start that turns back here would otherwise wipe a live environment's log. The
  // lock does not help with that: a winner releases it in milliseconds and then boots
  // for ~15s, during which a second `bin/test` sees 'booting' and turns back right here.
  const { stdio, close } = openStdio()
  try {
    const supervisor = spawnIt(stdio, claim)
    if (readPidFile(file) !== supervisor.pid) {
      killGroup(supervisor.pid)
      throw new Error(`${file} changed while starting. Try again.`)
    }
    return supervisor
  } finally {
    close() // the supervisor holds its own copy of the fds now
  }
}

// `bin/test` sends the supervisor's output to tmp/dev.log; `bin/dev` inherits the
// terminal. Both are opened lazily, so a start that never gets going touches nothing.
const backgroundStdio = () => {
  const logFd = openSync(LOG_FILE, 'w')
  return { stdio: ['ignore', logFd, logFd], close: () => closeSync(logFd) }
}

const foregroundStdio = () => ({ stdio: 'inherit', close: () => {} })

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
export async function runDevEnvForeground() {
  const supervisor = await withStartLock(() => startUnderLock(foregroundStdio))
  const forward = () => killGroup(supervisor.pid)
  process.on('SIGINT', forward)
  process.on('SIGTERM', forward)

  return new Promise((resolve) => supervisor.on('exit', (code) => resolve(code ?? 0)))
}

// --- Stopping --------------------------------------------------------------

// Stops a running environment. Returns 'stopped', 'foreign' (something is serving
// that we didn't start, so there is no pid of ours to kill) or 'not-running'.
//
// We only ever signal a supervisor of ours — see devEnvState(). A live environment's
// pid file belongs to its supervisor, which removes it as it exits, so we clear the
// file only when nobody owns it any more; a supervisor that ignores SIGTERM stays
// reachable for a second `bin/dev stop`.
export async function stopDevEnv() {
  const { state, pid } = await devEnvState()
  switch (state) {
    case 'running':
    case 'booting':
      return { result: killGroup(pid) ? 'stopped' : 'not-running', pid }
    case 'foreign':
      return { result: 'foreign', pid }
    case 'unidentified':
      return { result: 'unidentified', pid } // alive but unreadable: never signal it
    default:
      // Deliberately *not* clearing a leftover file here. Probing and then unlinking are
      // two steps, and unlocked they race a concurrent start: we could unlink the pid
      // file of an environment that came up in between, leaving it unstoppable. A
      // leftover is inert anyway — devEnvState() reports 'none' for it — and the next
      // start clears it inside the lock, where that is safe.
      return { result: 'not-running', pid }
  }
}

// Thrown when a start is refused because an environment already exists. Flagged so
// callers can treat it as "you asked for one and there is one" rather than a failure.
function existingEnvError(state, pid) {
  const error = new Error(alreadyRunning(state, pid))
  // 'unidentified' deliberately excluded from devEnvExists: it means we cannot *prove*
  // an environment exists, and bin/test refuses to run in that state — so `bin/dev start`
  // must not report success for it either. It is still an expected refusal, not a bug,
  // hence `expected`: the caller prints the message rather than a stack trace.
  error.devEnvExists = state !== 'unidentified'
  error.expected = true
  return error
}

function alreadyRunning(state, pid) {
  switch (state) {
    case 'foreign':
      return 'A dev environment is running that bin/dev did not start. Stop it where you started it.'
    case 'unidentified':
      return `${PID_FILE} names PID ${pid}, which is alive but cannot be identified. Check it, then remove the file if nothing is running.`
    default:
      return `A dev environment is already ${state} (PID ${pid}). Wait for it, or stop it with \`bin/dev stop\`.`
  }
}

// --- Process plumbing ------------------------------------------------------

// Spawns the supervisor detached — its pid becomes a process group id, so
// killGroup() reaches every descendant — and records it in tmp/dev.pid. We write
// the file here because the caller needs the pid right away; the supervisor
// removes it again when it exits. We write it here, rather than letting the supervisor
// do it, because the pid must land while the start lock is still held. A file left behind
// by a SIGKILLed supervisor is harmless: devEnvState() ignores a pid that is dead *or*
// no longer a supervisor, and the next start clears it under the lock.
function spawnSupervisor(stdio, claim) {
  const supervisor = spawn(process.execPath, [SUPERVISOR], { detached: true, stdio })
  // A launch failure (EAGAIN, ENOMEM) is reported asynchronously and leaves pid
  // undefined. Claim it here so it cannot resurface later as an uncaught exception;
  // waitUntilReady() reports it through the 'exit' it also raises.
  supervisor.on('error', (error) => note(`the dev environment failed to start: ${error.message}`))
  if (!supervisor.pid) throw new Error(`Could not spawn the dev environment (${SUPERVISOR}).`)

  writeSync(claim, String(supervisor.pid)) // fill in the claim we already hold
  closeSync(claim)
  return supervisor
}

// Creates tmp/dev.pid, or returns null if it already exists. O_EXCL makes that atomic.
function claimPidFile(file = PID_FILE) {
  ensureTmp()
  try {
    return openSync(file, 'wx')
  } catch (error) {
    if (error.code === 'EEXIST') return null
    throw error
  }
}

// Serialises the whole start sequence by holding a listening socket for its duration.
// A socket is the one lock we can take without a dependency that the OS also releases
// for us: it cannot outlive the process holding it, so unlike a lock file it can never
// go stale and need recovering. Nothing connects to it; binding *is* the lock.
export async function withStartLock(body) {
  const server = createServer()
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(START_LOCK_PORT, '127.0.0.1', resolve)
    })
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      throw new Error(`Port ${START_LOCK_PORT} is taken, which means another dev environment is starting right now — or something unrelated is listening there. Wait for it, or check the port.`)
    }
    server.close()
    throw error
  }

  try {
    return await body()
  } finally {
    server.close()
  }
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
      if (readPidFile() === process.pid) clearPidFile() // before SIGKILL, which hits us too
      if (timedOut) killGroup(process.pid, 'SIGKILL')
      process.exit(code)
    }, 50)
  }

  processes.forEach((proc, index) => {
    const child = spawn(proc.command, {
      shell: true,
      cwd: proc.cwd ? path.resolve(proc.cwd) : PROJECT_ROOT,
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

// The pid in tmp/dev.pid, whatever its state. The only function that reads the file
// — everything else goes through devEnvState().
function readPidFile(file = PID_FILE) {
  try {
    const pid = Number(readFileSync(file, 'utf8').trim())
    return Number.isInteger(pid) && pid > 0 ? pid : null
  } catch {
    return null
  }
}

// What tmp/dev.pid currently refers to: { pid, owner }, where owner is
//
//   'ours'      a live process running this file — safe to report and to signal
//   'stranger'  alive, but something else: the pid was recycled
//   'unknown'   alive, but we cannot read its command line to tell
//   'gone'      no file, or the pid is dead
//
// 'unknown' is kept distinct from 'stranger' on purpose. Both refuse to signal, but
// only a *proven* stranger may be treated as absent — guessing "not ours" where we
// cannot look (no /proc and no usable `ps`, hidepid) would clear the file and start a
// second environment alongside a healthy one. A zombie is not one of those cases: its
// /proc entry exists and reads empty, which is a proven stranger, and starting beside
// something that holds nothing is right.
function pidFileOwner() {
  const pid = readPidFile()
  if (!pid || !isAlive(pid)) return { pid, owner: 'gone' }

  const command = commandLine(pid)
  if (command === null) return { pid, owner: 'unknown' }
  return { pid, owner: isSupervisor(command) ? 'ours' : 'stranger' }
}

function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code === 'EPERM' // alive, but not ours to signal
  }
}

// Whether `pid` is running this very file. Guards against a recycled pid, which
// would otherwise make us refuse to start — or, worse, signal a stranger's process
// group. When we cannot tell, we say no: declining to kill something we can't
// identify is the safe half of the trade, and a stale pid file is easy to recover
// from (`bin/dev stop`, or just starting again).
// A supervisor runs as `node <SUPERVISOR>`, and we require *both* parts. Matching the
// path alone would also accept `vim …/dev_env.mjs`, `tail -f` on it, or a `pgrep` whose
// own arguments mention it — and a recycled pid landing on one of those would let us
// signal a stranger's process group.
//
// On Linux we get a real argv and compare it exactly. The `ps` fallback can only offer
// a space-joined string, where splitting breaks for paths containing spaces, so there
// we settle for "mentions node and mentions the path".
export function isSupervisor(command) {
  if (Array.isArray(command)) return isNode(command[0]) && command[1] === SUPERVISOR
  return command.split(/\s+/).some(isNode) && command.includes(SUPERVISOR)
}

// Any node-ish binary, not just the one *we* run: the supervisor inherits the execPath
// of whoever started it, so a `bin/dev stop` from a shell where node resolves to `node`
// must still recognise a supervisor started under `nodejs` or `node22`. Getting this
// wrong makes a user unable to stop their own environment, or spawns a second one beside
// it. Paired with the exact argv[1] match above, this is strict enough.
const isNode = (executable = '') => {
  const name = path.basename(executable)
  return /^node/i.test(name) || name === path.basename(process.execPath)
}

// The command line of `pid` as an argv array (Linux) or a string (`ps`), or null when
// we cannot tell — which is *not* the same as "not a supervisor". See pidFileOwner().
function commandLine(pid) {
  try {
    return readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean)
  } catch { /* no /proc: BSD, macOS, or a restricted mount */ }

  try {
    // -ww: unlimited width. Without it `ps` truncates to the terminal width — 80
    // columns when its output is a pipe, which is shorter than a typical
    // `node /Users/…/runner/dev_env.mjs`, so every supervisor looked foreign.
    return execFileSync('ps', ['-ww', '-o', 'command=', '-p', String(pid)], { encoding: 'utf8' })
  } catch {
    return null
  }
}

const ensureTmp = () => mkdirSync(path.dirname(PID_FILE), { recursive: true })

function clearPidFile(file = PID_FILE) {
  try {
    unlinkSync(file)
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
