import { test } from 'node:test'
import assert from 'node:assert/strict'
import { specsURL } from '../../../runner/terminal/urls.mjs'

test('builds the /specs URL with %20-encoded spaces (not +)', () => {
  assert.equal(
    specsURL('http://localhost:4000', { spec: 'up.form submits' }),
    'http://localhost:4000/specs?spec=up.form%20submits'
  )
})

test('omits the query when there are no params', () => {
  assert.equal(specsURL('http://localhost:4000', {}), 'http://localhost:4000/specs')
})

test('encodes multiple params', () => {
  let url = specsURL('http://x', { csp: 'nonce-only', es6: 'true' })
  assert.match(url, /csp=nonce-only/)
  assert.match(url, /es6=true/)
})

test('a repeatable setting becomes one query param per value', () => {
  // Passing the array straight to URLSearchParams would comma-join it into a single
  // filter that matches nothing.
  let url = specsURL('http://localhost:4000', { spec: ['up.form [up-switch]', 'up.radio'] })
  assert.equal(url, 'http://localhost:4000/specs?spec=up.form%20%5Bup-switch%5D&spec=up.radio')
})

test('a single value still produces a single param', () => {
  assert.equal(specsURL('http://x', { spec: 'up.form' }), 'http://x/specs?spec=up.form')
})
