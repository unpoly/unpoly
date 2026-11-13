// The dev watcher behind `bin/build --watch` (which `bin/dev` runs): keeps dist/ current and
// reports every build to tmp/build-status.json (see build_status.mjs).
//
// We watch the files ourselves and rebuild the bundles in rounds, instead of letting each esbuild
// context watch on its own. Contexts that watch independently pick up an edit at different
// times, so there are moments where all of them are idle, but one has not even started on the
// edit yet: a runner reading "idle" would then test a stale specs.js. A round has one start time,
// taken before any bundle reads a source, and ends when every affected bundle is written.
//
// After the rounds that change something in src/, the watcher checks types, like bin/typecheck
// (see TypeChecks). That takes ~0.5 s and keeps every core busy, so it waits for the round to
// end, and bin/test gets its bundles as early as without it.

import { mkdirSync, watch } from 'node:fs'
import path from 'node:path'
import esbuild from 'esbuild'
import pc from 'picocolors'
import { BuildStatus, PROJECT_ROOT, REQUEST_PATH, takeBuildRequest } from './build_status.mjs'
import { SKIP_DIRS, SOURCE_DIRS, WATCHABLE_SUFFIXES } from './build_sync.mjs'
import { esbuildOptions, finish } from './esbuild.mjs'
import { formatError, formatWarnings } from './build.mjs'
import { SourceLinter } from './lint.mjs'
import { watchTypeErrors } from './typecheck.mjs'
import { TerserPool } from './terser.mjs'
import { watchTree } from './watch_tree.mjs'

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

  // What the last builds and lints found, without building or linting anything.
  async function standingErrors() {
    return [...new Set([...errors.flat(), ...await linter.format()])]
  }

  let status = new BuildStatus()
  let typeChecks = new TypeChecks({
    status,
    async check(signal) {
      let startedAt = Date.now()
      let result = await watchTypeErrors({ signal })
      // A round started, and the check will run again after it.
      if (!result) return null
      let ms = Date.now() - startedAt
      if (result.count) {
        console.log(pc.red(`Found ${result.count} type error${result.count === 1 ? '' : 's'} in ${ms} ms:`))
        console.log(result.errors.join('\n\n'))
      } else {
        console.log(pc.green(`Checked types in ${ms} ms`))
      }
      return result.errors
    },
  })

  let rounds = new Rounds({
    status: roundStatus(status, typeChecks),
    async run(changedFiles) {
      // Only files that no bundle reads have changed. The round itself is the point: its
      // `startedAt` passes the new directory mtime, which waitForFreshBuild() compares against.
      if (!changedFiles.size) return standingErrors()
      let startedAt = Date.now()
      // Oxlint runs in its own process, like esbuild. Terser works in its own threads.
      let [{ built, errors: buildErrors }, lintErrors] = await Promise.all([build(changedFiles), linter.lint(changedFiles)])
      // Printed, but not reported to bin/test: a warning doesn't fail a build.
      if (linter.warnings.length) console.log(pc.yellow(linter.warnings.join('\n')))
      // The modern and es6 bundles report the same syntax error.
      let roundErrors = [...new Set([...buildErrors, ...lintErrors])]
      if (roundErrors.length) {
        console.log(pc.red(`Build failed in ${Date.now() - startedAt} ms:`))
        console.log(roundErrors.join('\n\n'))
      } else {
        console.log(pc.green(`Built ${built} of ${bundles.length} bundles in ${Date.now() - startedAt} ms`))
      }
      return roundErrors
    },
  })

  let watcher = watchSources(rounds)
  console.log(`Watching ${SOURCE_DIRS.join(', ')} for changes…`)
  rounds.change(null) // the initial build

  // Only Ctrl-C (or bin/dev stopping us) ends the watcher.
  return new Promise((resolve) => {
    let stop = async () => {
      watcher.close()
      typeChecks.close()
      await Promise.all(contexts.map((context) => context.dispose()))
      await terser.close()
      resolve(0)
    }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  })
}

