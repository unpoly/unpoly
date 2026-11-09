import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ApiCollisionCheck, formatProblems } from '../../lint/api_collisions.mjs'

const ENTRY = `import * as alpha from './unpoly/alpha.js'
import * as beta from './unpoly/beta.js'

const apis = [
  alpha.api,
  beta.api,
]
`

function project(t, files) {
  let root = mkdtempSync(path.join(tmpdir(), 'api-collisions-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  let at = (file) => path.join(root, file)
  let write = (file, content) => {
    mkdirSync(path.dirname(at(file)), { recursive: true })
    writeFileSync(at(file), content)
  }
  for (let [file, content] of Object.entries({ 'src/unpoly.ts': ENTRY, ...files })) write(file, content)
  return { at, write, check: new ApiCollisionCheck(at('src/unpoly.ts')) }
}

test('reports a key that two modules contribute, at the later api', (t) => {
  // alpha is TypeScript, imported by its .js name, and casts its api.
  let { check } = project(t, {
    'src/unpoly/alpha.ts': 'export const api = { fragment: 1 as number, render() {} } as Record<string, any>\n',
    'src/unpoly/beta.js': 'export const api = { fragment: 2, get context() { return 1 }, set context(_value) {} }\n',
  })
  let problems = check.check()
  assert.equal(problems.length, 1)
  assert.match(problems[0].message, /up\.fragment is contributed by both alpha and beta/)
  assert.equal(problems[0].line, 6)
  assert.match(formatProblems(problems), /src\/unpoly\.ts:6:3: error unpoly\(api-collisions\)/)
})

test('accepts modules with distinct keys', (t) => {
  let { check } = project(t, {
    'src/unpoly/alpha.js': 'export const api = { fragment: 1 }\n',
    'src/unpoly/beta.js': 'export const api = { layer: 2 }\n',
  })
  assert.deepEqual(check.check(), [])
})

test('reads a module again when it changed', (t) => {
  let { at, write, check } = project(t, {
    'src/unpoly/alpha.js': 'export const api = { fragment: 1 }\n',
    'src/unpoly/beta.js': 'export const api = { layer: 2 }\n',
  })
  assert.deepEqual(check.check(), [])
  write('src/unpoly/beta.js', 'export const api = { layer: 2, fragment: 3 }\n')
  // The cache goes by mtime, which may not have moved within the same millisecond.
  let later = new Date(Date.now() + 5000)
  utimesSync(at('src/unpoly/beta.js'), later, later)
  assert.equal(check.check().length, 1)
})

test('reports an api whose keys it cannot read', (t) => {
  let { check } = project(t, {
    'src/unpoly/alpha.js': 'const more = {}\nexport const api = { ...more }\n',
    'src/unpoly/beta.js': 'export const api = { layer: 2 }\n',
  })
  let problems = check.check()
  assert.equal(problems.length, 1)
  assert.match(problems[0].message, /Cannot read the keys of this api/)
})

test('accepts up.internal with shorthand keys of imports that keep their names', (t) => {
  let { check } = project(t, {
    'src/unpoly/alpha.js': 'export function sprintf() {}\nexport const api = { util: {} }\n',
    'src/unpoly/beta.ts': "import { sprintf } from './alpha.js'\nexport const api = { internal: { sprintf } }\n",
  })
  assert.deepEqual(check.check(), [])
})

test('reports an up.internal key that is not its export name', (t) => {
  for (let beta of [
    "import { sprintf } from './alpha.js'\nexport const api = { internal: { format: sprintf } }\n",
    "import { sprintf as format } from './alpha.js'\nexport const api = { internal: { format } }\n",
  ]) {
    let { check } = project(t, {
      'src/unpoly/alpha.js': 'export function sprintf() {}\nexport const api = { util: {} }\n',
      'src/unpoly/beta.ts': beta,
    })
    let problems = check.check()
    assert.equal(problems.length, 1)
    assert.match(problems[0].message, /Publish up\.internal keys under their export names/)
  }
})
