import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Config } from '../../../runner/config.mjs'
import { missingDistFiles } from '../../../runner/terminal/run.mjs'

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
