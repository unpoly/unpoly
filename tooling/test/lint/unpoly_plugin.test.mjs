import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PROJECT_ROOT } from '../../build/build_status.mjs'

const OXLINT_BIN = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'oxlint')
const PLUGIN = path.join(PROJECT_ROOT, 'tooling', 'lint', 'unpoly_plugin.mjs')

// Lints `files` with nothing but `rule` from our plugin, and returns the reported lines per file.
function lint(t, rule, files) {
  let root = mkdtempSync(path.join(tmpdir(), 'unpoly-plugin-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(path.join(root, '.oxlintrc.json'), JSON.stringify({
    jsPlugins: [PLUGIN],
    categories: { correctness: 'off' },
    rules: { [`unpoly/${rule}`]: 'error' },
  }))
  for (let [file, content] of Object.entries(files)) writeFileSync(path.join(root, file), content)
  let { stdout } = spawnSync(OXLINT_BIN, ['-f', 'json', ...Object.keys(files)], { cwd: root, encoding: 'utf8' })
  let lines = Object.fromEntries(Object.keys(files).map((file) => [file, []]))
  for (let diagnostic of JSON.parse(stdout).diagnostics) lines[diagnostic.filename].push(diagnostic.labels[0].span.line)
  return lines
}

test('declare-class-fields reports a TypeScript class field with neither declare nor initializer', (t) => {
  let lines = lint(t, 'declare-class-fields', {
    'box.ts': 'export class Box {\n  left: number\n  declare top: number\n  right = 0\n  static count: number\n}\n',
    // In JavaScript a field without initializer is deliberate.
    'box.js': 'export class Box {\n  left\n}\n',
  })
  assert.deepEqual(lines, { 'box.ts': [2, 5], 'box.js': [] })
})

test('no-octal reports a legacy octal literal, also in a file that Oxlint parses as a script', (t) => {
  let lines = lint(t, 'no-octal', {
    // No import or export: a script to Oxlint, where `010` is no syntax error.
    'script.js': 'let a = 010\nlet b = 08\nlet c = 0o10 + 0.5 + 0 + 10\n',
  })
  assert.deepEqual(lines, { 'script.js': [1, 2] })
})
