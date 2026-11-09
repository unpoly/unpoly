import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SourceLinter } from '../../build/lint.mjs'

// An entry without apis, so it has no collisions.
const EMPTY_ENTRY = 'const apis = []\n'

// A project of its own, with a one-rule Oxlint config, so the test doesn't depend on src/.
function project(t, files) {
  let root = mkdtempSync(path.join(tmpdir(), 'source-linter-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  let at = (file) => path.join(root, file)
  let write = (file, content) => {
    mkdirSync(path.dirname(at(file)), { recursive: true })
    writeFileSync(at(file), content)
    // The collision check reads a module again when its mtime moved.
    let later = new Date(Date.now() + 5000)
    utimesSync(at(file), later, later)
  }
  write('.oxlintrc.json', JSON.stringify({ categories: { correctness: 'off' }, rules: { 'no-debugger': 'error', 'no-var': 'warn' } }))
  for (let [file, content] of Object.entries(files)) write(file, content)
  return { root, at, write }
}

test('a change without a file name lints all of src/', async (t) => {
  // The watcher's first round is one, so an error that was there before it started shows up. So
  // is a new or moved directory, whose files have no events of their own.
  let { root, write } = project(t, { 'src/unpoly.ts': EMPTY_ENTRY, 'src/unpoly/bad.js': 'debugger\n' })
  let linter = new SourceLinter({ root })
  assert.deepEqual(await linter.lint([null]), ['src/unpoly/bad.js\n  1:1      error  `debugger` statement is not allowed  eslint(no-debugger)'])
  write('src/moved/worse.js', 'debugger\n')
  assert.equal((await linter.lint([null])).length, 2)
})

test('later calls lint the changed files, and errors stand until their file is fixed', async (t) => {
  let { root, at, write } = project(t, { 'src/unpoly.ts': EMPTY_ENTRY, 'src/unpoly/bad.js': 'let b = 1\n' })
  let linter = new SourceLinter({ root })
  assert.deepEqual(await linter.lint([null]), [])

  write('src/unpoly/bad.js', 'debugger\n')
  assert.match((await linter.lint([at('src/unpoly/bad.js')]))[0], /bad\.js/)
  assert.match((await linter.lint([at('src/unpoly.ts')]))[0], /bad\.js/, 'an unrelated change keeps the error')

  write('src/unpoly/bad.js', 'let b = 1\n')
  assert.deepEqual(await linter.lint([at('src/unpoly/bad.js')]), [])
})

test('warnings are kept apart from errors, for the last call only', async (t) => {
  let { root, at, write } = project(t, { 'src/unpoly.ts': EMPTY_ENTRY, 'src/unpoly/old.js': 'var b = 1\n' })
  let linter = new SourceLinter({ root })
  assert.deepEqual(await linter.lint([null]), [], 'a warning is no error')
  assert.match(linter.warnings[0], /^src\/unpoly\/old\.js\n.*warning .*no-var/)

  write('src/unpoly/other.js', 'let c = 1\n')
  await linter.lint([at('src/unpoly/other.js')])
  assert.deepEqual(linter.warnings, [])
})

test('a failed Oxlint run fails its round only, and the next round lints the files it missed', async (t) => {
  // The bug this guards against: a broken config failed every later round, until the watcher
  // restarted, and the changed files' errors were lost.
  let { root, at, write } = project(t, {
    'src/unpoly.ts': EMPTY_ENTRY,
    'src/unpoly/a.js': 'debugger\n',
    'src/unpoly/b.js': 'let b = 1\n',
    'src/unpoly/c.js': 'let c = 1\n',
  })
  let files = (errors) => errors.map((error) => error.split('\n')[0])
  let linter = new SourceLinter({ root })
  assert.deepEqual(files(await linter.lint([null])), ['src/unpoly/a.js'])

  let config = readFileSync(at('.oxlintrc.json'), 'utf8')
  write('.oxlintrc.json', '{ broken')
  write('src/unpoly/b.js', 'debugger\n')
  let errors = await linter.lint([at('src/unpoly/b.js')])
  assert.deepEqual(files(errors), ['src/unpoly/a.js', '.oxlintrc.json'], 'the errors from before stand')
  assert.match(errors[1], /error {2}Oxlint failed: /)

  write('.oxlintrc.json', config)
  write('src/unpoly/c.js', 'let c = 2\n')
  assert.deepEqual(files(await linter.lint([at('src/unpoly/c.js')])), ['src/unpoly/a.js', 'src/unpoly/b.js'])

  write('src/unpoly/b.js', 'let b = 1\n')
  assert.deepEqual(files(await linter.lint([at('src/unpoly/b.js')])), ['src/unpoly/a.js'])
})

test('a change to any module checks the entry for api collisions again', async (t) => {
  let { root, at, write } = project(t, {
    'src/unpoly.ts': "import * as alpha from './unpoly/alpha.js'\nimport * as beta from './unpoly/beta.js'\nconst apis = [alpha.api, beta.api]\n",
    'src/unpoly/alpha.js': 'export const api = { fragment: 1 }\n',
    'src/unpoly/beta.js': 'export const api = { layer: 2 }\n',
  })
  let linter = new SourceLinter({ root })
  assert.deepEqual(await linter.lint([null]), [])

  write('src/unpoly/beta.js', 'export const api = { layer: 2, fragment: 3 }\n')
  let errors = await linter.lint([at('src/unpoly/beta.js')])
  assert.equal(errors.length, 1)
  assert.match(errors[0], /^src\/unpoly\.ts\n.*up\.fragment is contributed by both alpha and beta/)
})
