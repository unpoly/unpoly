import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SRC } from '../../docs/doc_file.mjs'
import { checkDocFile, checkDocFiles, formatProblems } from '../../lint/doc_files.mjs'

const A = '# up.a()\n\n@function up.a\n@stable'
const B = '# [up-b]\n\n@selector [up-b]\n@stable'

function docFile(...entries) {
  return entries.join('\n\n-----\n\n') + '\n'
}

function lines(text) {
  return checkDocFile(text).map(({ line }) => line)
}

// ---- passing files -----------------------------------------------------------

test('accepts a real doc file', () => {
  assert.deepEqual(checkDocFile(readFileSync(path.join(SRC, 'unpoly/network/request.md'), 'utf8')), [])
})

test('accepts a blank file', () => {
  assert.deepEqual(checkDocFile(''), [])
  assert.deepEqual(checkDocFile('\n\n'), [])
})

test('accepts any H1, which only the site checks against the directives', () => {
  assert.deepEqual(checkDocFile(docFile('# up.b()\n\n@selector [up-b]\n@stable', '# up.a()\n\nJust prose.')), [])
})

test('accepts dashes, H1s and fences that belong to an entry', () => {
  assert.deepEqual(checkDocFile(docFile(
    // A shorter rule, a setext heading and an indented line of dashes.
    '# up.a()\n\nText.\n\n---\n\nHeading\n-----\n\n  -----\n\n@function up.a\n@stable',
    // An H1 and a separator in a code block, and a fence in a list item.
    '# up.b()\n\n```sh\n# comment\n\n-----\n\n```\n\n1. ```js\n   up.b()\n   ```\n\n@function up.b\n@stable',
  )), [])
})

// ---- failures ----------------------------------------------------------------

test('reports an entry without an H1', () => {
  let problems = checkDocFile(docFile(A, '@selector [up-b]\n@stable'))
  assert.deepEqual(problems, [{ line: 8, message: "An entry must start with an H1 like '# up.render()'." }])
})

test('reports a second H1 in an entry, from a missing separator', () => {
  let problems = checkDocFile(A + '\n\n' + B + '\n')
  assert.deepEqual(problems, [{ line: 6, message: 'A second H1 in one entry. Is a ----- separator missing above it?' }])
})

test('reports an empty entry', () => {
  let problems = checkDocFile(A + '\n\n-----\n\n-----\n\n' + B + '\n')
  assert.deepEqual(problems, [{ line: 8, message: 'An empty entry between two separators.' }])
})

test('reports an unclosed code fence', () => {
  let problems = checkDocFile(docFile('# up.a()\n\n```js\nup.a()\n\n@function up.a\n@stable', B))
  assert.deepEqual(problems, [{ line: 3, message: 'Unclosed code fence. It swallows the rest of the file, separators and entries included.' }])
})

test('reports a separator that is not padded by blank lines', () => {
  let message = 'A separator needs a blank line above and below.'
  assert.deepEqual(checkDocFile(A + '\n-----\n\n' + B + '\n'), [{ line: 5, message }])
  assert.deepEqual(checkDocFile(A + '\n\n-----\n' + B + '\n'), [{ line: 6, message }])
  assert.deepEqual(checkDocFile(A + '\n-----\n' + B + '\n'), [{ line: 5, message }])
})

test('reports a separator before the first entry or after the last', () => {
  assert.deepEqual(checkDocFile('-----\n\n' + A + '\n'), [{ line: 1, message: 'A separator before the first entry.' }])
  assert.deepEqual(checkDocFile('\n-----\n\n' + A + '\n'), [{ line: 2, message: 'A separator before the first entry.' }])
  assert.deepEqual(checkDocFile(A + '\n\n-----\n'), [{ line: 6, message: 'A separator after the last entry.' }])
  assert.deepEqual(checkDocFile(A + '\n\n-----\n\n\n'), [{ line: 6, message: 'A separator after the last entry.' }])
})

test('reports every problem, in the order of the lines', () => {
  assert.deepEqual(lines(docFile(A + '\n\n' + B, 'Prose.', '# up.c()\n\n```js\nup.c()')), [6, 13, 19])
})

// ---- files -------------------------------------------------------------------

test('checks the doc files below a directory, except guide pages', (t) => {
  let root = mkdtempSync(path.join(tmpdir(), 'doc-files-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  let write = (file, content) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    writeFileSync(path.join(root, file), content)
  }
  write('unpoly/good.md', docFile(A, B))
  write('unpoly/nested/bad.md', docFile(A, 'Prose.'))
  write('unpoly/pages/guide.md', 'Prose.\n')
  write('unpoly/bad.ts', 'Prose.\n')

  let problems = checkDocFiles(root)
  assert.deepEqual(problems.map(({ file, line, column }) => [path.relative(root, file), line, column]), [['unpoly/nested/bad.md', 8, 1]])
  assert.match(formatProblems(problems), /^.*unpoly\/nested\/bad\.md:8:1: error unpoly\(doc-files\): An entry must start with an H1/)
})