// Tells `rounds` about every change in the source directories (see Rounds#change() and
// #touch()), in package.json, and every rebuild request from bin/test. `root` and `log` are seams
// for the self-tests. Returns `{ close() }`.
export function watchSources(rounds, { root = PROJECT_ROOT, log = console.log } = {}) {
  let cannotWatch = (error, dir) => log(pc.red(`Cannot watch ${path.relative(root, dir) || '.'} (${error.code}). Edits in it will not rebuild.`))
  let watchers = SOURCE_DIRS.map((dir) => watchTree(path.join(root, dir), (file, { directory }) => {
    // A directory that appears, moves or vanishes brings or takes files without an event of
    // their own. Rebuild and lint everything.
    if (directory || !file) return rounds.change(null)
    // An event for a name in a directory may have moved the directory's mtime, which bin/test
    // looks at (see newestSource()).
    rounds.touch(path.dirname(file))
    // A guide page, an image or an editor's swap file needs nothing else.
    if (isWatchable(file)) rounds.change(file)
  }, {
    skip: (name) => SKIP_DIRS.has(name),
    onError: cannotWatch,
  }))

  // The version number in namespace.js.erb comes from here. We watch the directory, because
  // saving the file by rename would end a watch on the file itself.
  let rootWatcher = watch(root, (_event, name) => {
    if (name === 'package.json') rounds.change(null)
    // Only the type check reads these (see isTypeChecked()).
    if (TSCONFIG.test(name)) rounds.touch(path.join(root, name))
  })
  rootWatcher.on('error', (error) => cannotWatch(error, root))

  // bin/test asks for a rebuild when it finds a source newer than our last round. That means we
  // missed a file event, so say so. A tree of one directory, so that `rm -rf tmp` doesn't end
  // the requests.
  let requestFile = path.join(root, REQUEST_PATH)
  mkdirSync(path.dirname(requestFile), { recursive: true })
  let requests = watchTree(path.dirname(requestFile), (file, { directory }) => {
    // When tmp/ itself comes back, a request may have landed in it before we watched it again.
    if (file !== requestFile && !directory) return
    // Null when there is none, or when this is the event for our taking it.
    let files = takeBuildRequest(root)
    if (!files) return
    log(pc.yellow(`A rebuild was requested for ${files.join(', ') || 'an unknown file'}, which the watcher had not noticed.`))
    if (!files.length) rounds.change(null)
    for (let file of files) {
      let absolute = path.join(root, file)
      // A directory: something in it came or went.
      rounds.change(isWatchable(absolute) ? absolute : null)
    }
  }, {
    skip: () => true,
    onError: cannotWatch,
  })

  return {
    close() {
      for (let tree of [...watchers, requests, rootWatcher]) tree.close()
    },
  }
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

// What Rounds reports to: the status, and the type checks, which wait for the rounds (see
// TypeChecks). `root` is a seam for the self-tests.
export function roundStatus(status, typeChecks, root = PROJECT_ROOT) {
  return {
    start(round) {
      status.start(round)
      typeChecks.roundStarted({ outdated: round.full || round.seen.some((seen) => isTypeChecked(seen, root)) })
    },
    finish(errors) {
      status.finish(errors)
      typeChecks.roundFinished()
    },
  }
}

const TSCONFIG = /^tsconfig.*\.json$/

// Whether the type check reads the file or directory at the absolute path `seen`, or may read
// something in it: anything in src/ (the doc files too, for the API probe) and the tsconfigs.
export function isTypeChecked(seen, root = PROJECT_ROOT) {
  let relative = path.relative(root, seen)
  return relative === 'src' || relative.startsWith('src' + path.sep) || TSCONFIG.test(relative)
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
  #seen = new Set()
  #pending = false
  #running = false
  #timer = null
  #debounceMs
  #setTimer
  #clearTimer
  #idle = null

  // `run(changedFiles)` builds and resolves with a list of errors. `changedFiles` is a Set of what
  // change() got since the last round. A null in it means that the round builds and lints
  // everything. `status.start()` learns which paths the round has seen (see BuildStatus). The
  // timer functions are seams for the self-tests.
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
    this.touch(file)
  }

  // A change that needs no rebuild, at the absolute path `seen` (a directory whose listing
  // changed, say). It still gets a round, with an empty `changedFiles`, so the status reports
  // a newer `startedAt` and the path as seen.
  touch(seen = null) {
    if (seen) this.#seen.add(seen)
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
        let seen = this.#seen
        this.#changed = new Set()
        this.#seen = new Set()
        this.#pending = false
        this.#status.start({ seen: [...seen], full: files.has(null) })
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

// Runs the type check after the rounds that change what it reads, one check at a time, and never
// during a round: tsc keeps every core busy for ~0.5 s, and would slow down the bundles that
// bin/test waits for. A round that starts during a check aborts it, and the check runs again
// once the round is done. bin/test reads the result from the status (see BuildStatus).
export class TypeChecks {
  #status
  #check
  #now
  // A check is due, and starts when no round is running.
  #due = false
  #inRound = false
  #running = false
  #controller = null
  #idle = null

  // `check(signal)` checks types, and resolves with a list of errors. When `signal` aborts it, it
  // may resolve with anything. `status` gets the results (see BuildStatus#startTypes() and
  // #finishTypes()). `now` is a seam for the self-tests.
  constructor({ status, check, now = Date.now }) {
    this.#status = status
    this.#check = check
    this.#now = now
  }

  // A round of rebuilds begins. `outdated` says that it changes something the check reads.
  roundStarted({ outdated }) {
    this.#inRound = true
    if (this.#controller) {
      // Its result would still be good when the round is not `outdated`, but it would slow
      // down the round. It runs again after the round.
      this.#controller.abort()
      this.#due = true
    }
    if (outdated) {
      this.#due = true
      this.#status.startTypes()
    }
  }

  // The round is over, with every bundle written.
  roundFinished() {
    this.#inRound = false
    if (this.#due && !this.#running) this.#idle = this.#loop()
  }

  // Aborts a running check, for good.
  close() {
    this.#due = false
    this.#controller?.abort()
  }

  // Resolves once no check is running. For the self-tests.
  get idle() {
    return this.#idle ?? Promise.resolve()
  }

  async #loop() {
    this.#running = true
    try {
      // A round that started during the check aborted it, and the check is due again. When that
      // round is over, we go on here, or roundFinished() starts a new loop.
      while (this.#due && !this.#inRound) {
        this.#due = false
        let controller = this.#controller = new AbortController()
        let startedAt = this.#now()
        let errors
        try {
          errors = await this.#check(controller.signal)
        } catch (error) {
          errors = [String(error?.stack || error)]
        }
        this.#controller = null
        if (!controller.signal.aborted) this.#status.finishTypes(startedAt, errors)
      }
    } finally {
      this.#running = false
    }
  }
}
