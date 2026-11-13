import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parseError, runTypecheck, watchTypeErrors } from '../../build/typecheck.mjs'
import { formatFile } from '../../build/lint.mjs'

test('an error from tsc keeps its location, code and the lines that elaborate it', () => {
  let lines = [
    "src/unpoly/link.ts(635,14): error TS2322: Type '{ a: string; }' is not assignable to type 'Options'.",
    "  Types of property 'a' are incompatible.",
    "    Type 'string' is not assignable to type 'number'.",
  ]
  let error = parseError(lines)
  assert.deepEqual(error, {
    file: 'src/unpoly/link.ts',
    line: 635,
    column: 14,
    severity: 'error',
    message: "Type '{ a: string; }' is not assignable to type 'Options'.\n  Types of property 'a' are incompatible.\n    Type 'string' is not assignable to type 'number'.",
    code: 'TS2322',
  })
  // Formatted like a lint error, with the elaboration indented to the message.
  assert.equal(formatFile(error.file, [error]), [
    'src/unpoly/link.ts',
    "  635:14   error  Type '{ a: string; }' is not assignable to type 'Options'.  TS2322",
    "                  Types of property 'a' are incompatible.",
    "                    Type 'string' is not assignable to type 'number'.",
  ].join('\n'))
})

test('an error without a location is filed under tsc', () => {
  assert.deepEqual(parseError(["error TS2318: Cannot find global type 'Array'."]), {
    file: 'tsc', line: undefined, column: undefined, severity: 'error', message: "Cannot find global type 'Array'.", code: 'TS2318',
  })
})

// A project of its own, so the test doesn't depend on src/. Its core check is stricter, like ours.
function project(t, files) {
  let root = mkdtempSync(path.join(tmpdir(), 'typecheck-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  let write = (file, content) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    writeFileSync(path.join(root, file), content)
  }
  write('tsconfig.json', JSON.stringify({
    compilerOptions: { noEmit: true, strict: false, target: 'es2024', lib: ['es2024', 'dom'], module: 'preserve', moduleDetection: 'force', types: [], skipLibCheck: true },
    include: ['src/**/*.ts'],
  }))
  write('tsconfig.core.json', JSON.stringify({
    extends: './tsconfig.json',
    compilerOptions: { noImplicitAny: true },
    include: ['src/unpoly.ts', 'src/unpoly/**/*.ts'],
  }))
  // What the probe files import.
  write('src/unpoly.ts', 'export interface Up { a: { b(): void } }\n')
  write('src/unpoly/event.ts', "export interface UpEventMap { 'up:a': Event }\n")
  for (let [file, content] of Object.entries(files)) write(file, content)
  return root
}

test('the watcher gets the errors of all three checks, each once, one block per file', async (t) => {
  let root = project(t, {
    // Both checks find the first error, only the core check the second one.
    'src/unpoly/a.ts': "export const n: number = 'x'\nexport function f(x) { return x }\n",
    'src/unpoly/a.md': '# up.a.c\n\nDoes nothing.\n\n@function up.a.c\n',
  })

  let { errors, count } = await watchTypeErrors({ root })

  assert.equal(count, 3)
  assert.deepEqual(errors, [
    [
      'src/unpoly/a.ts',
      "  1:14     error  Type 'string' is not assignable to type 'number'.  TS2322",
      "  2:19     error  Parameter 'x' implicitly has an 'any' type.  TS7006",
    ].join('\n'),
    [
      'src/unpoly/a.md',
      "  5:11     error  Documented as up.a.c, but `Up['a']` has no `c`.  TS2339",
    ].join('\n'),
  ])
})

test('a clean project has no type errors', async (t) => {
  let root = project(t, { 'src/unpoly/a.md': '# up.a.b\n\nDoes nothing.\n\n@function up.a.b\n' })
  assert.deepEqual(await watchTypeErrors({ root }), { errors: [], count: 0 })
})

test('an aborted check resolves with null', async (t) => {
  let root = project(t, {})
  let controller = new AbortController()
  let check = watchTypeErrors({ root, signal: controller.signal })
  controller.abort()
  assert.equal(await check, null)
})

test('bin/typecheck says so when tsc cannot start, and fails', async (t) => {
  // It used to exit 1 without a word.
  let root = project(t, {})
  let output = []
  let code = await runTypecheck({ root, bin: path.join(root, 'no-tsc'), log: (text) => output.push(text) })
  assert.equal(code, 1)
  assert.deepEqual(output.map((text) => text.split('\n')[0]), ['tsconfig.json', 'tsconfig.core.json'])
  for (let text of output) assert.match(text, /error {2}tsc failed \(exit code 1\): spawn .*no-tsc ENOENT/)
})

test('bin/typecheck prints the core and probe errors, and fails', async (t) => {
  let root = project(t, {
    'src/unpoly/a.ts': 'export function f(x) { return x }\n',
    'src/unpoly/a.md': '# up.a.c\n\nDoes nothing.\n\n@function up.a.c\n',
  })
  let output = []
  let code = await runTypecheck({ root, log: (text) => output.push(text) })
  assert.equal(code, 1)
  assert.match(output.join('\n'), /^src\/unpoly\/a\.ts\(1,19\): error TS7006/m)
  assert.match(output.join('\n'), /^src\/unpoly\/a\.md\(5,11\): error TS2339: Documented as up\.a\.c/m)
})
