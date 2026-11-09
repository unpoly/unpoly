// The build-status protocol, in one place: the writer that the dev watcher (watch.mjs) uses for
// tmp/build-status.json, and the reader that build_sync.mjs, `bin/dev status` and the scratch
// server use. The watcher rebuilds every bundle together, in rounds, and reports a round as
// "idle" only once all of its bundles are written, so a runner never reads a half-written dist/.

import { writeFileSync, mkdirSync, readFileSync, renameSync } from 'node:fs'
import path from 'node:path'

// The repo root, derived from this file rather than the cwd: a `bin/test` run from a
// subdirectory has to read the very file the watcher wrote, and resolving against the cwd
// silently read a different (absent) path — which reported a healthy watcher as missing.
export const PROJECT_ROOT = path.dirname(path.dirname(path.dirname(import.meta.filename)))
export const STATUS_PATH = 'tmp/build-status.json'

export function readStatus(root = PROJECT_ROOT) {
  try {
    return JSON.parse(readFileSync(path.join(root, STATUS_PATH), 'utf8'))
  } catch {
    return null
  }
}

// Only the watcher creates one of these, so there is exactly one writer. (Under webpack, a
// one-shot `bin/build --config=ci` reused the watcher's plugin and overwrote a running
// watcher's status with its own pid; everything that read the file then saw a dead process.)
export class BuildStatus {
  #startedAt
  #sink
  #now

  // `write` and `now` are seams for the self-tests; production uses the file writer and
  // the wall clock.
  constructor({ write = writeStatusFile, now = Date.now } = {}) {
    this.#sink = write
    this.#now = now
    this.#startedAt = now()
  }

  // A round of rebuilds begins. Called before any bundle reads a source, so `startedAt` is
  // older than every file the round sees: waitForFreshBuild() trusts a round to include an edit
  // only if the round started after the edit's mtime.
  start() {
    this.#startedAt = this.#now()
    this.#write('building', [])
  }

  // The round is over, and dist/ is complete. `errors` are formatted messages (build and lint),
  // empty for a clean round. Also called when a round fails in an unexpected way, so the status
  // never stays "building" for ever.
  finish(errors) {
    this.#write('idle', errors)
  }

  #write(state, errors) {
    this.#sink({
      pid: process.pid,
      state,
      startedAt: this.#startedAt,
      ok: errors.length === 0,
      // Several bundles build the same source (modern/es6, unpoly/specs…), so the same file's
      // error shows up more than once. Collapse the duplicates.
      errors: [...new Set(errors)].join('\n\n'),
    })
  }
}

function writeStatusFile(status) {
  try {
    writeAtomically(path.join(PROJECT_ROOT, STATUS_PATH), JSON.stringify(status))
  } catch {
    // best effort — never fail a build over status bookkeeping
  }
}

// The other direction, runner → watcher: a request to rebuild for a file the watcher has not
// reacted to. Should never be needed, since the watcher sees every change in the source
// directories. It is the backstop for a missed file event (an inotify limit, a network
// filesystem, a Node bug), which would otherwise run bin/test against a stale bundle. The file
// holds the path of the file, relative to the project root, or nothing.
export const REQUEST_PATH = 'tmp/build-request'

export function requestBuild(file, root = PROJECT_ROOT) {
  try {
    writeAtomically(path.join(root, REQUEST_PATH), file ?? '')
  } catch {
    // best effort: without the request, waitForFreshBuild() falls back to its grace period
  }
}

export function readBuildRequest(root = PROJECT_ROOT) {
  try {
    return readFileSync(path.join(root, REQUEST_PATH), 'utf8') || null
  } catch {
    return null
  }
}

// Write-then-rename, because a reader polling every 100ms can otherwise catch a half-written
// file: readStatus() returns null for it, and the runner reported a healthy watcher as missing.
function writeAtomically(file, content) {
  mkdirSync(path.dirname(file), { recursive: true })
  let temp = `${file}.${process.pid}.tmp`
  writeFileSync(temp, content)
  renameSync(temp, file)
}
