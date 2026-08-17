import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatStack } from '../terminal/stack.mjs'

const STACK = [
  'at <Jasmine>',
  'at createElements (src/unpoly/layer.js:47:5)',
  'at UserContext.<anonymous> (spec/unpoly/layer_spec.js:1234:9)',
  'at Object.matches (node_modules/jasmine-core/expect.js:343:20)',
].join('\n')

test('compact shows only the topmost spec and src frames, spec first', () => {
  assert.deepEqual(formatStack(STACK, { verbose: false }), [
    'spec/unpoly/layer_spec.js:1234 in anonymous function',
    'src/unpoly/layer.js:47 in createElements()',
  ])
})

test('compact keeps only the topmost src frame when several are present', () => {
  const deep = [
    'at inner (src/unpoly/util.js:10:1)',
    'at outer (src/unpoly/util.js:20:1)',
    'at UserContext.<anonymous> (spec/unpoly/util_spec.js:99:1)',
    'at <Jasmine>',
  ].join('\n')
  assert.deepEqual(formatStack(deep, { verbose: false }), [
    'spec/unpoly/util_spec.js:99 in anonymous function',
    'src/unpoly/util.js:10 in inner()',
  ])
})

test('compact of a plain expectation failure is just the spec line', () => {
  assert.deepEqual(
    formatStack('at UserContext.<anonymous> (spec/unpoly/x_spec.js:5:1)\nat <Jasmine>', { verbose: false }),
    ['spec/unpoly/x_spec.js:5 in anonymous function']
  )
})

test('verbose keeps all frames (incl. jasmine + node_modules)', () => {
  let lines = formatStack(STACK, { verbose: true })
  assert.ok(lines.includes('<jasmine internals>'))
  assert.ok(lines.some((line) => line.includes('node_modules/jasmine-core/expect.js:343')))
  assert.ok(lines.some((line) => line.includes('src/unpoly/layer.js:47')))
  assert.ok(lines.some((line) => line.includes('spec/unpoly/layer_spec.js:1234')))
})

test('an unmapped stack still shows frames instead of an empty Stacktrace', () => {
  // When source maps are missing the frames are bundle URLs, matching neither spec/ nor
  // src/ — the compact filter then returned nothing and the failure block printed a bare
  // `Stacktrace:` header, leaving no location at all.
  const raw = [
    'at Object.<anonymous> (http://localhost:4000/dist/specs.js:12345:6)',
    'at http://localhost:4000/dist/specs.js:9999:1',
  ].join('\n')

  const frames = formatStack(raw, { verbose: false })
  assert.ok(frames.length, 'must not be empty')
  assert.ok(frames.length <= 2, 'stays compact')
  assert.match(frames[0], /specs\.js:12345/)
})
