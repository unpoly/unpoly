// spec/specs.js lists every spec file by hand (see the comment there). These tests are
// what makes that list safe: they compare it against the files on disk, so a spec file
// nobody loads, or an extracted file that would load at the root of the suite, fails here
// instead of silently not running.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('../../', import.meta.url).pathname
const SPEC_DIR = join(ROOT, 'spec/unpoly')

function specFiles(dir = SPEC_DIR) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    let path = join(dir, entry.name)
    if (entry.isDirectory()) return specFiles(path)
    return entry.name.endsWith('_spec.js') ? [relative(SPEC_DIR, path)] : []
  })
}

// A file is extracted when it names its ancestry with extendDescribe() instead of
// declaring a top-level describe(). Such a file is required by the file it was extracted
// from, never by spec/specs.js.
function isExtracted(path) {
  return /^extendDescribe\(/m.test(readFileSync(join(SPEC_DIR, path), 'utf8'))
}

const required = new Set(
  [...readFileSync(join(ROOT, 'spec/specs.js'), 'utf8')
    .matchAll(/require\('\.\/unpoly\/(.+?)'\)/g)].map((match) => match[1])
)

const onDisk = specFiles()

test('every spec file is either required by spec/specs.js or extracted', () => {
  let missing = onDisk.filter((path) => !required.has(path) && !isExtracted(path))
  assert.deepEqual(missing, [], `not loaded by spec/specs.js: ${missing.join(', ')}`)
})

test('no extracted spec file is required by spec/specs.js', () => {
  let misplaced = onDisk.filter((path) => required.has(path) && isExtracted(path))
  assert.deepEqual(misplaced, [], `would load at the root of the suite: ${misplaced.join(', ')}`)
})

test('spec/specs.js requires no spec file that is gone', () => {
  let stale = [...required].filter((path) => !onDisk.includes(path))
  assert.deepEqual(stale, [], `required but missing from disk: ${stale.join(', ')}`)
})

test('every extracted spec file is required by another spec file', () => {
  let sources = onDisk.map((path) => readFileSync(join(SPEC_DIR, path), 'utf8'))
  let orphans = onDisk.filter((path) => {
    if (!isExtracted(path)) return false
    let name = path.replace(/\.js$/, '').split('/').pop()
    return !sources.some((source) => source.includes(`require('./${name}')`))
  })
  assert.deepEqual(orphans, [], `extracted but nothing requires them: ${orphans.join(', ')}`)
})
