import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SourceLinter } from '../../build/lint.mjs'

// A project of its own, with a one-rule ESLint config, so the test doesn't depend on src/.
function project(t, files) {
  let root = mkdtempSync(path.join(tmpdir(), 'source-linter-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(path.join(root, 'eslint.config.mjs'), `export default [{ rules: { semi: ['error', 'never'] } }]\n`)
  for (let [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    writeFileSync(path.join(root, file), content)
  }
  return { root, at: (file) => path.join(root, file) }
}

test('the first call lints all of src/', async (t) => {
  // The bug this guards against: ESLint reports a directory as ignored, so the watcher's first
  // lint skipped src/ and an error that was there before it started never showed up.
  let { root } = project(t, { 'src/unpoly.ts': 'let a = 1\n', 'src/unpoly/bad.js': 'let b = 1;\n' })
  let errors = await new SourceLinter({ root }).lint([null])
  assert.equal(errors.length, 1)
  assert.match(errors[0], /src\/unpoly\/bad\.js[\s\S]*Extra semicolon/)
})

test('later calls lint the changed files, and errors stand until their file is fixed', async (t) => {
  let { root, at } = project(t, { 'src/unpoly.ts': 'let a = 1\n', 'src/unpoly/bad.js': 'let b = 1\n' })
  let linter = new SourceLinter({ root })
  assert.deepEqual(await linter.lint([null]), [])

  writeFileSync(at('src/unpoly/bad.js'), 'let b = 1;\n')
  assert.match((await linter.lint([at('src/unpoly/bad.js')]))[0], /bad\.js/)
  assert.match((await linter.lint([at('src/unpoly.ts')]))[0], /bad\.js/, 'an unrelated change keeps the error')

  writeFileSync(at('src/unpoly/bad.js'), 'let b = 1\n')
  assert.deepEqual(await linter.lint([at('src/unpoly/bad.js')]), [])
})
