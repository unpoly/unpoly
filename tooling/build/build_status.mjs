// The build-status protocol, in one place: the writer that the dev watcher (watch.mjs) uses for
// tmp/build-status.json, and the reader that build_sync.mjs, `bin/dev status` and the scratch
// server use. The watcher rebuilds every bundle together, in rounds, and reports a round as
// "idle" only once all of its bundles are written, so a runner never reads a half-written dist/.

import { writeFileSync, mkdirSync, readFileSync, renameSync, unlinkSync } from 'node:fs'
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
//
// Besides the state, the status says which edits the watcher's builds include, file by file, so
// that waitForFreshBuild() can tell a missed edit from one that was built. A start time alone
// couldn't: any later round, for another file or for a swap file, would certify every older
// edit, including one the watcher never saw. `fullStartedAt` is the start of the last round
// that built and linted everything, so it includes every edit older than that. `seen` maps the
// files and directories the watcher had an event for since then (relative to the project root)
// to the start of the last round after such an event.
//
// `types` reports the watcher's type check (see TypeChecks in watch.mjs), which runs after the
// rounds, so that bin/test gets its bundles as early as without it. It doesn't touch `state`, `ok`
// or `errors`, which only ever report the bundles and the linter: a type error doesn't fail a
// build. `types.state` is "checking" from the start of a round that changes a file the check
// reads until a check that started after that round is done, then "done". `types.startedAt` is
// when that check started, `types.ok` and `types.errors` (formatted like `errors`) what it
// found. While checking, they are null and empty. A watcher from before the type check writes no
// `types` at all.
export class BuildStatus {
  #startedAt
  #fullStartedAt = null
  #seen = new Map()
  #state = 'building'
  #errors = []
  #types = { state: 'checking', startedAt: null, ok: null, errors: '' }
  #sink
  #now
  #root

  // `write`, `now` and `root` are seams for the self-tests; production uses the file writer, the
  // wall clock and the project root.
  constructor({ write = writeStatusFile, now = Date.now, root = PROJECT_ROOT } = {}) {
    this.#sink = write
    this.#now = now
    this.#root = root
    this.#startedAt = now()
  }

  // A round of rebuilds begins. Called before any bundle reads a source, so `startedAt` is
  // older than every file the round sees: waitForFreshBuild() trusts a round to include an edit
  // only if the round started after the edit's mtime.
  //
  // `seen` are the absolute paths that had an event since the last round. `full` says that the
  // round builds and lints everything.
  start({ seen = [], full = false } = {}) {
    this.#startedAt = this.#now()
    if (full) {
      this.#fullStartedAt = this.#startedAt
      this.#seen.clear()
    } else {
      for (let file of seen) {
        if (file) this.#seen.set(path.relative(this.#root, file), this.#startedAt)
      }
    }
    this.#state = 'building'
    this.#errors = []
    this.#write()
  }

  // The round is over, and dist/ is complete. `errors` are formatted messages (build and lint),
  // empty for a clean round. Also called when a round fails in an unexpected way, so the status
  // never stays "building" for ever.
  finish(errors) {
    this.#state = 'idle'
    this.#errors = errors
    this.#write()
  }

  // The last type check no longer includes every edit: a round changed a file that it reads.
  startTypes() {
    this.#types = { state: 'checking', startedAt: null, ok: null, errors: '' }
    this.#write()
  }

  // A type check that started at `startedAt` is done. `errors` are formatted messages, empty when
  // there are none.
  finishTypes(startedAt, errors) {
    this.#types = { state: 'done', startedAt, ok: errors.length === 0, errors: joinErrors(errors) }
    this.#write()
  }

  #write() {
    this.#sink({
      pid: process.pid,
      state: this.#state,
      startedAt: this.#startedAt,
      fullStartedAt: this.#fullStartedAt,
      seen: Object.fromEntries(this.#seen),
      ok: this.#errors.length === 0,
      errors: joinErrors(this.#errors),
      types: this.#types,
    })
  }
}

// Several bundles build the same source (modern/es6, unpoly/specs…), so the same file's error
// shows up more than once. Collapse the duplicates.
function joinErrors(errors) {
  return [...new Set(errors)].join('\n\n')
}

function writeStatusFile(status) {
  try {
    writeAtomically(path.join(PROJECT_ROOT, STATUS_PATH), JSON.stringify(status))
  } catch {
    // best effort — never fail a build over status bookkeeping
  }
}

// The other direction, runner → watcher: a request to rebuild for files the watcher has not
// reacted to. Should never be needed, since the watcher sees every change in the source
// directories. It is the backstop for a missed file event (an inotify limit, a network
// filesystem, a Node bug), which would otherwise run bin/test against a stale bundle. The file
// holds the paths of the files, relative to the project root, one per line, or nothing.
export const REQUEST_PATH = 'tmp/build-request'

export function requestBuild(files, root = PROJECT_ROOT) {
  try {
    writeAtomically(path.join(root, REQUEST_PATH), [files ?? []].flat().join('\n'))
  } catch {
    // best effort: without the request, waitForFreshBuild() falls back to its grace period
  }
}

// Takes the request off the disk, and returns the paths it names (empty when it names none), or
// null when there is no request. Moving it away first means a request written while we read
// lands as a new file, for the next call.
export function takeBuildRequest(root = PROJECT_ROOT) {
  let file = path.join(root, REQUEST_PATH)
  let taken = `${file}.${process.pid}.taken`
  try {
    renameSync(file, taken)
    let files = readFileSync(taken, 'utf8').split('\n').filter(Boolean)
    unlinkSync(taken)
    return files
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
