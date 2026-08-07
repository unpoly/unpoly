import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lastBuildErrors } from '../dev_env.mjs'

test('lastBuildErrors is null when there is no status', () => {
  assert.equal(lastBuildErrors(() => null), null)
})

test('lastBuildErrors is null when the last build was ok', () => {
  assert.equal(lastBuildErrors(() => ({ ok: true, errors: '' })), null)
})

test('lastBuildErrors returns the errors when the last build failed', () => {
  assert.equal(lastBuildErrors(() => ({ ok: false, errors: 'boom' })), 'boom')
})

test('lastBuildErrors falls back to a placeholder when a failed build has no text', () => {
  assert.match(lastBuildErrors(() => ({ ok: false, errors: '' })), /no error output/)
})
