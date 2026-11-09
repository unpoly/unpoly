// The dev watcher behind `bin/build --watch` (which `bin/dev` runs): keeps dist/ current and
// reports every build to tmp/build-status.json (see build_status.mjs).
//
// We watch the files ourselves and rebuild the bundles in rounds, instead of letting each esbuild
// context watch on its own. Contexts that watch independently pick up an edit at different
// times, so there are moments where all of them are idle, but one has not even started on the
// edit yet: a runner reading "idle" would then test a stale specs.js. A round has one start time,
// taken before any bundle reads a source, and ends when every affected bundle is written.

import { watch } from 'node:fs'
import path from 'node:path'
import esbuild from 'esbuild'
import pc from 'picocolors'
import { BuildStatus, PROJECT_ROOT } from './build_status.mjs'
import { SOURCE_DIRS, WATCHABLE_SUFFIXES } from './build_sync.mjs'
import { esbuildOptions, finish } from './esbuild.mjs'
import { formatError, formatWarnings } from './build.mjs'
import { SourceLinter } from './lint.mjs'
import { TerserPool } from './terser.mjs'

// Editors write a file in several steps (truncate, write, rename). Waiting this long after the
// last event turns them into one round.
const DEBOUNCE_MS = 20

export async function runWatch({ bundles, sourcemap }) {
  let terser = new TerserPool()
  let linter = new SourceLinter()
  let contexts = await Promise.all(bundles.map((bundle) => esbuild.context({
    ...esbuildOptions(bundle, { sourcemap: sourcemap(bundle) }),
    // Tells us which files each bundle read, see affectedBundles().
    metafile: true,
  })))
  // Per bundle: the absolute paths of its inputs in its last successful build (null before that),
  // and the errors of its last build, which stand until the bundle builds again.
  let inputs = bundles.map(() => null)
  let errors = bundles.map(() => [])

  async function build(changedFiles) {
    let affected = affectedBundles(inputs, changedFiles)
    let warnings = new Set()
    await Promise.all(affected.map(async (index) => {
      try {
        let result = await contexts[index].rebuild()
        for (let warning of await formatWarnings(result)) warnings.add(warning)
        await finish(bundles[index], result, { terser, strip: false })
        inputs[index] = new Set(Object.keys(result.metafile.inputs).map((input) => path.resolve(PROJECT_ROOT, input)))
        errors[index] = []
      } catch (error) {
        errors[index] = await formatError(error)
      }
    }))
    // Printed, but not reported to bin/test: a warning doesn't fail a build.
    if (warnings.size) console.log(pc.yellow([...warnings].join('\n')))
    return { built: affected.length, errors: errors.flat() }
  }

  let rounds = new Rounds({
    status: new BuildStatus(),
    async run(changedFiles) {
      let startedAt = Date.now()
      // ESLint runs in this thread while esbuild and Terser work in their own processes and threads.
      let [{ built, errors: buildErrors }, lintErrors] = await Promise.all([build(changedFiles), linter.lint(changedFiles)])
      // The modern and es6 bundles report the same syntax error.
      let errors = [...new Set([...buildErrors, ...lintErrors])]
      if (errors.length) {
        console.log(pc.red(`Build failed in ${Date.now() - startedAt} ms:`))
        console.log(errors.join('\n\n'))
      } else {
        console.log(pc.green(`Built ${built} of ${bundles.length} bundles in ${Date.now() - startedAt} ms`))
      }
      return errors
    },
  })

  for (let dir of SOURCE_DIRS) {
    watch(path.join(PROJECT_ROOT, dir), { recursive: true }, (_event, filename) => {
      // Node may not know the name. Then rebuild anyway, but there is nothing to lint.
      if (!filename) return rounds.change(null)
      if (isWatchable(filename)) rounds.change(path.join(PROJECT_ROOT, dir, filename))
    })
  }
  // The version number in namespace.js.erb comes from here.
  watch(path.join(PROJECT_ROOT, 'package.json'), () => rounds.change(null))

  console.log(`Watching ${SOURCE_DIRS.join(', ')} for changes…`)
  rounds.change(null) // the initial build

  // Only Ctrl-C (or bin/dev stopping us) ends the watcher.
  return new Promise((resolve) => {
    let stop = async () => {
      await Promise.all(contexts.map((context) => context.dispose()))
      await terser.close()
      resolve(0)
    }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  })
}

// The indexes of the bundles that need a rebuild for `changedFiles`, given each bundle's `inputs`
// from its last build. esbuild relinks a whole bundle and writes its whole source map on every
// rebuild, even when nothing changed (~100 ms for dist/jasmine.js), so we skip the ones a change
// cannot reach.
//
// Everything rebuilds when we can't tell: a change without a file name (null), a bundle that has
// not built yet, and a file no bundle has read so far. That last one covers new files (a new spec
// helper is picked up by a glob), Sass partials (esbuild only sees the file Sass was called on),
// and files that only a failed build would have read.
export function affectedBundles(inputs, changedFiles) {
  let all = inputs.map((_, index) => index)
  let known = (file) => file !== null && inputs.some((set) => set?.has(file))
  if (inputs.includes(null) || ![...changedFiles].every(known)) return all
  return all.filter((index) => [...changedFiles].some((file) => inputs[index].has(file)))
}

// Bundles only ever import files with these extensions, so nothing else needs a rebuild.
function isWatchable(filename) {
  return WATCHABLE_SUFFIXES.some((suffix) => filename.endsWith(suffix))
}

// Turns a stream of file changes into rounds of rebuilds, one at a time. A change during a round
// starts another round right after it, and the status stays "building" until a round finds
// no newer change: we never report a dist/ as idle that an edit we saw has not reached.
export class Rounds {
  #status
  #run
  #changed = new Set()
  #pending = false
  #running = false
  #timer = null
  #debounceMs
  #setTimer
  #clearTimer
  #idle = null

  // `run(changedFiles)` builds and resolves with a list of errors. `changedFiles` is a Set of what
  // change() got since the last round. The timer functions are seams for the self-tests.
  constructor({ status, run, debounceMs = DEBOUNCE_MS, setTimer = setTimeout, clearTimer = clearTimeout }) {
    this.#status = status
    this.#run = run
    this.#debounceMs = debounceMs
    this.#setTimer = setTimer
    this.#clearTimer = clearTimer
  }

  // `file` is an absolute path, or null for a change we can't attribute to a file.
  change(file) {
    this.#changed.add(file)
    this.#pending = true
    this.#clearTimer(this.#timer)
    this.#timer = this.#setTimer(() => this.#start(), this.#debounceMs)
  }

  // Resolves once no round is running or due. For the self-tests.
  get idle() {
    return this.#idle ?? Promise.resolve()
  }

  #start() {
    if (this.#running) return // the running round looks for #pending when it is done
    this.#idle = this.#loop()
  }

  async #loop() {
    this.#running = true
    try {
      while (this.#pending) {
        let files = this.#changed
        this.#changed = new Set()
        this.#pending = false
        this.#status.start()
        let errors
        try {
          errors = await this.#run(files)
        } catch (error) {
          // A round that blows up must still end, or the status says "building" for ever and
          // every later bin/test times out blaming a watcher that is fine.
          errors = [String(error?.stack || error)]
        }
        // Edits arrived while we were building: build again before saying we're done.
        if (!this.#pending) this.#status.finish(errors)
      }
    } finally {
      this.#running = false
    }
  }
}
