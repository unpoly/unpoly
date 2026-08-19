// Dev-only: makes the runner wait until the watcher has produced a build that
// includes the developer's/agent's latest edit, so tests never run against stale
// code. All external inputs (status reader, source mtime, liveness, clock, sleep)
// are injectable so the logic is unit-tested without a real watcher or filesystem.

import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { readStatus, PROJECT_ROOT } from './build_status.mjs'

const SKIP_DIRS = new Set(['node_modules', 'dist', 'tmp', '.git'])

// Where a webpack input can live. `src` and `spec` are obvious; `tooling/runner/browser` is here
// because spec/helpers/terminal_reporter.js imports poster.js from it, which pulls in
// log_value.mjs and dom_snapshot.js — so those are compiled into dist/specs.js like any other
// source. It is that directory rather than all of `tooling` because everything else under
// `tooling` runs in Node and can never be bundled, and scanning it would spend the grace period
// (and print the "nothing rebuilt" notice) on every edit to the tooling itself. The boundary is
// not a guess: the directory exists to hold the browser-side runner, and a self-test walks the
// imports from poster.js and fails if any of them lands outside a scanned directory.
//
// We deliberately do **not** try to tell inputs from non-inputs. Every scheme for it is a
// hand-maintained approximation of webpack's dependency graph, and it drifts the moment anyone
// adds a file: `src` alone holds 117 guide pages, an images tree of diagrams and recordings and
// an `.htaccess`; `spec` holds two fixture videos; `tooling` holds Node-only `.mjs` modules and
// the webpack configs themselves. A path list or an extension allowlist would have to be
// extended for the next README somebody writes.
//
// A residue remains that no extension list can catch: a file with a watchable extension that
// webpack nevertheless does not import — a `.js` under src/ that nothing requires, say. That is
// what IDLE_GRACE_MS is for. It costs three seconds and needs no maintenance. Missing a real input is the failure that actually matters — it runs the suite
// against a stale bundle without saying so — and over-scanning cannot cause it.
export const SOURCE_DIRS = ['src', 'spec', 'tooling/runner/browser']

// The extensions webpack has a loader for, from the rules in tooling/build/webpack/shared.js:
// `/\.js$/` and `/\.js\.erb$/` (both via ts-loader) and `/\.(css|sass|scss)$/`. `.ts` is listed
// because ts-loader is already configured for it.
//
// An allowlist, not a list of things to skip. A skip list only skips what someone remembered to
// name, so every guide page, diagram, fixture video and `.htaccess` had to be enumerated, and the
// next one silently rots it. This way anything that is not a build input is ignored by default,
// including file types nobody has invented yet, and only a *new loader* needs attention — a
// deliberate edit to the webpack config, guarded by a self-test that fails if an extension gains
// a loader without being listed here.
//
// Known gap: tooling/runner/browser/log_value.mjs is bundled into dist/specs.js but `.mjs` is not
// listed, since it otherwise means Node-only throughout tooling/. Editing that one file is not
// detected, so a run started within about a second of saving it can use the previous build. It is
// a pure formatting helper that changes rarely, and a second run is correct.
export const WATCHABLE_SUFFIXES = ['.js', '.ts', '.js.erb', '.css', '.sass', '.scss']

const isWatchable = (name) => WATCHABLE_SUFFIXES.some((suffix) => name.endsWith(suffix))

// The newest file webpack might rebuild for, as `{ mtime, file }`. The path is carried so the
// caller can name it — either when reporting that nothing rebuilt, or on a timeout.
export function newestSource(root = PROJECT_ROOT, dirs = SOURCE_DIRS) {
  let newest = 0
  let newestFile = null
  let seen = 0

  for (let dir of dirs) {
    walk(path.join(root, dir), (mtime, full) => {
      seen++
      if (mtime > newest) { newest = mtime; newestFile = full }
    })
  }

  // No sources at all means the wrong cwd (or a broken checkout). Reporting 0 would say
  // "everything is fresh" and let the run proceed against whatever is in dist/.
  if (seen === 0) throw new Error(`No source files found under ${root}. Run from the project root.`)
  return { mtime: newest, file: newestFile && path.relative(root, newestFile) }
}

export function newestSourceMtime(...args) {
  return newestSource(...args).mtime
}

function walk(dir, onFile) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (let entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    let full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, onFile)
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

// How long to wait for the watcher to react before concluding it is not going to. Webpack
// starts a build well within a second of a change it cares about; three seconds is generous
// enough to survive polling on a network or WSL filesystem, and the cost of being generous is
// only that a docs-only edit delays a run by that much.
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
  idleGraceMs = IDLE_GRACE_MS,
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
  while (true) {
    status = read()
    if (status && status.state === 'idle' && status.startedAt >= newestMtime) {
      if (status.ok === false) throw new BuildFailedError(status.errors || '(no error output captured)')
      return status
    }
    // Nothing is going to happen. The watcher reacts to a change it cares about in well under a
    // second, so an idle status whose build has not moved after the grace period means our
    // newest file is not one webpack consumes — a guide page, an image, a Node-only module.
    // dist/ is already current for everything webpack does read, so run. `unbuiltEdit` lets the
    // caller say which file it was; reading that name is what tells you whether to be relaxed
    // (`pages/foo.md`) or suspicious (`unpoly/link.js`), with no list to maintain.
    if (status && status.state === 'idle' && status.startedAt === startedAtOnEntry && now() - enteredAt >= idleGraceMs) {
      if (status.ok === false) throw new BuildFailedError(status.errors || '(no error output captured)')
      return { ...status, unbuiltEdit: newestFile }
    }
    if (now() >= deadline) {
      // Reaching here means the watcher kept working without ever finishing a build that
      // includes the edit — a build that never settles, or one rebuild chasing another. "Nothing
      // rebuilt at all" no longer lands here; it is handled above.
      const edit = newestFile ? ` (newest edit: ${newestFile})` : ''
      throw new BuildSyncError(`Build watcher didn't finish a build including your latest edit within ${Math.round(timeoutMs / 1000)}s${edit}. Check its output in tmp/dev.log, or restart it with \`bin/dev stop && bin/dev\`.`)
    }
    await sleep(100)
  }
}
