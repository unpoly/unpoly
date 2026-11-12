import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PROJECT_ROOT } from '../../build/build_status.mjs'

// The rules that run in JavaScript come as plugins, which are alpha in Oxlint, and @stylistic's
// version range allows upgrades. A plugin that fails to load makes Oxlint fail loudly, but a rule
// that stops reporting after an upgrade would go unnoticed. So we break each of these rules on
// purpose and lint that with the real `.oxlintrc.json`.

const OXLINT_BIN = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'oxlint')
const CONFIG = path.join(PROJECT_ROOT, '.oxlintrc.json')

// Code that breaks the rule, in a module of each file type that the rule checks. A pair is the
// code for JavaScript and for TypeScript, where a function needs a return type to pass lint.
const STYLE = {
  '@stylistic/semi': 'export let semi = 1;\n',
  '@stylistic/arrow-parens': ['export let arrowParens = x => x\n', 'export let arrowParens: (x: number) => number = x => x\n'],
  '@stylistic/object-curly-spacing': 'export let objectCurlySpacing = {a: 1}\n',
  '@stylistic/space-before-function-paren': ['export function spaceBeforeFunctionParen () {}\n', 'export function spaceBeforeFunctionParen (): void {}\n'],
}
const BROKEN = {
  ...Object.fromEntries(Object.entries(STYLE).map(([rule, code]) => {
    let [js, ts = js] = [code].flat()
    return [rule, { 'module.js': js, 'module.ts': ts }]
  })),
  'unpoly/declare-class-fields': { 'module.ts': 'export class Box {\n  left: number\n}\n' },
  'unpoly/namespace-aliases': {
    'module.js': "import * as u from './util.js'\nexport default u\n",
    'module.ts': "import * as u from './util.js'\nexport default u\n",
  },
  // No import or export, so Oxlint parses it as a script.
  'unpoly/no-octal': { 'script.js': "window.octal = 010 + '\\07'\n" },
}

test('the canary below covers every rule of .oxlintrc.json that runs in JavaScript', () => {
  let rules = readFileSync(CONFIG, 'utf8').match(/(?<=")(@stylistic|unpoly)\/[a-z-]+(?=")/g)
  assert.deepEqual([...new Set(rules)].sort(), Object.keys(BROKEN).sort())
})

// One Oxlint run for all rules, since loading the plugins takes most of the time. Each rule gets
// a directory of its own. Resolves with the codes of the errors, by rule and file.
function lintBroken() {
  let root = mkdtempSync(path.join(tmpdir(), 'oxlint-canary-'))
  try {
    let rules = Object.keys(BROKEN)
    let targets = []
    for (let [index, files] of Object.values(BROKEN).entries()) {
      mkdirSync(path.join(root, String(index)))
      for (let [file, content] of Object.entries(files)) {
        writeFileSync(path.join(root, String(index), file), content)
        targets.push(path.join(String(index), file))
      }
    }
    let { stdout, stderr } = spawnSync(OXLINT_BIN, ['-c', CONFIG, '-f', 'json', ...targets], { cwd: root, encoding: 'utf8' })
    let report
    try {
      report = JSON.parse(stdout)
    } catch {
      throw new Error(`Oxlint failed: ${stderr || stdout}`)
    }
    let errors = Object.fromEntries(rules.map((rule) => [rule, {}]))
    for (let { filename, severity, code } of report.diagnostics) {
      if (severity !== 'error') continue
      let [index, file] = filename.split(path.sep)
      ;(errors[rules[index]][file] ??= new Set()).add(code)
    }
    return errors
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

let errors
before(() => errors = lintBroken())

for (let [rule, files] of Object.entries(BROKEN)) {
  test(`.oxlintrc.json reports ${rule}`, () => {
    // Oxlint writes `@stylistic/semi` as `@stylistic(semi)`.
    let code = rule.replace(/\/(.*)/, '($1)')
    assert.deepEqual(errors[rule], Object.fromEntries(Object.keys(files).map((file) => [file, new Set([code])])))
  })
}
