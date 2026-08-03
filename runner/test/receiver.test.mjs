import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createReceiver } from '../terminal/receiver.mjs'

const noRemap = { remapStack: async (stack) => stack }

async function run(events) {
  let buffer = ''
  let receiver = createReceiver({
    remapper: noRemap,
    serverURL: 'http://localhost:4000',
    out: { write: (string) => { buffer += string } },
  })
  let code
  for (let event of events) {
    let result = await receiver.handle(event)
    if (result !== undefined) code = result
  }
  return { text: buffer, code }
}

test('prints live progress and a passing summary, exit 0', async () => {
  let { text, code } = await run([
    { type: 'jasmineStarted', totalSpecs: 2 },
    { type: 'suiteStarted', description: 'up.util' },
    { type: 'specDone', fullName: 'up.util a', description: 'a', status: 'passed' },
    { type: 'specDone', fullName: 'up.util b', description: 'b', status: 'passed' },
    { type: 'suiteDone', description: 'up.util', failedExpectations: [] },
    { type: 'jasmineDone', overallStatus: 'passed' },
  ])
  assert.match(text, /up\.util \.\. 2 passed/)
  assert.match(text, /2 passed, 0 failed, 0 skipped/)
  assert.equal(code, 0)
})

test('collects a failure with remapped path and exit 1', async () => {
  let { text, code } = await run([
    { type: 'suiteStarted', description: 'up.layer' },
    {
      type: 'specDone', fullName: 'up.layer opens', description: 'opens', status: 'failed',
      failedExpectations: [{ message: 'boom', stack: 'at fn (spec/layer_spec.js:5:1)' }],
      failure: { log: ['log: x'], dom: [] },
    },
    { type: 'suiteDone', description: 'up.layer', failedExpectations: [] },
    { type: 'jasmineDone', overallStatus: 'failed' },
  ])
  assert.match(text, /up\.layer .*F.* 0 passed, 1 failed/)
  assert.match(text, /F1\) up\.layer → opens/)
  assert.match(text, /boom/)
  assert.match(text, /spec\/layer_spec\.js:5 in fn\(\)/)
  assert.match(text, /Debug in browser/)
  assert.equal(code, 1)
})

test('lists every failure at the end, blank-line separated, then the summary', async () => {
  let { text, code } = await run([
    { type: 'suiteStarted', description: 'up.thing' },
    {
      type: 'specDone', fullName: 'up.thing a', description: 'a', status: 'failed',
      failedExpectations: [{ message: 'boom a', stack: 'at f (spec/a_spec.js:1:1)' }],
      failure: { log: [], dom: [] },
    },
    {
      type: 'specDone', fullName: 'up.thing b', description: 'b', status: 'failed',
      failedExpectations: [{ message: 'boom b', stack: 'at g (spec/b_spec.js:2:1)' }],
      failure: { log: [], dom: [] },
    },
    { type: 'suiteDone', description: 'up.thing', failedExpectations: [] },
    { type: 'jasmineDone', overallStatus: 'failed' },
  ])
  // Both failures listed, each preceded by a blank line.
  assert.match(text, /\n\nF1\) up\.thing → a/)
  assert.match(text, /\n\nF2\) up\.thing → b/)
  assert.match(text, /boom a/)
  assert.match(text, /boom b/)
  // Summary comes last, also preceded by a blank line.
  assert.match(text, /\n\n0 passed, 2 failed, 0 skipped/)
  // Ordering: F1 before F2, both before the final run summary ("0 skipped" only
  // appears there, not in the group progress line).
  assert.ok(text.indexOf('F1)') < text.indexOf('F2)'))
  assert.ok(text.indexOf('F2)') < text.indexOf('0 passed, 2 failed, 0 skipped'))
  assert.equal(code, 1)
})

test('reports only the first expectation of a failed spec, noting the rest', async () => {
  let { text } = await run([
    { type: 'suiteStarted', description: 'up.thing' },
    {
      type: 'specDone', fullName: 'up.thing x', description: 'x', status: 'failed',
      failedExpectations: [
        { message: 'first boom', stack: 'at f (spec/x_spec.js:1:1)' },
        { message: 'second boom', stack: 'at g (spec/x_spec.js:2:1)' },
      ],
      failure: { log: [], dom: [] },
    },
    { type: 'suiteDone', description: 'up.thing', failedExpectations: [] },
    { type: 'jasmineDone', overallStatus: 'failed' },
  ])
  assert.match(text, /first boom/)
  assert.doesNotMatch(text, /second boom/)
  assert.match(text, /\+1 more failed expectation, not shown/)
})

test('excluded specs are ignored', async () => {
  let { text } = await run([
    { type: 'suiteStarted', description: 'up.form' },
    { type: 'specDone', fullName: 'up.form x', description: 'x', status: 'excluded' },
    { type: 'specDone', fullName: 'up.form y', description: 'y', status: 'passed' },
    { type: 'suiteDone', description: 'up.form', failedExpectations: [] },
    { type: 'jasmineDone', overallStatus: 'passed' },
  ])
  assert.match(text, /up\.form \. 1 passed/) // one dot, one passed (excluded skipped)
})
