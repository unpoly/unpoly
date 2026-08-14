// The build-status protocol, in one place: the webpack plugin that WRITES
// tmp/build-status.json (added to webpack/development.js, the watcher's config)
// and the reader that build_sync.mjs uses. One shared plugin instance is pushed
// onto every dev sub-config, so its counter reflects *all* in-flight compilers —
// the status only flips to "idle" when every current rebuild has finished, which
// avoids a runner reading a half-written dist bundle.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

// Relative to the project root (webpack and the runner both run from there).
export const STATUS_PATH = 'tmp/build-status.json'

export function readStatus(root = process.cwd()) {
  try {
    return JSON.parse(readFileSync(path.join(root, STATUS_PATH), 'utf8'))
  } catch {
    return null
  }
}

export class BuildStatusPlugin {
  #building = 0
  #startedAt
  #errors = []
  #sink
  #watching = false
  #startedPerCompiler = new Map()

  #now

  // `write` and `now` are seams for the self-tests; production uses the file writer and
  // the wall clock.
  constructor({ write = writeStatusFile, now = Date.now } = {}) {
    this.#sink = write
    this.#now = now
    this.#startedAt = now()
  }

  apply(compiler) {
    // Only a *watching* compiler may write the status file, so there is exactly one
    // writer: the dev environment's watcher. `watchRun` fires only under --watch, and
    // arming on it is what makes this structural — `done` fires for one-shot builds
    // too, and webpack/ci.js reuses the watcher's configs (plugin included), so
    // `bin/build --config=ci` used to overwrite a running watcher's status with its
    // own pid. Everything that read the file then saw a dead process and concluded
    // the dev environment was gone.
    compiler.hooks.watchRun.tap('BuildStatusPlugin', () => {
      this.#watching = true
      if (this.#building === 0) this.#errors = [] // start of a fresh rebuild round
      this.#building++
      // Per compiler, because they rebuild independently: a fast one can finish and
      // start again while a slow one is still going, so the counter never returns to
      // zero between two logical rounds. Keying `startedAt` off that counter left it
      // stuck at the first round's time, and `waitForFreshBuild()` then waited out its
      // timeout insisting the watcher had not picked up an edit it had already built.
      this.#startedPerCompiler.set(compiler, this.#now())
      this.#write('building')
    })
    compiler.hooks.done.tap('BuildStatusPlugin', (stats) => {
      if (!this.#watching) return // a one-shot build: not ours to report
      // Runs for failed compilations too (webpack, ts-loader syntax errors, and
      // ESLint via eslint-webpack-plugin all surface as compilation errors). We
      // record them but never throw — the watcher must keep watching.
      if (stats.hasErrors()) {
        this.#errors.push(stats.toString({ all: false, errors: true, colors: false }))
      }
      this.#settle()
    })
    // A watch cycle can fail *without* reaching `done` — an fs error while emitting,
    // EMFILE, a plugin throwing. Webpack fires `failed` instead, and without this tap
    // the counter never returned to zero: the status stayed "building" for ever and
    // every later bin/test timed out blaming a watcher that was fine.
    compiler.hooks.failed.tap('BuildStatusPlugin', (error) => {
      if (!this.#watching) return
      this.#errors.push(String(error && error.stack || error))
      this.#settle()
    })
  }

  #settle() {
    this.#building = Math.max(0, this.#building - 1)
    if (this.#building > 0) return

    this.#write('idle')
    // The busy period is over, so the next one starts from a clean slate. Without this
    // a compiler that stops taking part would pin `startedAt` to its last start for
    // ever, and nothing would ever look fresh again.
    this.#startedPerCompiler.clear()
  }

  // The oldest start among the compilers taking part in the current busy period.
  // Reporting the newest would certify an edit that only the fastest compiler picked up;
  // the oldest is conservative, so the worst case is waiting for one more rebuild.
  #oldestStart() {
    const starts = [...this.#startedPerCompiler.values()]
    return starts.length ? Math.min(...starts) : this.#startedAt
  }

  #write(state) {
    this.#sink({
      pid: process.pid,
      state,
      startedAt: this.#oldestStart(),
      ok: this.#errors.length === 0,
      // Several sub-compilers build the same source (es5/es6, CSP variants…), so
      // the same file's error shows up more than once — collapse the duplicates.
      errors: [...new Set(this.#errors)].join('\n\n'),
    })
  }
}

function writeStatusFile(status) {
  try {
    let file = path.resolve(STATUS_PATH)
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(status))
  } catch {
    // best effort — never fail a build over status bookkeeping
  }
}
