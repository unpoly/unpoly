import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBuildArgs } from '../../build/build.mjs'

test('defaults to a gzipped production build', () => {
  assert.deepEqual(parseBuildArgs([]), { config: 'production', watch: false, gzip: true })
})

test('gzip defaults off for non-production configs', () => {
  assert.equal(parseBuildArgs(['--config=development']).gzip, false)
  assert.equal(parseBuildArgs(['--config=ci']).gzip, false)
})

test('--gzip / --no-gzip override the per-config default', () => {
  assert.equal(parseBuildArgs(['--config=development', '--gzip']).gzip, true)
  assert.equal(parseBuildArgs(['--no-gzip']).gzip, false) // production, but forced off
})

test('--watch is parsed', () => {
  assert.equal(parseBuildArgs(['--config=development', '--watch']).watch, true)
})

test('an unknown option throws', () => {
  assert.throws(() => parseBuildArgs(['--nope']), /Unknown build option/)
})

test('an unknown config throws', () => {
  assert.throws(() => parseBuildArgs(['--config=staging']), /Unknown --config/)
})
