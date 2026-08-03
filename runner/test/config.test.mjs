import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Config } from '../config.mjs'

test('fromArgv parses --key=value and bare flags', () => {
  let config = Config.fromArgv(['--csp=nonce-only', '--es6'])
  assert.equal(config.csp, 'nonce-only')
  assert.equal(config.es6, true)
})

test('CLI overrides env', () => {
  assert.equal(Config.fromArgv(['--csp=none'], { CSP: 'strict-dynamic' }).csp, 'none')
})

test('env used when no CLI flag given', () => {
  assert.equal(Config.fromArgv([], { MIGRATE: 'true' }).migrate, true)
})

test('unknown flag throws; a known flag does not', () => {
  assert.throws(() => Config.fromArgv(['--nope=1']), /Unknown option: --nope/)
  assert.doesNotThrow(() => Config.fromArgv(['--csp=none']))
})

test('verbose is part of the schema (flag or env)', () => {
  assert.equal(Config.fromArgv(['--verbose']).verbose, true)
  assert.equal(Config.fromArgv([], { VERBOSE: '1' }).verbose, true)
  assert.equal(Config.fromArgv([]).verbose, false)
})

test('stopOnFailure defaults true; kebab-case flag and env can disable it', () => {
  assert.equal(Config.fromArgv([]).stopOnFailure, true)
  assert.equal(Config.fromArgv(['--stop-on-failure=false']).stopOnFailure, false)
  assert.equal(Config.fromArgv([], { STOPONFAILURE: 'false' }).stopOnFailure, false)
})

test('toCSPHeader per csp setting', () => {
  assert.equal(Config.fromArgv(['--csp=none']).toCSPHeader(), undefined)
  assert.match(Config.fromArgv(['--csp=nonce-only']).toCSPHeader(), /script-src 'nonce-specs-nonce'/)
  assert.match(Config.fromArgv(['--csp=strict-dynamic']).toCSPHeader(), /'strict-dynamic'/)
})

test('distFilenames reflect es6 and minify', () => {
  assert.deepEqual(Config.fromArgv([]).distFilenames(),
    { unpoly: 'unpoly.js', specs: 'specs.js', migrate: 'unpoly-migrate.js', jasmine: 'jasmine.js' })
  assert.deepEqual(Config.fromArgv(['--es6', '--minify']).distFilenames(),
    { unpoly: 'unpoly.es6.min.js', specs: 'specs.es6.js', migrate: 'unpoly-migrate.min.js', jasmine: 'jasmine.js' })
})
