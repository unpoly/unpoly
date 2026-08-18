import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Config } from '../../runner/config.mjs'

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

test('a bare argument is an error, not a silently ignored filter', () => {
  // `bin/test up.form` used to run the entire suite, because non-flag tokens were
  // dropped — hostile to exactly the person reaching for --spec.
  assert.throws(() => Config.fromArgv(['up.form']), /Unexpected argument: up\.form/)
  // and it suggests the flag the user meant
  assert.throws(() => Config.fromArgv(['up.form']), /--spec="up\.form"/)
})

test('the serialized config cannot break out of the script block it is injected into', () => {
  // ?spec=</script><script>alert(1)</script> used to reflect a live script into the
  // runner page — and the same URL can ask for csp=none, so the header is no defense.
  let json = Config.fromObject({ spec: '</script><script>alert(1)</script>' }).toJSONString()
  assert.doesNotMatch(json, /<\/script>/i)
  assert.match(json, /\\u003c/)
  assert.deepEqual(JSON.parse(json).spec, ['</script><script>alert(1)</script>'], 'still round-trips')
})

test('toPageParams carries only what changes the browser, so a debug link reproduces the run', () => {
  let config = Config.fromArgv(['--csp=strict-dynamic', '--es6', '--verbose', '--headless=false'])
  assert.deepEqual(config.toPageParams(), { csp: 'strict-dynamic', es6: true })
})

test('a default run contributes nothing to the link', () => {
  assert.deepEqual(Config.fromArgv([]).toPageParams(), {})
})

// --- repeatable settings -------------------------------------------------------

test('--spec is repeatable and unions', () => {
  let config = Config.fromArgv(['--spec=up.form', '--spec=up.radio'])
  assert.deepEqual(config.spec, ['up.form', 'up.radio'])
})

test('a single --spec still yields one filter', () => {
  assert.deepEqual(Config.fromArgv(['--spec=up.form']).spec, ['up.form'])
})

test('an absent --spec is an empty list, not an empty string', () => {
  // The browser-side filter checks .length, so "no filter" must not look like one filter.
  assert.deepEqual(Config.fromObject({}).spec, [])
})

test('a repeated flag builds on the environment rather than replacing it', () => {
  let config = Config.fromArgv(['--spec=from-argv'], { SPEC: 'from-env' })
  assert.deepEqual(config.spec, ['from-env', 'from-argv'])
})

test('a list that Express parsed from a repeated query param is accepted as-is', () => {
  assert.deepEqual(Config.fromObject({ spec: ['a', 'b'] }).spec, ['a', 'b'])
})

test('default lists do not show up as changed settings in a debug link', () => {
  // toParams() compares against the defaults; two empty arrays are not "!==" equal.
  assert.deepEqual(Config.fromObject({}).toParams(), {})
})
