// Dev-only: makes the runner wait until the watcher has produced a build that
// includes the developer's/agent's latest edit, so tests never run against stale
// code. All external inputs (status reader, source mtime, liveness, clock, sleep)
// are injectable so the logic is unit-tested without a real watcher or filesystem.

import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { readStatus } from './build_status.mjs'

const SKIP_DIRS = new Set(['node_modules', 'dist', 'tmp', '.git'])

// Files outside src/ and spec/ that webpack nevertheless compiles into dist/specs.js:
// spec/helpers/terminal_reporter.js imports poster.js, which pulls in the other two.
//
// The scanned set must equal the *watched* set in both directions. Miss a file the
// watcher watches and bin/test runs against a stale bundle — the one thing this module
// exists to prevent. Add a file the watcher does not watch (formatter.mjs, say, which
// runs in Node) and every run after editing it waits out the timeout instead.
export const BROWSER_RUNNER_FILES = [
  'runner/terminal/poster.js',
  'runner/terminal/log_value.mjs',
  'runner/terminal/dom_snapshot.js',
]

export function newestSourceMtime(root = process.cwd(), dirs = ['src', 'spec'], files = BROWSER_RUNNER_FILES) {
  let newest = 0
  let seen = 0
  for (let dir of dirs) {
    walk(path.join(root, dir), (mtime) => { seen++; if (mtime > newest) newest = mtime })
  }
  for (let file of files) {
    // Deliberately not swallowed: a renamed file would otherwise drop out of the scan
    // silently, and silently is how stale runs happen.
    let mtime = statSync(path.join(root, file)).mtimeMs
    seen++
    if (mtime > newest) newest = mtime
  }
  // No sources at all means the wrong cwd (or a broken checkout). Reporting 0 would say
  // "everything is fresh" and let the run proceed against whatever is in dist/.
  if (seen === 0) throw new Error(`No source files found under ${root}. Run from the project root.`)
  return newest
}

function walk(dir, onFile) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (let entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    let full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, onFile)
    } else {
      try { onFile(statSync(full).mtimeMs) } catch { /* ignore */ }
    }
  }
}

function defaultIsAlive(pid) {
  try { process.kill(pid, 0); return true } catch { return false }
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
  isAlive = defaultIsAlive,
  now = Date.now,
  sleep = defaultSleep,
  timeoutMs = 30_000,
} = {}) {
  if (newestMtime === undefined) newestMtime = newestSourceMtime()

  let status = read()
  if (!status) {
    throw new BuildSyncError('Build watcher not running (no tmp/build-status.json). Start it with `bin/dev`.')
  }
  if (!isAlive(status.pid)) {
    throw new BuildSyncError('Build watcher not running (its process is gone). Start it with `bin/dev`.')
  }

  let deadline = now() + timeoutMs
  while (true) {
    status = read()
    if (status && status.state === 'idle' && status.startedAt >= newestMtime) {
      if (status.ok === false) throw new BuildFailedError(status.errors || '(no error output captured)')
      return status
    }
    if (now() >= deadline) {
      throw new BuildSyncError(`Build watcher didn't rebuild for your latest edit within ${Math.round(timeoutMs / 1000)}s.`)
    }
    await sleep(100)
  }
}
