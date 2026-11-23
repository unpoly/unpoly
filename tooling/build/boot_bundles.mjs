// Loads the bundles we publish in headless Chrome, the way an app's page does, and checks that
// Unpoly boots and renders. Specs run against the dev and CI builds, so this is the only check of
// what `bin/build` (production, like bin/release) writes to dist/. Behind `bin/boot-bundles`.
//
// Each unpoly*.js bundle is loaded alone, and together with each optional bundle of the same
// minification (unpoly-migrate, unpoly-bootstrap3/4/5). A combination fails on an uncaught error,
// a console error, a file that doesn't load, or when the smoke test below doesn't render.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer'
import { PROJECT_ROOT } from './build_status.mjs'
import { CONFIGS } from './bundles.mjs'

const DIST = path.join(PROJECT_ROOT, 'dist')

// Pages are served from this made-up origin, so the scripts load like on a real site.
const ORIGIN = 'http://unpoly.test'

// Replaces a fragment, which runs a compiler on the new one. Needs no server.
const SMOKE = `(async () => {
  up.compiler('#smoke', (element) => element.setAttribute('compiled', ''))
  await up.render({ fragment: '<div id="smoke">rendered</div>' })
  return document.querySelector('#smoke[compiled]')?.textContent
})()`

// Lists the script combinations to load, like `['unpoly.min.js', 'unpoly-migrate.min.js']`.
export function combinations(bundles = CONFIGS.production.bundles) {
  let cores = bundles.filter((bundle) => bundle.entry === 'src/unpoly.ts')
  let extensions = bundles.filter((bundle) => !cores.includes(bundle))
  return cores.flatMap((core) => [
    [core.out],
    ...extensions.filter((extension) => extension.min === core.min).map((extension) => [core.out, extension.out]),
  ])
}

// Resolves with the problems of one combination, or an empty array.
async function boot(browser, scripts) {
  let page = await browser.newPage()
  let problems = []
  page.on('pageerror', (error) => problems.push(`Uncaught ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') problems.push(`Console error: ${message.text()}`) })
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    let file = new URL(request.url()).pathname.slice(1)
    if (file === '') {
      let tags = scripts.map((script) => `<script src="${script}"></script>`).join('')
      // The empty icon keeps Chrome from asking for /favicon.ico.
      request.respond({ contentType: 'text/html', body: `<!DOCTYPE html><html><head><link rel="icon" href="data:,">${tags}</head><body><div id="smoke"></div></body></html>` })
    } else if (scripts.includes(file) && existsSync(path.join(DIST, file))) {
      request.respond({ contentType: 'text/javascript', body: readFileSync(path.join(DIST, file)) })
    } else {
      problems.push(`Not found: ${file}`)
      request.respond({ status: 404 })
    }
  })

  try {
    await page.goto(ORIGIN + '/')
    let version = await page.evaluate('window.up?.version')
    if (!version) problems.push('No up.version')
    else if (await page.evaluate(SMOKE) !== 'rendered') problems.push('Smoke test did not render')
    // Catch an error that a timer or a late promise throws shortly after booting.
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 100)))
  } catch (error) {
    problems.push(error.message)
  } finally {
    await page.close()
  }
  return problems
}

// Boots every combination and prints one line for each. Resolves with the exit code.
export async function bootBundles() {
  let browser = await puppeteer.launch({ headless: true })
  let failed = 0
  try {
    for (let scripts of combinations()) {
      let problems = await boot(browser, scripts)
      console.log(`${problems.length ? 'FAIL' : 'ok  '} ${scripts.join(' + ')}`)
      for (let problem of problems) console.log(`       ${problem}`)
      if (problems.length) failed++
    }
  } finally {
    await browser.close()
  }
  if (failed) console.log(`\n${failed} combination(s) failed`)
  return failed ? 1 : 0
}
