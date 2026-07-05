import { test } from 'node:test'
import assert from 'node:assert/strict'
import { failureBlock, runSummary, groupSummary, mark } from '../terminal/formatter.mjs'

const FAILURE = {
  index: 1,
  path: 'up.layer → opens overlay',
  messages: ['Expected true to be false.'],
  frames: ['spec/unpoly/layer_spec.js:12 in anonymous function'],
  log: ['log: 🔧 agent marker', 'log: up:request:load Loading GET /x'],
  dom: [{ tag: 'div', id: 'fixtures', classes: [], attrs: {}, children: [] }],
  debugURL: 'http://localhost:4000/specs?spec=up.layer%20opens%20overlay',
}

test('compact failure omits browser log and HTML state', () => {
  let out = failureBlock(FAILURE, { verbose: false })
  assert.match(out, /F1\)/)
  assert.match(out, /Expected true to be false\./)
  assert.match(out, /layer_spec\.js:12/)
  assert.doesNotMatch(out, /Browser log/)
  assert.doesNotMatch(out, /agent marker/)
  assert.doesNotMatch(out, /HTML state/)
  assert.match(out, /Debug in browser/)
})

test('verbose failure includes an agent-inserted debug log and HTML state', () => {
  let out = failureBlock(FAILURE, { verbose: true })
  assert.match(out, /Browser log:/)
  assert.match(out, /🔧 agent marker/)
  assert.match(out, /HTML state:/)
  assert.match(out, /#fixtures/)
})

test('run summary reports counts', () => {
  assert.match(runSummary({ passed: 56, failed: 1, pending: 1 }), /56 passed, 1 failed, 1 skipped/)
})

test('the --verbose hint (on failure) is preceded by a blank line', () => {
  assert.match(runSummary({ passed: 5, failed: 1, pending: 0 }, { verbose: false }), /\n\nRe-run with --verbose/)
})

test('no --verbose hint when passing or already verbose', () => {
  assert.doesNotMatch(runSummary({ passed: 5, failed: 0, pending: 0 }), /Re-run/)
  assert.doesNotMatch(runSummary({ passed: 5, failed: 1, pending: 0 }, { verbose: true }), /Re-run/)
})

test('group summary shows only passed when all pass', () => {
  assert.match(groupSummary({ passed: 14, failed: 0, pending: 0 }), /14 passed/)
})

test('mark maps status to a glyph', () => {
  assert.equal(mark('passed'), '.')
  assert.equal(mark('failed'), 'F')
  assert.equal(mark('pending'), 'S')
})
