// Apps minify unpoly.js with their own minifier, which renames our classes. Chrome must still label
// an uncaught error `Uncaught up.Aborted: …`, since apps filter console errors in their tests by that
// text. How V8 picks the label (see the class naming in src/unpoly.ts) is invisible to a spec, so we
// check it here, in headless Chrome, on a bundle minified like verkehrswacht and Vite do.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import esbuild from 'esbuild'
import puppeteer from 'puppeteer'
import { CONFIGS } from '../../build/bundles.mjs'
import { esbuildOptions } from '../../build/esbuild.mjs'

async function buildMinifiedByApp() {
  let bundle = CONFIGS.production.bundles.find((bundle) => bundle.out === 'unpoly.js')
  let result = await esbuild.build(esbuildOptions({ ...bundle, styles: false }, { sourcemap: false }))
  let js = result.outputFiles.find((file) => file.path.endsWith('.js')).text
  return (await esbuild.transform(js, { minify: true })).code
}

test('Chrome labels our errors and objects by their public names after an app minified unpoly.js', async () => {
  let [js, browser] = await Promise.all([buildMinifiedByApp(), puppeteer.launch({ headless: true })])
  try {
    let page = await browser.newPage()
    let cdp = await page.createCDPSession()
    let uncaught = []
    let logged = []
    cdp.on('Runtime.exceptionThrown', (event) => uncaught.push(event.exceptionDetails.exception.className))
    cdp.on('Runtime.consoleAPICalled', (event) => { if (event.type === 'log') logged.push(event.args[0].className) })
    await cdp.send('Runtime.enable')
    await page.setContent('<!DOCTYPE html><html><body></body></html>')
    await page.addScriptTag({ content: js })

    // A string, so the error is thrown from page code. An error from a puppeteer function comes
    // without its exception object.
    await page.evaluate(`
      setTimeout(() => { throw new up.Aborted('message') })
      setTimeout(() => { throw new up.CannotMatch('message') })
      console.log(new up.Request({ url: '/path' }))
      console.log(up.layer.root)
    `)
    await new Promise((resolve) => setTimeout(resolve, 100))

    // The minifier must have dropped the class name, or this test proves nothing.
    assert.match(await page.evaluate('up.Aborted.toString()'), /^class extends /)
    assert.deepEqual(uncaught, ['up.Aborted', 'up.CannotMatch'])
    assert.deepEqual(logged, ['up.Request', 'up.Layer'])
  } finally {
    await browser.close()
  }
})
