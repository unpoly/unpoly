import puppeteer from 'puppeteer'
import { serverURL, isServerRunning } from '../spec/runner/server.mjs'
import { Config } from '../spec/runner/config.mjs'
import pc from "picocolors"

let browser
const config = Config.fromProcessEnv(process.env, { terminal: true })
const windowWidth = 1200
const windowHeight = 800

async function halt(errorCode) {
  if (browser) {
    await browser.close()
  }
  process.exit(errorCode)
}

if (!(await isServerRunning())) {
  console.error(pc.red('First start a test server with `npm run test-server &`'))
  halt(3)
}

browser = await puppeteer.launch({
  browser: config.browser,
  headless: config.headless,
  args: [`--window-size=${windowWidth},${windowHeight}`],
  defaultViewport: {
    width:  windowWidth,
    height: windowHeight,
  }
})

const page = await browser.newPage()

const runnerURL = serverURL + '/specs?' + config.toQueryString()
const humanBrowser = config.browser.charAt(0).toUpperCase() + config.browser.slice(1)
console.log(pc.blue("Running specs with %s from %s"), humanBrowser, runnerURL)
console.log()

await page.goto(runnerURL)

let lastRunnerPing = new Date()

page.on('console', (msg) => {
  let text = msg.text()

  // Parse the messages from spec/helpers/terminal_logging.js
  if (!text.startsWith('[SPECS]')) return

  text = text.replace(/^\[SPECS\] /, '')

  let jasminePassed = text.startsWith('Jasmine passed')
  let jasmineIncomplete = text.startsWith('Jasmine incomplete')
  let jasmineFailed = text.startsWith('Jasmine failed')
  let examplePassed = text.startsWith('Example passed')
  let exampleFailed = text.startsWith('Example failed')
  let examplePending = text.startsWith('Example pending')
  let afterAllFailed = text.startsWith('Failure in afterAll') || text.startsWith('Failure in top-level afterAll')

  if (jasminePassed) {
    console.log()
    console.log()
    console.log(pc.green(text))
    halt(0)
  } else if (jasmineIncomplete) {
    console.log()
    console.log()
    console.log(pc.yellow(text))
    halt(0)
  } else if (jasmineFailed) {
    console.log()
    console.log()
    console.log(pc.red(text))
    halt(1)
  } else if (examplePassed) {
    if (config.verbose) {
      console.log(pc.green(text))
    } else {
      process.stdout.write(pc.green('.'))
    }
  } else if (examplePending) {
    if (config.verbose) {
      console.log(pc.yellow(text))
    } else {
      process.stdout.write(pc.yellow('.'))
    }
  } else if (exampleFailed || afterAllFailed) {
    if (!config.verbose) console.log()
    console.log(pc.red(text))
  } else {
    if (!config.verbose) console.log()
    console.log(pc.reset(text))
  }

  lastRunnerPing = new Date()
})

setInterval(async () => {
  // Jasmine default timeout is 30 seconds
  if (new Date() -  lastRunnerPing > 30_000) {
    console.error('Timeout from Jasmine runner')
    let response = await fetch(runnerURL)
    let text = await response.text()
    console.error(text)
    halt(2)
  }
}, 1000)
