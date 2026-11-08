// Terser runs after esbuild, on its finished bundle: to minify the .min.js bundles, and to strip
// comments from the unminified bundles we publish. It is the slowest step of the build by far
// (~4 s for unpoly.min.js), so it runs in worker threads, one bundle per worker. The workers also
// drop the __name() calls that Terser doesn't need (see names.mjs).
//
// Why not esbuild's own minifier: it makes classes anonymous (`up.Record.name === ''`), and
// restoring the names with its `keepNames` costs +12 % gzip. It also compresses less than Terser
// (+3.6 % gzip without keepNames).

import { Worker } from 'node:worker_threads'
import os from 'node:os'

// https://terser.org/docs/options/
//
// We measured gzip -9 for Terser's options one by one. Only these are worth it, and all of them are
// safe. Of the rest, nothing safe saves more than 10 bytes, and what saves more is not safe for us:
//
// - `unsafe_arrows` and `unsafe_methods` (−0.5 % together) turn functions into arrows and methods,
//   which break when called with `new`.
// - `pure_getters: true` (−0.1 %) would drop `element.offsetHeight` in up.element.paint(), which
//   reads the property to force a layout.
// - `booleans_as_integers` (−0.1 %) turns `true` into `1`, and user code may compare with `=== true`.
// - `toplevel` and `mangle.toplevel` save nothing, since everything is inside esbuild's IIFE.
export function minifyOptions({ ecma }) {
  return {
    ecma,
    compress: {
      ecma,
      // A third pass saves a byte. More passes save nothing.
      passes: 3,
      // Class names show in `up.Request.name` and in the browser console.
      keep_classnames: true,
    },
    mangle: {
      keep_classnames: true,
      // Our convention for private members: `_foo` and `#foo`.
      properties: {
        regex: /^[_#]/,
      },
    },
    format: {
      ecma,
    },
  }
}

// The entirety of Unpoly's documentation is embedded in the source files. Even when we're not
// minifying, we want to remove these massive comments. This reduces the size of the unminified
// unpoly.js from ~550 KB to ~440 KB, which in turn reduces the size of the npm packages (and Ruby
// gems) that we publish. It also helps making Unpoly not appear epicly huge in bundle size
// analyzers. Terser only reprints here: no compression, no mangling.
export function stripOptions({ ecma }) {
  return {
    ecma,
    compress: false,
    mangle: false,
    format: {
      ecma,
      comments: false,
      beautify: true,
      indent_level: 2,
    },
  }
}

// A small pool of worker threads, each running terser_worker.mjs. Jobs queue up when every worker
// is busy. Call close() when done, or the workers keep the process alive.
export class TerserPool {
  #size
  #idle = []
  #all = []
  #queue = []

  constructor({ size = Math.max(1, os.availableParallelism() - 1) } = {}) {
    this.#size = size
  }

  // `kind` is 'minify' or 'strip'. `map` is esbuild's source map, or null for no source map.
  // Resolves with { code, map }.
  run({ kind, ecma, code, map, url }) {
    return new Promise((resolve, reject) => {
      this.#queue.push({ job: { kind, ecma, code, map, url }, resolve, reject })
      this.#drain()
    })
  }

  #drain() {
    while (this.#queue.length) {
      let worker = this.#idle.pop() || this.#spawn()
      if (!worker) return
      let task = this.#queue.shift()
      worker.once('message', ({ result, error }) => {
        this.#idle.push(worker)
        if (error) task.reject(new Error(error))
        else task.resolve(result)
        this.#drain()
      })
      worker.postMessage(task.job)
    }
  }

  #spawn() {
    if (this.#all.length >= this.#size) return null
    let worker = new Worker(new URL('./terser_worker.mjs', import.meta.url))
    this.#all.push(worker)
    return worker
  }

  async close() {
    await Promise.all(this.#all.map((worker) => worker.terminate()))
    this.#all = []
    this.#idle = []
  }
}
