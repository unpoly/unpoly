// Dev-only: makes the runner wait until the watcher has produced a build that
// includes the developer's/agent's latest edit, so tests never run against stale
// code. All external inputs (status reader, source mtime, liveness, clock, sleep)
// are injectable so the logic is unit-tested without a real watcher or filesystem.

import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { readStatus, requestBuild, PROJECT_ROOT } from './build_status.mjs'

// Never scanned or watched.
export const SKIP_DIRS = new Set(['node_modules', 'dist', 'tmp', '.git'])

// Where a bundle input can live. `src` and `spec` are obvious; `tooling/runner/browser` is here
// because spec/helpers/terminal_reporter.js imports poster.js from it, which pulls in
// log_value.mjs and dom_snapshot.js — so those are compiled into dist/specs.js like any other
// source. It is that directory rather than all of `tooling` because everything else under
// `tooling` runs in Node and can never be bundled, and scanning it would spend the grace period
// (and print the "nothing rebuilt" notice) on every edit to the tooling itself. The boundary is
// not a guess: the directory exists to hold the browser-side runner, and a self-test walks the
// imports from poster.js and fails if any of them lands outside a scanned directory.
//
// The dev watcher (watch.mjs) watches the same directories.
//
// We deliberately do **not** try to tell inputs from non-inputs. Every scheme for it is a
// hand-maintained approximation of the bundler's dependency graph, and it drifts the moment anyone
// adds a file: `src` alone holds 117 guide pages, an images tree of diagrams and recordings and
// an `.htaccess`; `spec` holds two fixture videos. A path list or an extension allowlist would
// have to be extended for the next README somebody writes.
//
// A residue remains that no extension list can catch: a file with a watchable extension that
// no bundle imports — a `.js` under src/ that nothing requires, say. That is
// what IDLE_GRACE_MS is for. It costs three seconds and needs no maintenance. Missing a real input is the failure that actually matters — it runs the suite
// against a stale bundle without saying so — and over-scanning cannot cause it.
export const SOURCE_DIRS = ['src', 'spec', 'tooling/runner/browser']

// The extensions a bundle can import, from LOADED_EXTENSIONS in tooling/build/esbuild.mjs. Also
// what makes the dev watcher start a rebuild.
//
// An allowlist, not a list of things to skip. A skip list only skips what someone remembered to
// name, so every guide page, diagram, fixture video and `.htaccess` had to be enumerated, and the
// next one silently rots it. This way anything that is not a build input is ignored by default,
// including file types nobody has invented yet, and only a *new loader* needs attention — a
// deliberate edit to the build, guarded by a self-test that fails if esbuild.mjs loads an
// extension that isn't listed here. (The list is not imported from there, because that would
// load esbuild and Sass into every `bin/test` run.)
//
// `.mjs` is listed for tooling/runner/browser/log_value.mjs, which is bundled into dist/specs.js.
// Elsewhere under the scanned directories there are no `.mjs` files.
export const WATCHABLE_SUFFIXES = ['.js', '.ts', '.mjs', '.js.erb', '.css', '.sass', '.scss']

const isWatchable = (name) => WATCHABLE_SUFFIXES.some((suffix) => name.endsWith(suffix))

// The newest file the watcher might rebuild for, as `{ mtime, file }`. The path is carried so the
// caller can name it — either when reporting that nothing rebuilt, or on a timeout.
//
// Directories count too. Deleting or moving a file changes no file's mtime, only its directory's,
// and moved files keep theirs. Without the directory, a run started right after `rm` would find
// everything fresh before the watcher had even seen the deletion. A non-source file (a guide
// page, an image, a swap file) moves its directory's mtime too, so the watcher answers every
// change in these directories with a round, an empty one if nothing needs building.
export function newestSource(root = PROJECT_ROOT, dirs = SOURCE_DIRS) {
  let newest = 0
  let newestFile = null
  let seen = 0
  let consider = (mtime, full) => {
    if (mtime > newest) { newest = mtime; newestFile = full }
  }

  for (let dir of dirs) {
    let full = path.join(root, dir)
    try { consider(statSync(full).mtimeMs, full) } catch { continue }
    walk(full, (mtime, file) => {
      seen++
      consider(mtime, file)
    }, consider)
  }

  // No sources at all means the wrong cwd (or a broken checkout). Reporting 0 would say
  // "everything is fresh" and let the run proceed against whatever is in dist/.
  if (seen === 0) throw new Error(`No source files found under ${root}. Run from the project root.`)
  return { mtime: newest, file: newestFile && path.relative(root, newestFile) }
}

