// Orchestration for the terminal runner. Two entry points share one driver:
//   runDev — ensures a dev environment (starting one in the background if none is
//            running), waits for the watcher to produce a build that includes the
//            latest edit, then runs.
//   runCI  — self-contained: boots its own server, skips the build wait
//            (`bin/build --config=ci` already produced the artifacts), then runs.
// Neither reads the CI env var — behavior is chosen by which function is called.

import puppeteer from 'puppeteer'
import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'
import { Config } from '../config.mjs'
import { serverURL, isServerRunning, startServer } from '../server/server.mjs'
import { waitForFreshBuild, BuildSyncError, BuildFailedError } from '../../build/build_sync.mjs'
import { PROJECT_ROOT } from '../../build/build_status.mjs'
import { createRemapper } from './source_map.mjs'
import { createReceiver } from './receiver.mjs'
import { buildFailure } from './formatter.mjs'
import { specsURL } from './urls.mjs'
import { specFiltersFor } from '../../find_spec.mjs'
import { isDevEnvRunning, startDevEnv } from '../../dev_env.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const WINDOW = { width: 1200, height: 800 }
const WATCHDOG_TIMEOUT = 30_000

// Parses config, or prints the error and signals exit code 5. Returns the Config,
// or null if parsing failed (caller should return CONFIG_ERROR).
const CONFIG_ERROR = 5
function parseConfig(argv, env) {
  try {
    return resolveFileOption(Config.fromArgv(argv, env))
  } catch (error) {
    console.error(pc.red(error.message))
    return null
  }
}

// Turns every `--file=path[:line]` into ordinary `spec` filters, so the rest of the
// runner (and the page URL) only ever deals with full names. Reuses the parser behind
// bin/find-spec rather than growing a second way to read a spec file.
//
// --file and --spec are both repeatable and simply union, so they compose: the run is
// every spec matched by any of them.
function resolveFileOption(config) {
  if (!config.file.length) return config

  const filters = []
  for (let location of config.file) {
    const [, name, lineText] = /^(.*?)(?::(\d+))?$/.exec(location)
    const line = lineText ? Number(lineText) : null
    const absolute = path.isAbsolute(name) ? name : path.join(projectRoot, name)

    if (!existsSync(absolute)) throw new Error(`No such file: ${name}`)

    const resolved = specFiltersFor(readFileSync(absolute, 'utf8'), line)
    if (!resolved) {
      throw new Error(line
        ? `Nothing is declared at ${name}:${line} — point at a describe() or it() line.`
        : `${name} declares no specs.`)
    }

    console.error(pc.blue(`--file=${location} →`))
    for (let filter of resolved) console.error(pc.blue(`  --spec="${filter}"`))
    filters.push(...resolved)
  }

  const spec = [...new Set([...config.spec, ...filters])]
  return Config.fromObject({ ...config, spec, file: [] })
}

const isMinified = (name) => name.includes('.min.')

// Which of the bundles this config asks the page to load are absent from `dist`.
//
// Two things it deliberately does not report. Files the page will not request: runner.ejs
// loads unpoly-migrate.js only when `migrate` is set, so a --minify run without --migrate
// must not demand unpoly-migrate.min.js. And nothing at all before the watcher has built,
// which is why the caller only asks once a build is green — see runDev().
export function missingDistFiles(config, dist = path.join(PROJECT_ROOT, 'dist')) {
  let { unpoly, specs, jasmine, migrate } = config.distFilenames()
  let loaded = [unpoly, specs, jasmine, ...(config.migrate ? [migrate] : [])]
  return loaded.filter((name) => !existsSync(path.join(dist, name)))
}

