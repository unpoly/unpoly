// Injected into dist/jasmine.js (see bundles.mjs): jasmine-html.js and boot*.js expect
// these two as globals, which jasmine.js only defines when it runs as a plain script.
import jasmineRequire from 'jasmine-core/lib/jasmine-core/jasmine.js'

export { jasmineRequire }

export function getJasmineRequireObj() {
  return jasmineRequire
}
