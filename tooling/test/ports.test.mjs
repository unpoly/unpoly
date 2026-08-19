import { test } from 'node:test'
import assert from 'node:assert/strict'
import { portsFor } from '../ports.mjs'

test('with no offset, the ports the guides name', () => {
  // docs/contributing quotes 4000, 4001 and 4567 in a dozen places, and
  // trying-out-changes.md tells agents to point a browser at 4001. The default checkout has
  // to keep them.
  assert.deepEqual(portsFor({}), { specServer: 4000, scratch: 4001, startLock: 4099, docs: 4567, offset: 0 })
  assert.equal(portsFor({ PORT_OFFSET: '' }).scratch, 4001)
})

test('an offset moves every port together', () => {
  assert.deepEqual(portsFor({ PORT_OFFSET: '100' }),
    { specServer: 4100, scratch: 4101, startLock: 4199, docs: 4667, offset: 100 })
})

test('the start lock moves too, so two checkouts stop serialising against each other', () => {
  assert.notEqual(portsFor({ PORT_OFFSET: '100' }).startLock, portsFor({}).startLock)
})

test('a garbage offset is refused by name', () => {
  // Otherwise the ports come out NaN and every listen fails with something that never
  // mentions PORT_OFFSET.
  for (const raw of ['abc', '1.5', '-1', 'null']) {
    assert.throws(() => portsFor({ PORT_OFFSET: raw }), /PORT_OFFSET must be a non-negative integer/)
  }
})
