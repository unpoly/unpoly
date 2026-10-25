import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { outline } from '../outline.mjs'
import { START, END, guideFiles, readGuide } from '../toc.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FIXTURES = path.join(projectRoot, 'tooling/test/fixtures/outline')
const BIN = path.join(projectRoot, 'bin/outline')

function run(args, cwd = FIXTURES) {
  return spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' })
}

// ---- the shared fixtures ---------------------------------------------------
// The Python twin in unpoly-site runs the same cases, so the arguments are derived from the
// file name exactly as tooling/test/fixtures/outline/README.md describes.

for (let name of readdirSync(FIXTURES).filter((file) => file.endsWith('.txt')).sort()) {
  let [, files, depth] = /^(.+?)(?:\.depth-(\d+))?\.txt$/.exec(name)
  let args = [...(depth ? [`--depth=${depth}`] : []), ...files.split('+').map((file) => `${file}.md`)]

  test(`fixture ${name}: outline ${args.join(' ')}`, () => {
    let result = run(args)
    assert.equal(result.stderr, '')
    assert.equal(result.status, 0)
    assert.equal(result.stdout, readFileSync(path.join(FIXTURES, name), 'utf8'))
  })
}

test('refuses a directory', () => {
  let result = run(['.'])
  assert.equal(result.status, 64)
  assert.match(result.stderr, /is a directory/)
  assert.equal(result.stdout, '')
})

test('refuses a call without files', () => {
  let result = run(['--depth=2'])
  assert.equal(result.status, 64)
  assert.match(result.stderr, /^Usage:/)
})

// ---- the real guides -------------------------------------------------------
// The TOC of a contributing guide is generated from its headings (see toc.mjs), so the outline
// must list every entry of it. This catches a heading the outline misreads in real text.

test('the outline of every contributing guide lists each entry of its TOC', () => {
  let checked = 0
  for (let file of guideFiles()) {
    let markdown = readGuide(file)
    if (!markdown.includes(START)) continue
    let toc = markdown.slice(markdown.indexOf(START) + START.length, markdown.indexOf(END))
    let entries = [...toc.matchAll(/^( *)- \[(.+)\]\(#[^)]*\)$/gm)]
      .map(([, indent, label]) => `${'#'.repeat(indent.length / 2 + 2)} ${label}`)
    let labels = outline(markdown).sections
      .map(({ label }) => label.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'))

    assert.ok(entries.length, `${file} has an empty TOC`)
    for (let entry of entries) assert.ok(labels.includes(entry), `${path.basename(file)}: no "${entry}" in the outline`)
    checked++
  }
  assert.ok(checked >= 3, `only ${checked} guides with a TOC`)
})
