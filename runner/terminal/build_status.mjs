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
  #startedAt = Date.now()
  #errors = []
  #sink

  // `write` is a seam for the self-tests; production uses the file writer.
  constructor({ write = writeStatusFile } = {}) {
    this.#sink = write
  }

  apply(compiler) {
    compiler.hooks.watchRun.tap('BuildStatusPlugin', () => {
      if (this.#building === 0) {
        this.#startedAt = Date.now()
        this.#errors = [] // start of a fresh rebuild round
      }
      this.#building++
      this.#write('building')
    })
    compiler.hooks.done.tap('BuildStatusPlugin', (stats) => {
      // Runs for failed compilations too (webpack, ts-loader syntax errors, and
      // ESLint via eslint-webpack-plugin all surface as compilation errors). We
      // record them but never throw — the watcher must keep watching.
      if (stats.hasErrors()) {
        this.#errors.push(stats.toString({ all: false, errors: true, colors: false }))
      }
      this.#building = Math.max(0, this.#building - 1)
      if (this.#building === 0) this.#write('idle')
    })
  }

  #write(state) {
    this.#sink({
      pid: process.pid,
      state,
      startedAt: this.#startedAt,
      finishedAt: state === 'idle' ? Date.now() : null,
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
