// spec/specs.js lists every spec file by hand (see the comment there), and extracted files
// are required from the group they were extracted from. These tests are what makes that
// safe: a spec file nobody loads, a require() of a file that is gone, or an extracted file
// whose extendDescribe() chain names the wrong place fails here instead of silently
// misbehaving. They read the real suite through the parser behind bin/find-spec.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSuite, readSources, staleChains } from '../find_spec.mjs'

const ROOT = new URL('../../', import.meta.url).pathname
const sources = readSources(ROOT)
const suite = parseSuite(sources)

test('every spec file is loaded, by spec/specs.js or by the file it was extracted from', () => {
  let unloaded = Object.keys(sources).filter((file) => file !== 'spec/specs.js' && !suite.loaded.has(file))
  assert.deepEqual(unloaded, [], `not loaded by anything: ${unloaded.join(', ')}`)
})

test('every required spec file exists', () => {
  let stale = suite.missing.map(({ file, line, required }) => `${file}:${line} → ${required}`)
  assert.deepEqual(stale, [], `required but missing from disk: ${stale.join(', ')}`)
})

test("every extracted file's extendDescribe() chain names the group it is required into", () => {
  // Also fails for an extracted file required by spec/specs.js (it would load at the root
  // of the suite) and for a module file required from inside a group.
  let stale = staleChains(suite).map(({ file, line, chain, titles }) =>
    `${file}:${line} names [${chain.join(' › ')}] but is required into [${titles.slice(0, -1).join(' › ')}]`)
  assert.deepEqual(stale, [], stale.join('\n'))
})
