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

// Which of the bundles this config asks the page to load are absent. Only meaningful for
// variants the dev watcher does not build (currently --minify).
function missingDistFiles(config) {
  let dist = path.join(PROJECT_ROOT, 'dist')
  return Object.values(config.distFilenames())
    .filter((name) => !existsSync(path.join(dist, name)))
}

export async function runDev(argv, env) {
  const config = parseConfig(argv, env)
  if (!config) return CONFIG_ERROR

  // The dev watcher never builds the minified bundles, so --minify loads files only
  // `bin/build --config=ci` produces. Missing, they merely 404 and the specs run against
  // no Unpoly at all — so check before spending ten minutes finding that out.
  let missing = missingDistFiles(config)
  if (missing.length) {
    console.error(pc.red(`Missing from dist/: ${missing.join(', ')}. Build them with \`bin/build --config=ci\`.`))
    return CONFIG_ERROR
  }

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
    await waitForFreshBuild()
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