export function newestSourceMtime(...args) {
  return newestSource(...args).mtime
}

function walk(dir, onFile, onDir) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (let entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    let full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      try { onDir(statSync(full).mtimeMs, full) } catch { /* ignore */ }
      walk(full, onFile, onDir)
    } else if (isWatchable(entry.name)) {
      try { onFile(statSync(full).mtimeMs, full) } catch { /* ignore */ }
    }
  }
}

function defaultIsAlive(pid) {
  try { process.kill(pid, 0); return true } catch { return false }
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// How long to wait for the watcher to react before asking it to rebuild (see requestBuild()).
// The watcher answers every change in the source directories with a round, 20 ms after the
// event, so after a second it has missed the change, not just been slow about it.
const REQUEST_AFTER_MS = 1_000

// How long to wait for the watcher to react before concluding it is not going to. Only a watcher
// that does not answer requests gets here: one started before requests existed, or one that has
// lost its watch on tmp/.
const IDLE_GRACE_MS = 3_000

export class BuildSyncError extends Error {}

// The watcher produced a fresh build, but it has compile/lint errors.
export class BuildFailedError extends Error {
  constructor(errors) {
    super('Build failed')
    this.errors = errors
  }
}

export async function waitForFreshBuild({
  read = () => readStatus(),
  newestMtime,
  newestFile = null,
  isAlive = defaultIsAlive,
  now = Date.now,
  sleep = defaultSleep,
  timeoutMs = 30_000,
  requestAfterMs = REQUEST_AFTER_MS,
  idleGraceMs = IDLE_GRACE_MS,
  request = requestBuild,
} = {}) {
  if (newestMtime === undefined) {
    const newest = newestSource()
    newestMtime = newest.mtime
    newestFile = newest.file
  }

  let status = read()
  if (!status) {
    throw new BuildSyncError('Build watcher not running (no tmp/build-status.json). Start it with `bin/dev`.')
  }
  if (!isAlive(status.pid)) {
    throw new BuildSyncError('Build watcher not running (its process is gone). Start it with `bin/dev`.')
  }

  const enteredAt = now()
  const startedAtOnEntry = status.startedAt
  let deadline = enteredAt + timeoutMs
  let requestedAt = null
  while (true) {
    status = read()
    let idle = status?.state === 'idle'
    if (idle && status.startedAt >= newestMtime) {
      if (status.ok === false) throw new BuildFailedError(status.errors || '(no error output captured)')
      // `missedEdit` names the file the watcher only built on request, so a watcher that misses
      // changes doesn't go unnoticed.
      return requestedAt === null ? status : { ...status, missedEdit: newestFile }
    }
    let time = now()
    let untouched = idle && status.startedAt === startedAtOnEntry
    if (untouched && requestedAt === null && time - enteredAt >= requestAfterMs) {
      requestedAt = time
      request(newestFile)
    }
    // The watcher built on our request, and still not past `newestMtime`: that lies in the
    // future (a clock skew, `touch -d`). No build will ever get past it, so run.
    if (idle && requestedAt !== null && status.startedAt >= requestedAt) {
      if (status.ok === false) throw new BuildFailedError(status.errors || '(no error output captured)')
      return { ...status, unbuiltEdit: newestFile }
    }
    // Nothing is going to happen: the watcher did not react to the change or to our request.
    // dist/ may well be current anyway (an old watcher does not answer guide-page saves), so
    // run. `unbuiltEdit` lets the caller say which file it was; reading that name is what tells
    // you whether to be relaxed (`pages/foo.md`) or suspicious (`unpoly/link.js`).
    if (untouched && time - enteredAt >= idleGraceMs) {
      if (status.ok === false) throw new BuildFailedError(status.errors || '(no error output captured)')
      return { ...status, unbuiltEdit: newestFile }
    }
    if (time >= deadline) {
      // Reaching here means the watcher kept working without ever finishing a build that
      // includes the edit — a build that never settles, or one rebuild chasing another. "Nothing
      // rebuilt at all" no longer lands here; it is handled above.
      const edit = newestFile ? ` (newest edit: ${newestFile})` : ''
      throw new BuildSyncError(`Build watcher didn't finish a build including your latest edit within ${Math.round(timeoutMs / 1000)}s${edit}. Check its output in tmp/dev.log, or restart it with \`bin/dev stop && bin/dev\`.`)
    }
    await sleep(100)
  }
}
