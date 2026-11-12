import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PROJECT_ROOT } from '../../build/build_status.mjs'

const OXLINT_BIN = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'oxlint')
const PLUGIN = path.join(PROJECT_ROOT, 'tooling', 'lint', 'unpoly_plugin.mjs')

// Lints `files` with nothing but `rule` from our plugin, and returns the reported lines per file,
// in ascending order.
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
  for (let fileLines of Object.values(lines)) fileLines.sort((a, b) => a - b)
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

test('no-octal reports a legacy octal escape in a string, also in a file that Oxlint parses as a script', (t) => {
  let lines = lint(t, 'no-octal', {
    'script.js': [
      String.raw`let a = '\07'`,
      String.raw`let b = "x\1"`,
      String.raw`let c = '\08'`,
      String.raw`let d = '\\\7'`,
      // The null character, an escaped backslash, and other escapes are fine.
      String.raw`let e = '\0' + '\\07' + '\x07\u0007\n' + '07'`,
      '',
    ].join('\n'),
  })
  assert.deepEqual(lines, { 'script.js': [1, 2, 3, 4] })
})

test('namespace-aliases allows a namespace import as the object of a member access, for values and types', (t) => {
  let lines = lint(t, 'namespace-aliases', {
    'module.ts': [
      "import * as u from './util.js'",
      "import type * as t from './types.js'",
      'u.map([], u.identity)',
      'let apis = [u.api, u.install?.()]',
      'let list: u.List<t.Deep.Inner> = []',
      'let map: typeof u.map = u.map',
      'export let config: t.Config = u.newConfig()',
      '',
    ].join('\n'),
  })
  assert.deepEqual(lines, { 'module.ts': [] })
})

test('namespace-aliases reports any other use of a namespace import', (t) => {
  let lines = lint(t, 'namespace-aliases', {
    'module.ts': [
      "import * as u from './util.js'",
      "import * as e from './element.js'",
      'console.log(u)',
      'let copy = { ...u }',
      "let map = u['map']",
      'let module: typeof u = u.self',
      'let shorthand = { e }',
      'export { e }',
      'export default u',
      '',
    ].join('\n'),
  })
  assert.deepEqual(lines, { 'module.ts': [3, 4, 5, 6, 7, 8, 9] })
})

test('namespace-aliases reports a local binding that shadows a namespace import', (t) => {
  let lines = lint(t, 'namespace-aliases', {
    'module.ts': [
      "import * as u from './util.js'",
      "import * as e from './element.js'",
      "import type * as t from './types.js'",
      'try { u.noop() } catch (e) { u.noop() }',
      'export function parse(u: string): string { return u }',
      'export function wrap<t>(value: t): t[] { return [value] }',
      'export function nested(): void {',
      '  let e = 1',
      '  function u(): void {}',
      '  class t {}',
      '  console.log(e, u, t)',
      '}',
      '',
    ].join('\n'),
    // Without the import, `e` is just a name.
    'other.ts': 'try { console.log(1) } catch (e) { console.log(e) }\n',
  })
  assert.deepEqual(lines, { 'module.ts': [4, 5, 6, 8, 9, 10], 'other.ts': [] })
})
