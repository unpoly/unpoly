import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { CONFIGS } from '../../build/bundles.mjs'
import { DECLARATION, declarationFile } from '../../build/esbuild.mjs'
import { PROJECT_ROOT } from '../../build/build_status.mjs'

const pkg = JSON.parse(readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'))
const published = CONFIGS.production.bundles

// `unpoly*.d.ts` → /^unpoly[^/]*\.d\.ts$/
const globToRegExp = (glob) => new RegExp(`^${glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')}$`)
const isPacked = (file) => pkg.files.some((glob) => globToRegExp(glob).test(file))

test('every bundle we publish gets a declaration file beside it', () => {
  // Without one, a TypeScript app with `allowJs` that imports the bundle fails with TS2306.
  assert.deepEqual(published.filter((bundle) => !bundle.declaration).map((bundle) => bundle.out), [])
  assert.equal(declarationFile({ out: 'unpoly.es6.min.js' }), 'unpoly.es6.min.d.ts')
})

test('the dev-only bundles get no declaration file', () => {
  let devOnly = CONFIGS.development.bundles.filter((bundle) => !published.some((p) => p.out === bundle.out))
  assert.ok(devOnly.length > 0)
  assert.deepEqual(devOnly.filter((bundle) => bundle.declaration).map((bundle) => bundle.out), [])
})

test('the npm package contains every declaration file, and points `types` at the one for `main`', () => {
  for (let bundle of published) {
    assert.ok(isPacked(declarationFile(bundle)), `package.json { files } misses ${declarationFile(bundle)}`)
  }
  assert.equal(pkg.types, declarationFile({ out: pkg.main }))
})

test('the declaration file makes the bundle a module, but declares nothing', () => {
  // A declared `up` would collide with the one an app declares itself.
  let code = DECLARATION.replace(/^\/\/.*$/gm, '').trim()
  assert.equal(code, 'export {}')
})
