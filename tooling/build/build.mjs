// The build task behind `bin/build`. Wraps the `webpack` CLI (rather than the Node
// API) so we inherit its output and exit codes verbatim — that's what makes build
// errors surface and one-shot builds exit non-zero. Optionally gzips the minified
// production bundles afterwards, the way the old `npm run build` did.

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const webpackBin = path.join(projectRoot, 'node_modules', '.bin', 'webpack')

const CONFIGS = {
  development: 'tooling/build/webpack/development.js',
  production: 'tooling/build/webpack/production.js',
  ci: 'tooling/build/webpack/ci.js',
}

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
    throw new Error(`Unknown --config=${config} (expected development, production or ci)`)
  }
  // Gzip is only meaningful for the production bundle, so that's its default.
  if (gzip === null) gzip = config === 'production'

  return { config, watch, gzip }
}

function spawnStep(command, args) {
  return new Promise((resolve) => {
    let child = spawn(command, args, { stdio: 'inherit', cwd: projectRoot })
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

  let webpackArgs = ['--config', CONFIGS[options.config]]
  if (options.watch) webpackArgs.push('--watch')

  let code = await spawnStep(webpackBin, webpackArgs)

  // In watch mode webpack only returns on Ctrl-C, and gzipping a possibly-broken
  // build makes no sense — so we're done either way.
  if (options.watch || code !== 0) return code

  if (options.gzip) {
    code = await spawnStep('gzip', ['--keep', '--force', ...GZIP_TARGETS])
  }
  return code
}
