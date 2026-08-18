import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findSpecs, formatMatches } from '../find_spec.mjs'

function source(text, file = 'form_spec.js') {
  return [{ file, text }]
}

test('builds the full group path down to the matching spec', () => {
  let matches = findSpecs(source(`
describe('up.form', function() {
  describe('unobtrusive behavior', function() {
    describe('[up-switch]', function() {
      it('switches a target', function() {})
    })
  })
})
`), 'switches')

  assert.equal(matches.length, 1)
  assert.deepEqual(matches[0].titles, ['up.form', 'unobtrusive behavior', '[up-switch]', 'switches a target'])
  assert.equal(matches[0].line, 5)
})

test('extendDescribe counts as a group, so extracted files report their whole path', () => {
  let matches = findSpecs(source(`
extendDescribe('up.fragment', function() {
  extendDescribe('JavaScript functions', function() {
    extendDescribe('up.render()', function() {
      describe('with { url } option', function() {
        it('fetches the URL', function() {})
      })
    })
  })
})
`, 'fragment_render_url_spec.js'), 'fetches')

  assert.deepEqual(matches[0].titles,
    ['up.fragment', 'JavaScript functions', 'up.render()', 'with { url } option', 'fetches the URL'])
})

test('matches titles only, never spec code', () => {
  let matches = findSpecs(source(`
describe('up.form', function() {
  it('submits', function() {
    up.render({ url: '/path' })
  })
})
`), 'up.render')

  assert.deepEqual(matches, [])
})

test('a group whose own title matches is reported, and its path ends at itself', () => {
  let matches = findSpecs(source(`
describe('up.form', function() {
  describe('up.submit()', function() {
    it('does something', function() {})
  })
})
`), 'up.submit')

  assert.equal(matches.length, 1)
  assert.equal(matches[0].isGroup, true)
  assert.deepEqual(matches[0].titles, ['up.form', 'up.submit()'])
})

test('a spec never becomes an ancestor of the specs after it', () => {
  let matches = findSpecs(source(`
describe('up.form', function() {
  it('first', function() {})
  it('second', function() {})
})
`), 'second')

  assert.deepEqual(matches[0].titles, ['up.form', 'second'])
})

test('sibling groups do not nest', () => {
  let matches = findSpecs(source(`
describe('up.form', function() {
  describe('one', function() {
    it('a', function() {})
  })
  describe('two', function() {
    it('b', function() {})
  })
})
`), 'b')

  assert.deepEqual(matches[0].titles, ['up.form', 'two', 'b'])
})

test('matching is case-insensitive and finds f/x variants', () => {
  let matches = findSpecs(source(`
describe('up.form', function() {
  fit('Submits The Form', function() {})
  xdescribe('Pending Group', function() {})
})
`), 'submits the form')

  assert.equal(matches.length, 1)
  assert.equal(matches[0].isGroup, false)
})

test('formats one line per match as a quoted full name, ready for --spec', () => {
  let matches = findSpecs(source(`
describe('up.form', function() {
  describe('[up-submit]', function() {
    it('submits the form', function() {})
  })
})
`), 'submits')

  // Space-joined and quoted, because that string *is* what --spec matches.
  assert.deepEqual(formatMatches(matches, { phrase: 'submits' }),
    ['form_spec.js:4 "up.form [up-submit] submits the form"'])
})

test('color highlights the phrase and leaves plain output untouched', () => {
  let matches = findSpecs(source(`
describe('up.form', function() {
  it('submits the form', function() {})
})
`), 'submits')

  let colored = formatMatches(matches, { phrase: 'submits', color: true })[0]
  assert.match(colored, /\x1b\[1;33msubmits\x1b\[0m the form/)
  assert.doesNotMatch(formatMatches(matches, { phrase: 'submits' })[0], /\x1b/)
})

test('locations are padded so every describe path starts in the same column', () => {
  // Alignment is what makes a long result list scannable. It needs the whole match set
  // up front, which is why formatMatches() takes the array rather than a single match.
  const matches = [
    { file: 'spec/unpoly/form_spec.js', line: 7, titles: ['up.form', 'submits'] },
    { file: 'spec/unpoly/fragment_render_history_spec.js', line: 1234, titles: ['up.fragment', 'submits'] },
  ]

  const lines = formatMatches(matches, { phrase: 'submits' })
  const columns = lines.map((line) => line.indexOf('"'))

  assert.equal(columns[0], columns[1], `paths start in different columns: ${columns}`)
  assert.match(lines[0], /form_spec\.js:7 {2,}"/, 'the shorter location is padded')
})

test('padding is measured without the colour codes', () => {
  const matches = [
    { file: 'a.js', line: 1, titles: ['x', 'submits'] },
    { file: 'bbbbbbbb.js', line: 22, titles: ['x', 'submits'] },
  ]

  const plain = formatMatches(matches, { phrase: 'submits' })
  const colored = formatMatches(matches, { phrase: 'submits', color: true })
  const strip = (s) => s.replaceAll(/\x1b\[[0-9;]*m/g, '')

  assert.deepEqual(colored.map(strip), plain, 'colour must not change the layout')
})
