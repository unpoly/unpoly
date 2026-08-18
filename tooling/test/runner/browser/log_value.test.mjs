import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatLogArgs, serializeArg } from '../../../runner/browser/log_value.mjs'

test('joins simple args with spaces', () => {
  assert.equal(formatLogArgs(['hello', 42, true]), 'hello 42 true')
})

test('serializes objects and arrays', () => {
  assert.equal(formatLogArgs(['state', { a: 1 }]), 'state {"a":1}')
  assert.equal(formatLogArgs([[1, 2, 3]]), '[1, 2, 3]')
})

test('resolves %s and %o substitution', () => {
  assert.equal(formatLogArgs(['a=%s b=%o', 'A', { x: 1 }]), 'a=A b={"x":1}')
})

test('%o quotes strings, %s does not', () => {
  assert.equal(formatLogArgs(['%s', 'raw']), 'raw')
  assert.equal(formatLogArgs(['%o', 'raw']), '"raw"')
})

test('appends leftover args after substitution', () => {
  assert.equal(formatLogArgs(['x=%d', 1, 'extra']), 'x=1 extra')
})

test('drops %c style directives', () => {
  assert.equal(formatLogArgs(['%cstyled', 'color:red']), 'styled')
})

test('handles circular structures', () => {
  let object = {}
  object.self = object
  assert.equal(serializeArg(object), '(circular structure)')
})

test('truncates very long values', () => {
  let long = 'x'.repeat(500)
  let result = serializeArg(long)
  assert.ok(result.length < 210)
  assert.ok(result.endsWith('…'))
})
