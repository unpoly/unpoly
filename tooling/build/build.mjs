// The build task behind `bin/build`. esbuild bundles each entry (and strips TypeScript), Terser
// minifies, both in this process. Optionally gzips the minified production bundles afterwards.
//
// The watcher (`--watch`) lives in watch.mjs.

import { spawn } from 'node:child_process'
import { statSync } from 'node:fs'
import path from 'node:path'
import esbuild from 'esbuild'
import pc from 'picocolors'
import { CONFIGS } from './bundles.mjs'
import { esbuildOptions, finish } from './esbuild.mjs'
import { TerserPool } from './terser.mjs'
import { PROJECT_ROOT } from './build_status.mjs'

// The minified bundles `npm run build` used to gzip.
const GZIP_TARGETS = ['dist/unpoly.es6.min.js', 'dist/unpoly.min.js']

export function parseBuildArgs(argv) {
  let config = 'production'
  let watch = false
  let gzip = null // null → default for the chosen config (see below)

  for (let arg of argv) {
    let configMatch = arg.match(/^--config=(.+)$/)
    if (configMatch) {
      config = configMatch[1]
    } else if (arg === '--watch') {
      watch = true
    } else if (arg === '--gzip') {
      gzip = true
    } else if (arg === '--no-gzip') {
      gzip = false
    } else {
      throw new Error(`Unknown build option: ${arg}`)
    }
  }

  if (!CONFIGS[config]) {
    throw new Error(`Unknown --config=${config} (expected ${Object.keys(CONFIGS).join(', ')})`)
  }
  // Gzip is only meaningful for the production bundle, so that's its default.
  if (gzip === null) gzip = config === 'production'
  // The production build is what bin/release publishes, so it refuses code that fails the linter,
  // as the webpack build did. Linting all of src/ takes ~0.5 s, though, so the other configs leave
  // it to bin/lint, CI's Lint job and the dev watcher. bin/test --minify builds the minified
  // bundles often and must stay fast.
  let lint = config === 'production'

  return { config, watch, gzip, lint }
}

function spawnStep(command, args) {
  return new Promise((resolve) => {
    let child = spawn(command, args, { stdio: 'inherit', cwd: PROJECT_ROOT })
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

export async function runBuild(argv) {
  let options
  try {
    options = parseBuildArgs(argv)
  } catch (error) {
    console.error(error.message)
    return 2
  }

  if (options.watch) {
    // Only returns on Ctrl-C, and gzipping makes no sense for a watcher.
    let { runWatch } = await import('./watch.mjs')
    return runWatch(CONFIGS[options.config])
  }

  let [buildErrors, lintErrors] = await Promise.all([
    buildOnce(CONFIGS[options.config], {
      // Comments only matter in the unminified bundles we publish. Elsewhere the source maps make
      // them harmless, and stripping would cost the dev build more than everything else together.
      strip: options.config === 'production',
    }),
    // Oxlint runs in its own process, like esbuild. Terser works in its own threads.
    options.lint ? lintSources() : [],
  ])
  let errors = [...buildErrors, ...lintErrors]
  if (errors.length) {
    console.error(errors.join('\n'))
    return 1
  }

  if (options.gzip) {
    return await spawnStep('gzip', ['--keep', '--force', ...GZIP_TARGETS])
  }
  return 0
}

// The errors Oxlint finds in src/, formatted.
async function lintSources() {
  let { SourceLinter } = await import('./lint.mjs')
  return new SourceLinter().lint([null])
}

// Builds every bundle of a config once. Resolves with a list of formatted error messages, empty
// when everything was written.
export async function buildOnce({ bundles, sourcemap }, { strip = false, log = console.log } = {}) {
  let terser = new TerserPool()
  let startedAt = Date.now()
  try {
    let warnings = new Set()
    let outcomes = await Promise.all(bundles.map(async (bundle) => {
      let bundleStartedAt = Date.now()
      try {
        let result = await esbuild.build(esbuildOptions(bundle, { sourcemap: sourcemap(bundle) }))
        for (let warning of await formatWarnings(result)) warnings.add(warning)
        await finish(bundle, result, { terser, strip })
        log(builtLine(bundle, Date.now() - bundleStartedAt))
        return []
      } catch (error) {
        return await formatError(error)
      }
    }))
    // Several bundles share most of their sources, and so their warnings.
    if (warnings.size) log(pc.yellow([...warnings].join('\n')))
    let errors = outcomes.flat()
    if (!errors.length) log(pc.green(`Built ${bundles.length} bundles in ${Date.now() - startedAt} ms`))
    return errors
  } finally {
    await terser.close()
  }
}

export function builtLine(bundle, ms) {
  let file = path.join('dist', bundle.out)
  let size = statSync(path.join(PROJECT_ROOT, file)).size
  return `${file.padEnd(32)} ${(size / 1024).toFixed(1).padStart(7)} KiB  ${pc.dim(`${ms} ms`)}`
}

// esbuild's warnings point at likely bugs: a duplicate key, `x === -0`, a misspelled `typeof`
// result, an import that a CommonJS module doesn't export. They don't fail a build, but we print
// them, as webpack did. (Our esbuild options silence its own logging.)
export async function formatWarnings(result) {
  if (!result.warnings?.length) return []
  return await esbuild.formatMessages(result.warnings, { kind: 'warning', color: false })
}

// esbuild's own rendering of a failure (with a code frame), or the stack of anything else that
// went wrong (Sass, ERB, Terser).
export async function formatError(error) {
  if (error?.errors?.length) {
    return await esbuild.formatMessages(error.errors, { kind: 'error', color: false })
  }
  return [String(error?.stack || error)]
}
