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

  apply(compiler) {
    compiler.hooks.watchRun.tap('BuildStatusPlugin', () => {
      if (this.#building === 0) this.#startedAt = Date.now()
      this.#building++
      this.#write('building')
    })
    compiler.hooks.done.tap('BuildStatusPlugin', () => {
      this.#building = Math.max(0, this.#building - 1)
      if (this.#building === 0) this.#write('idle')
    })
  }

  #write(state) {
    try {
      let file = path.resolve(STATUS_PATH)
      mkdirSync(path.dirname(file), { recursive: true })
      writeFileSync(file, JSON.stringify({
        pid: process.pid,
        state,
        startedAt: this.#startedAt,
        finishedAt: state === 'idle' ? Date.now() : null,
      }))
    } catch {
      // best effort — never fail a build over status bookkeeping
    }
  }
}
