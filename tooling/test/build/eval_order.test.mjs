// In an import cycle, a module may read another module's binding before that module is evaluated.
// esbuild declares every module-level binding with `var`, so such a read silently returns
// `undefined` instead of throwing. We turn those `var`s into `let`, so a read before initialization
// throws a ReferenceError, and load the bundle in headless Chrome.
// We test esbuild's raw output, without the strict directive and Terser pass that finish() adds
// to the shipped file. Neither changes when a module is evaluated.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import esbuild from 'esbuild'
import puppeteer from 'puppeteer'
import { CONFIGS } from '../../build/bundles.mjs'
import { esbuildOptions } from '../../build/esbuild.mjs'

async function buildWithLet(out) {
  let bundle = CONFIGS.production.bundles.find((bundle) => bundle.out === out)
  let result = await esbuild.build(esbuildOptions({ ...bundle, styles: false }, { sourcemap: false }))
  let js = result.outputFiles.find((file) => file.path.endsWith('.js')).text
  let bindingCount = js.match(/^ {2}var /gm)?.length ?? 0
  // If esbuild changes its output, the replacement below would do nothing and prove nothing.
  assert.ok(bindingCount > 100, `Expected over 100 top-level vars in ${out}, found ${bindingCount}`)
  return js.replace(/^ {2}var /gm, '  let ')
}

for (let out of ['unpoly.js', 'unpoly.es6.js']) {
  test(`${out} reads no module binding before its module is evaluated`, async () => {
    let [js, browser] = await Promise.all([buildWithLet(out), puppeteer.launch({ headless: true })])
    try {
      let page = await browser.newPage()
      let errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setContent('<!DOCTYPE html><html><body></body></html>')
      await page.addScriptTag({ content: js }).catch((error) => errors.push(error.message))

      assert.deepEqual(errors, [])
      assert.equal(await page.evaluate('typeof up'), 'object')
    } finally {
      await browser.close()
    }
  })
}
