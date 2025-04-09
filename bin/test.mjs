import puppeteer from 'puppeteer'
import { serverURL, isServerRunning } from '../spec/runner/server.mjs'
import { Config } from '../spec/runner/config.mjs'
import pc from "picocolors"

let browser

if (!(await isServerRunning())) {
  console.error(pc.red('First start a test server with `npm run test-server &`'))
  halt(3)
}

const windowWidth = 1200
const windowHeight = 800

browser = await puppeteer.launch({
  // headless: false,
  args: [`--window-size=${windowWidth},${windowHeight}`],
  defaultViewport: {
    width:  windowWidth,
    height: windowHeight,
  }
})

const page = await browser.newPage()
const config = Config.fromProcessEnv(process.env, { console: true })

const runnerURL = serverURL + '/specs?' + config.toQueryString()
console.log(pc.blue("Running specs from " + runnerURL))
await page.goto(runnerURL)

let lastRunnerPing = new Date()

async function halt(errorCode) {
  if (browser) {
    await browser.close()
  }
  process.exit(errorCode)
}

page.on('console', async (msg) => {
  let text = msg.text()

  if (!text.startsWith('[SPECS]')) return

  text = text.replace(/^\[SPECS\] /, '')

  let jasminePassed = text.startsWith('Jasmine passed')
  let jasmineIncomplete = text.startsWith('Jasmine incomplete')
  let jasmineFailed = text.startsWith('Jasmine failed')
  let examplePassed = text.startsWith('Example passed')
  let exampleFailed = text.startsWith('Example failed')
  let examplePending = text.startsWith('Example pending')

  let coloredText
  if (examplePassed || jasminePassed) {
    coloredText = pc.green(text)
  } else if (exampleFailed || jasmineFailed) {
    coloredText = pc.red(text)
  } else if (examplePending || jasmineIncomplete) {
    coloredText = pc.yellow(text)
  } else {
    coloredText = pc.reset(text)
  }

  console.log(coloredText)
  lastRunnerPing = new Date()

  if (jasminePassed || jasmineIncomplete) {
    halt(0)
  } else if (jasmineFailed) {
    await browser.close()
    halt(1)
  }
})

setInterval(() => {
  // Jasmine default timeout is 30 seconds
  if (new Date() -  lastRunnerPing > 35_000) {
    console.error('Timeout from Jasmine runner')
    halt(2)
  }
}, 1000)
