import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extract, parseDocFile, title } from '../../docs/extract_docs.mjs'

function comment(body, indent = '') {
  return [`${indent}/*-`, ...body.split('\n').map((line) => line ? indent + line : line), `${indent}*/`].join('\n')
}

// ---- H1 per entry kind -----------------------------------------------------

const TITLES = {
  'a function': ['@function up.render\n@stable', 'up.render()'],
  'an instance method, as written': ['@function up.Request#abort\n@stable', 'up.Request#abort()'],
  'a constructor': ['Constructs a request.\n\n@constructor up.Request\n@stable', 'new up.Request()'],
  'a cookie': ['@cookie _up_method\n@stable', '_up_method'],
  'a selector': ['@selector [up-target]\n@stable', '[up-target]'],
  'an event': ['@event up:fragment:loaded\n@stable', 'up:fragment:loaded'],
  'a property': ['@property up.fragment.config\n@stable', 'up.fragment.config'],
  'a header': ['@header X-Up-Target\n@stable', 'X-Up-Target'],
  'a class': ['@class up.Request\n@parent up.network', 'up.Request'],
  'a namespace': ['@module up.fragment\n@namespace up.fragment', 'up.fragment'],
  'a page by its name': ['@page install\n\nSome text.', 'install'],
  'a page by its setext title': ['@page install\n\nInstalling Unpoly\n=================\n\nSome text.', 'Installing Unpoly'],
  'a partial': ['@partial up.render/targeting\n\nSome text.', 'up.render/targeting'],
  'a name with trailing spaces': ['@function up.render   \n@stable', 'up.render()'],
}

for (let [kind, [body, expected]] of Object.entries(TITLES)) {
  test(`titles ${kind}`, () => {
    assert.equal(title(body), expected)
    assert.equal(extract(comment(body) + '\n').markdown.split('\n')[0], `# ${expected}`)
  })
}

test('titles a comment by its first directive, like the site does', () => {
  // An interface wins over a feature, wherever it stands.
  assert.equal(title('@function up.foo\n@class up.Foo'), 'up.Foo')
  // A feature wins over a partial.
  assert.equal(title('@partial foo/bar\n@event up:foo'), 'up:foo')
})

test('puts a placeholder H1 on a comment it cannot title, and says so', () => {
  let { markdown, notes } = extract(comment('Just prose.\n@stable') + '\n', 'foo.ts')
  assert.equal(markdown, '# (untitled)\n\nJust prose.\n@stable\n')
  assert.deepEqual(notes, ['foo.ts:1: no @class, @namespace, @page, feature or @partial directive, H1 is a placeholder'])
})

test('notes an H1 that the site would read differently', () => {
  let { notes } = extract(comment('@selector foo #') + '\n', 'foo.ts')
  assert.match(notes[0], /the site would read the H1 '# foo #' as 'foo'/)
})

// ---- the doc file ----------------------------------------------------------

test('separates entries by a line of five dashes, only between entries', () => {
  let source = [comment('@function up.a\n@stable'), 'export function a() {}', '', comment('@function up.b\n@stable'), 'export function b() {}', ''].join('\n')
  assert.equal(extract(source).markdown, '# up.a()\n\n@function up.a\n@stable\n\n-----\n\n# up.b()\n\n@function up.b\n@stable\n')
})

test('writes nothing for a file without doc comments', () => {
  let source = '// A comment.\nexport const a = 1\n'
  assert.deepEqual(extract(source), { code: source, markdown: '', entries: [], notes: [] })
})

test('removes the comments from the code without leaving double blank lines', () => {
  let source = [
    comment('@namespace up.foo'),
    '',
    'import x from "x"',
    '',
    comment('@function up.foo.a\n@stable'),
    'export function a() {}',
    '',
    comment('@event up:foo\n@stable'),
    '',
    'export function b() {}',
    '',
  ].join('\n')
  assert.equal(extract(source).code, 'import x from "x"\n\nexport function a() {}\n\nexport function b() {}\n')
})

test('dedents a comment by the indentation of its /*- line', () => {
  let source = ['class Foo {', comment('@constructor up.Foo\n@param bar\n  Indented further.\n@stable', '  '), '  constructor() {}', '}', ''].join('\n')
  let { markdown, code, notes } = extract(source)
  assert.equal(markdown, '# new up.Foo()\n\n@constructor up.Foo\n@param bar\n  Indented further.\n@stable\n')
  assert.equal(code, 'class Foo {\n  constructor() {}\n}\n')
  assert.deepEqual(notes, [])
})

test('leaves a /*- that is not on a line of its own, and says so', () => {
  let source = '// /*-\n// @function up.old\n// */\n'
  let { code, entries, notes } = extract(source, 'foo.ts')
  assert.equal(code, source)
  assert.equal(entries.length, 0)
  assert.deepEqual(notes, ['foo.ts:1: /*- not on a line of its own, left in place'])
})

test('notes prose that the site would read as a separator or a second H1', () => {
  let { notes } = extract(comment('@function up.a\n\nAbove.\n\n-----\n\n# Heading\n\n```\n-----\n\n# not a heading\n```') + '\n', 'foo.ts')
  assert.deepEqual(notes, [
    'foo.ts:1: line 5 is a line of dashes, which would split the entry',
    'foo.ts:1: line 7 is an H1, which would start a second entry',
  ])
})

test('notes an unclosed code fence', () => {
  let { notes } = extract(comment('@function up.a\n\n```js\nup.a()') + '\n', 'foo.ts')
  assert.deepEqual(notes, ['foo.ts:1: has an unclosed code fence, which would swallow the entries after it'])
})

// ---- round trip ------------------------------------------------------------

test('reassembling the doc file gives back each comment body', () => {
  let bodies = [
    '@namespace up.foo\n\nThe namespace.',
    'Renders things.\n\n```js\n-----\n\n# a shell comment\n```\n\n@function up.foo.render\n@param {Object} [options]\n  The options.\n\n  More about them.\n@stable',
    'A line with trailing spaces.  \n\n@selector [up-foo]\n@stable',
    '@constructor up.Foo\n@stable',
  ]
  let source = [
    comment(bodies[0]),
    '',
    comment(bodies[1]),
    'export function render() {}',
    '',
    comment(bodies[2]),
    '',
    'class Foo {',
    comment(bodies[3], '  '),
    '  constructor() {}',
    '}',
    '',
  ].join('\n')

  let { markdown, notes } = extract(source)
  assert.deepEqual(notes, [])
  assert.deepEqual(parseDocFile(markdown), [
    { title: 'up.foo', body: bodies[0] },
    { title: 'up.foo.render()', body: bodies[1] },
    { title: '[up-foo]', body: bodies[2] },
    { title: 'new up.Foo()', body: bodies[3] },
  ])
})

test('drops only the blank lines that open or close a comment body', () => {
  let { markdown } = extract(comment('\n\n@function up.a\n\n\n@stable\n\n') + '\n')
  assert.deepEqual(parseDocFile(markdown), [{ title: 'up.a()', body: '@function up.a\n\n\n@stable' }])
})
