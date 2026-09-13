import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Config } from '../../../runner/config.mjs'
import { missingDistFiles, outdatedMinifiedFiles } from '../../../runner/terminal/run.mjs'

// A throwaway dist/ holding exactly `names`.
function dist(names = []) {
  let dir = mkdtempSync(path.join(tmpdir(), 'unpoly-dist-'))
  for (let name of names) writeFileSync(path.join(dir, name), '')
  return dir
}

test('reports the bundles the page loads, and only those', () => {
  // unpoly-migrate.js is absent from the list: runner.ejs does not load it unless
  // --migrate, so demanding it would fail a run over a file nobody requests.
  assert.deepEqual(missingDistFiles(Config.fromArgv([]), dist()),
    ['unpoly.js', 'specs.js', 'jasmine.js'])
})

test('--migrate adds unpoly-migrate.js', () => {
  assert.ok(missingDistFiles(Config.fromArgv(['--migrate']), dist()).includes('unpoly-migrate.js'))
})

test('--minify asks for the minified bundle the dev watcher never builds', () => {
  assert.ok(missingDistFiles(Config.fromArgv(['--minify']), dist()).includes('unpoly.min.js'))
})

test('nothing is missing once the watcher has built', () => {
  // What tooling/build/webpack/development.js produces, which is every bundle a default
  // run loads — so the fresh-clone path must reach the specs, not a hard error.
  let built = dist(['unpoly.js', 'unpoly.es6.js', 'unpoly-migrate.js', 'specs.js', 'specs.es6.js', 'jasmine.js'])
  assert.deepEqual(missingDistFiles(Config.fromArgv([]), built), [])
  assert.deepEqual(missingDistFiles(Config.fromArgv(['--migrate']), built), [])
})


// A throwaway dist/ whose files are `ageMs` older than `now`, so a test can put a bundle
// on either side of the newest source without touching the real tree.
const NOW = 1_700_000_000_000
function agedDist(names, ageMs) {
  let dir = dist(names)
  let when = new Date(NOW - ageMs)
  for (let name of names) utimesSync(path.join(dir, name), when, when)
  return dir
}

test('a run without --minify asks for no minified bundle', () => {
  // Also means no source walk: the third argument stays unused because we return early.
  assert.deepEqual(outdatedMinifiedFiles(Config.fromArgv([]), dist()), [])
  assert.deepEqual(outdatedMinifiedFiles(Config.fromArgv(['--migrate']), dist()), [])
})

test('--minify reports a minified bundle that is not there', () => {
  assert.deepEqual(outdatedMinifiedFiles(Config.fromArgv(['--minify']), dist(), NOW), ['unpoly.min.js'])
})

test('--minify reports a minified bundle older than the newest source', () => {
  let built = agedDist(['unpoly.min.js'], 60_000)
  assert.deepEqual(outdatedMinifiedFiles(Config.fromArgv(['--minify']), built, NOW), ['unpoly.min.js'])
})

test('--minify accepts a minified bundle newer than the newest source', () => {
  let built = agedDist(['unpoly.min.js'], 0)
  assert.deepEqual(outdatedMinifiedFiles(Config.fromArgv(['--minify']), built, NOW - 60_000), [])
})

test('--minify --migrate also judges the migrate bundle', () => {
  let built = agedDist(['unpoly.min.js'], 0)
  assert.deepEqual(
    outdatedMinifiedFiles(Config.fromArgv(['--minify', '--migrate']), built, NOW - 60_000),
    ['unpoly-migrate.min.js'])
})

test('--es6 --minify asks for the es6 bundle, which only --config=minified builds', () => {
  assert.deepEqual(
    outdatedMinifiedFiles(Config.fromArgv(['--es6', '--minify']), dist(), NOW),
    ['unpoly.es6.min.js'])
})