export async function runDev(argv, env) {
  const config = parseConfig(argv, env)
  if (!config) return CONFIG_ERROR

  // Start one in the background if none is up, so `bin/test` needs no manual setup.
  if (!(await isDevEnvRunning())) {
    try {
      console.error(pc.blue('Starting the dev environment in the background — the first build may take ~15s…'))
      await startDevEnv()
      console.error(pc.blue('Dev environment kept running in the background (logs in tmp/dev.log) — stop with `bin/dev stop`.'))
      console.error('')
    } catch (error) {
      console.error(pc.red(error.message))
      return 3
    }
  }

  try {
    const build = await waitForFreshBuild()
    // The watcher never reacted, so nothing needed building. Say which file that was: reading
    // the name is what tells you whether to shrug (a guide page) or look closer (a source file
    // the watcher should have picked up).
    if (build.unbuiltEdit) {
      console.error(pc.blue(`No rebuild for ${build.unbuiltEdit} — running against the current build.`))
    }
  } catch (error) {
    if (error instanceof BuildFailedError) {
      process.stdout.write(buildFailure(error.errors))
      return 6
    }
    if (error instanceof BuildSyncError) {
      console.error(pc.red(error.message))
      return 4
    }
    throw error
  }

  // Only now, with a green build behind us, does an absent bundle mean anything: `dist` is
  // gitignored, so before the watcher's first build *everything* is missing. Asking up
  // front turned every fresh clone's first `bin/test` into a hard error naming files the
  // watcher was about to produce — and it sent you to the CI build, which also produces
  // the minified ones, so it never recurred for anyone who hit it once.
  //
  // Missing bundles merely 404, leaving the specs to run against no Unpoly at all, so we
  // still check before spending ten minutes finding that out.
  let missing = missingDistFiles(config)
  if (missing.length) {
    console.error(pc.red(missing.every(isMinified)
      ? `Missing from dist/: ${missing.join(', ')}. The dev watcher never builds the minified bundles — run \`bin/build --config=ci\` once.`
      : `Missing from dist/: ${missing.join(', ')}, although the build reported success. Check tooling/build/webpack/development.js.`))
    return 4
  }

  return await drive(config)
}

export async function runCI(argv, env) {
  const config = parseConfig(argv, env)
  if (!config) return CONFIG_ERROR

  let server
  if (!(await isServerRunning())) server = await startServer()
  try {
    return await drive(config)
  } finally {
    if (server) await server.stopServer().catch(() => {})
  }
}

async function drive(config) {
  const browser = await puppeteer.launch({
    browser: config.browser,
    headless: config.headless,
    args: [`--window-size=${WINDOW.width},${WINDOW.height}`],
    defaultViewport: { width: WINDOW.width, height: WINDOW.height },
  })

  try {
    const page = await browser.newPage()
    await page.bringToFront()
    await page.evaluateOnNewDocument(() => { Error.stackTraceLimit = Infinity })
    await enableDeepAsyncStacks(page)

    const remapper = createRemapper(projectRoot)
    const receiver = createReceiver({ verbose: config.verbose, remapper, serverURL, variant: config.toPageParams(), out: process.stdout })

    let resolveDone
    const done = new Promise((resolve) => { resolveDone = resolve })

    await page.exposeFunction('__postToTerminal', async (event) => {
      try {
        const exitCode = await receiver.handle(event)
        if (exitCode !== undefined) resolveDone(exitCode)
      } catch (error) {
        console.error(pc.red('Error handling spec event: ' + (error.stack || error)))
      }
    })

    // Note: we deliberately do NOT surface page.on('pageerror'). Many specs
    // trigger global errors on purpose (error-handling tests); Jasmine catches
    // and reports the genuine failures via the events above.

    await page.goto(specsURL(serverURL, config.toParams()))

    const watchdog = startWatchdog(receiver, () => {
      console.error(pc.red('\nTimeout: no progress from the spec runner for 30s.'))
      resolveDone(2)
    })

    const exitCode = await done
    clearInterval(watchdog)
    return exitCode
  } finally {
    await browser.close().catch(() => {})
  }
}

// Deepen async stack traces via CDP (best effort — ignore if unsupported).
async function enableDeepAsyncStacks(page) {
  try {
    const cdp = await page.target().createCDPSession()
    await cdp.send('Debugger.enable')
    await cdp.send('Debugger.setAsyncCallStackDepth', { maxDepth: 32 })
  } catch { /* best effort */ }
}

// Calls onSilent() if the receiver sees no event for WATCHDOG_TIMEOUT. Returns the
// interval id so the caller can clear it.
function startWatchdog(receiver, onSilent) {
  return setInterval(() => {
    if (receiver.silentForMs() > WATCHDOG_TIMEOUT) onSilent()
  }, 1000)
}
