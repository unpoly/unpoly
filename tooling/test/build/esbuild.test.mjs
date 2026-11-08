import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SourceMapConsumer } from 'source-map'
import { insertStrictDirective } from '../../build/esbuild.mjs'

// A bundle as esbuild prints it: one IIFE. The map points line 2 (`up.x = 1`) at line 5 of foo.js.
const JS = '(() => {\n  up.x = 1;\n})();\n'
const MAP = JSON.stringify({ version: 3, sources: ['foo.js'], names: [], mappings: ';AAIA' })

test('puts "use strict" first inside the IIFE, not at the top of the file', () => {
  // A file-level directive would leak into every script concatenated after unpoly.js.
  let { js } = insertStrictDirective(JS, null)
  assert.equal(js, '(() => {\n  "use strict";\n  up.x = 1;\n})();\n')
})

test('moves the source map down by the line it inserts', async () => {
  let { js, map } = insertStrictDirective(JS, MAP)
  let line = js.split('\n').findIndex((text) => text.includes('up.x')) + 1
  let consumer = await new SourceMapConsumer(JSON.parse(map))
  assert.deepEqual(consumer.originalPositionFor({ line, column: 2 }), { source: 'foo.js', line: 5, column: 0, name: null })
})

test('refuses a bundle that is not an IIFE, rather than inserting the directive somewhere else', () => {
  assert.throws(() => insertStrictDirective('"use strict";\nfoo()', null), /Expected the bundle to start with/)
})
