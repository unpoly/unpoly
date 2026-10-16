import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findSpecs, formatMatches, parseSuite, specFiltersFor, staleChains } from '../find_spec.mjs'

// A suite of one module file, loaded by spec/specs.js like the real ones. Further files
// are only reached through require().
function suite(text, others = {}, file = 'spec/unpoly/form_spec.js') {
  return parseSuite({
    'spec/specs.js': `require('./${file.replace('spec/', '')}')\n`,
    [file]: text,
    ...others,
  })
}

const titlesOf = (matches) => matches.map((match) => match.titles)

test('builds the full group path down to the matching spec', () => {
  let matches = findSpecs(suite(`
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
  assert.equal(matches[0].file, 'spec/unpoly/form_spec.js')
})

test('matches titles only, never spec code', () => {
  let matches = findSpecs(suite(`
describe('up.form', function() {
  it('submits', function() {
    up.render({ url: '/path' })
  })
})
`), 'up.render')

  assert.deepEqual(matches, [])
})

test('a group whose own title matches is reported, and its path ends at itself', () => {
  let matches = findSpecs(suite(`
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

test('sibling groups and specs do not nest', () => {
  let matches = findSpecs(suite(`
describe('up.form', function() {
  it('a', function() {})
  describe('one', function() {
    it('b', function() {})
  })
  describe('two', function() {
    it('c', function() {})
  })
})
`), 'c')

  assert.deepEqual(titlesOf(matches), [['up.form', 'two', 'c']])
})

test('matching is case-insensitive and finds f/x variants', () => {
  let matches = findSpecs(suite(`
describe('up.form', function() {
  fit('Submits The Form', function() {})
  xdescribe('Pending Group', function() {})
})
`), 'submits the form')

  assert.equal(matches.length, 1)
  assert.equal(matches[0].isGroup, false)
})

// --- Nesting that indentation can't see ------------------------------------------

test('a group inside an if block nests under the group around the if, not its sibling before it', () => {
  let matches = findSpecs(suite(`
describe('up.network', function() {
  describe('events', function() {
    it('emits', function() {})
  })

  if (up.migrate.loaded) {
    describe('up.ajax', function() {
      it('fulfills', function() {})
    })
  }
})
`), 'fulfills')

  assert.deepEqual(matches[0].titles, ['up.network', 'up.ajax', 'fulfills'])
  assert.equal(matches[0].condition, 'up.migrate.loaded')
})

test('nested conditions are joined, and an else branch is negated', () => {
  let matches = findSpecs(suite(`
describe('up.script', function() {
  if (a) {
    if (b) { it('both', function() {}) }
  } else {
    it('neither', function() {})
  }
})
`), 'th')

  assert.deepEqual(matches.map((match) => match.condition), ['a && b', '!(a)'])
})

test('groups created in a loop or a callback keep their template title', () => {
  let matches = findSpecs(suite(`
describe('up.form', function() {
  for (let name of ['a', 'b']) {
    describe(\`with \${name}\`, function() {
      u.each([1], (n) => it('works', function() {}))
    })
  }
})
`), 'works')

  assert.deepEqual(titlesOf(matches), [['up.form', 'with ${name}', 'works']])
})

test('a misindented closing brace does not change the nesting', () => {
  let matches = findSpecs(suite(`
describe('up.element', function() {
  describe('up.element.list()', function() {
    it('lists', function() {
})
})
  describe('up.element.matches()', function() {
    it('matches', function() {})
  })
})
`), 'matches')

  assert.deepEqual(matches[1].titles, ['up.element', 'up.element.matches()', 'matches'])
})

test('describeFallback() is a group named like the helper names it', () => {
  let matches = findSpecs(suite(`
describe('up.history', function() {
  describeFallback('canPushState', function() {
    it('reloads', function() {})
  })
})
`), 'reloads')

  assert.deepEqual(matches[0].titles, ['up.history', '(in a browser without canPushState)', 'reloads'])
})

test('a local function that declares specs is expanded at every call', () => {
  let matches = findSpecs(suite(`
describe('up.script', function() {
  function sharedExamples() {
    it('runs scripts', function() {})
  }

  describe('with { policy: "auto" }', function() {
    sharedExamples()
  })

  describe('with { policy: "block" }', function() {
    sharedExamples()
  })
})
`), 'runs scripts')

  assert.deepEqual(titlesOf(matches), [
    ['up.script', 'with { policy: "auto" }', 'runs scripts'],
    ['up.script', 'with { policy: "block" }', 'runs scripts'],
  ])
})

// --- Extracted files ---------------------------------------------------------------

const MODULE = `
describe('up.fragment', function() {
  describe('JavaScript functions', function() {
    describe('up.render()', function() {
      require('./fragment_render_url_spec')
    })
  })
})
`

const EXTRACTED = `
extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('with { url } option', function() {

        it('fetches the URL', function() {})

      })

      describe('with { method } option', function() {

        it('uses the method', function() {})

      })

    })

  })

})
`

const extracted = (text = EXTRACTED) =>
  suite(MODULE, { 'spec/unpoly/fragment_render_url_spec.js': text }, 'spec/unpoly/fragment_spec.js')

test('an extracted file gets the path of the position it is required from', () => {
  let matches = findSpecs(extracted(), 'fetches')

  assert.deepEqual(matches[0].titles,
    ['up.fragment', 'JavaScript functions', 'up.render()', 'with { url } option', 'fetches the URL'])
  assert.equal(matches[0].file, 'spec/unpoly/fragment_render_url_spec.js')
})

test('extendDescribe() titles are documentation and never match', () => {
  assert.deepEqual(findSpecs(extracted(), 'JavaScript functions').map((match) => match.kind), ['describe'])
})

test('a stale extendDescribe() chain is reported', () => {
  assert.deepEqual(staleChains(extracted()), [])

  let stale = staleChains(extracted(EXTRACTED.replace("'up.render()'", "'up.follow()'")))
  assert.deepEqual(stale.map((entry) => entry.title), ['with { url } option', 'with { method } option'])
})

test('an extracted file loaded at the root of the suite is reported as stale', () => {
  let stale = staleChains(suite(EXTRACTED, {}, 'spec/unpoly/fragment_render_url_spec.js'))
  assert.equal(stale.length, 2)
})

test('loaded files and requires of missing files are reported', () => {
  let parsed = suite(MODULE, {}, 'spec/unpoly/fragment_spec.js')
  assert.deepEqual([...parsed.loaded], ['spec/unpoly/fragment_spec.js'])
  assert.deepEqual(parsed.missing.map((each) => each.required), ['spec/unpoly/fragment_render_url_spec.js'])
})

// --- Formatting ----------------------------------------------------------------------

test('formats one line per match as a quoted full name, ready for --spec', () => {
  let matches = findSpecs(suite(`
describe('up.form', function() {
  describe('[up-submit]', function() {
    it('submits the form', function() {})
  })
})
`), 'submits')

  // Space-joined and quoted, because that string *is* what --spec matches.
  assert.deepEqual(formatMatches(matches, { phrase: 'submits' }),
    ['spec/unpoly/form_spec.js:4 "up.form [up-submit] submits the form"'])
})

test('a condition is printed after the quoted full name, so the name stays pasteable', () => {
  let matches = findSpecs(suite(`
describe('up.form', function() {
  if (up.migrate.loaded) {
    it('submits the form', function() {})
  }
})
`), 'submits')

  assert.deepEqual(formatMatches(matches, { phrase: 'submits' }),
    ['spec/unpoly/form_spec.js:4 "up.form submits the form"  (if up.migrate.loaded)'])
})

test('color highlights the phrase and leaves plain output untouched', () => {
  let matches = findSpecs(suite(`
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

// --- specFiltersFor: turning a file (or a line in it) into --spec filters ------

const PARAMS = suite(`
describe('up.Params', function() {

  describe('#toQuery', function() {

    it('returns the query section', function() {})

  })

})
`, {}, 'spec/unpoly/classes/params_spec.js')

const names = (filters) => filters?.map((filter) => filter.name) ?? null

test('a file resolves to its outermost group', () => {
  assert.deepEqual(names(specFiltersFor(PARAMS, 'spec/unpoly/classes/params_spec.js')), ['up.Params'])
})

test('a line resolves to the full name of the block declared there', () => {
  const file = 'spec/unpoly/classes/params_spec.js'
  assert.deepEqual(names(specFiltersFor(PARAMS, file, 4)), ['up.Params #toQuery'])
  assert.deepEqual(names(specFiltersFor(PARAMS, file, 6)), ['up.Params #toQuery returns the query section'])
})

test('a line with no block declared on it resolves to nothing', () => {
  // The caller turns this into an error naming the file and line, rather than silently
  // running something the reader did not point at.
  assert.equal(specFiltersFor(PARAMS, 'spec/unpoly/classes/params_spec.js', 5), null)
})

test('a file that declares nothing resolves to nothing', () => {
  assert.equal(specFiltersFor(suite('// just a comment\n'), 'spec/unpoly/form_spec.js'), null)
})

// An extracted file names a group that other files contribute to, so its own name would
// run the whole module. We target what this file declares instead.

const URL_FILE = 'spec/unpoly/fragment_render_url_spec.js'

test('a module file resolves to the module, which includes its extracted files', () => {
  assert.deepEqual(names(specFiltersFor(extracted(), 'spec/unpoly/fragment_spec.js')), ['up.fragment'])
})

test('an extracted file resolves to the blocks it declares, not to the module', () => {
  assert.deepEqual(names(specFiltersFor(extracted(), URL_FILE)), [
    'up.fragment JavaScript functions up.render() with { url } option',
    'up.fragment JavaScript functions up.render() with { method } option',
  ])
})

test('pointing at an extendDescribe() line resolves to the blocks the file declares', () => {
  assert.deepEqual(names(specFiltersFor(extracted(), URL_FILE, 4)), names(specFiltersFor(extracted(), URL_FILE)))
})

test('pointing at a real block inside an extracted file resolves to that block alone', () => {
  assert.deepEqual(names(specFiltersFor(extracted(), URL_FILE, 8)),
    ['up.fragment JavaScript functions up.render() with { url } option'])
})

test('a block expanded at several calls resolves to one filter per call', () => {
  let parsed = suite(`
describe('up.script', function() {
  function sharedExamples() {
    it('runs scripts', function() {})
  }
  describe('auto', function() { sharedExamples() })
  describe('block', function() { sharedExamples() })
})
`)
  assert.deepEqual(names(specFiltersFor(parsed, 'spec/unpoly/form_spec.js', 4)),
    ['up.script auto runs scripts', 'up.script block runs scripts'])
})

test('a block with a ${…} title resolves to the nearest group with a fixed title', () => {
  let parsed = suite(`
describe('up.form', function() {
  for (let name of ['a', 'b']) {
    describe(\`with \${name}\`, function() {
      it('works', function() {})
    })
  }
})
`)
  assert.deepEqual(names(specFiltersFor(parsed, 'spec/unpoly/form_spec.js', 5)), ['up.form'])
})

test('a filter carries the condition it only runs under', () => {
  let parsed = suite(`
describe('up.form', function() {
  if (up.migrate.loaded) {
    it('submits', function() {})
  }
})
`)
  assert.deepEqual(specFiltersFor(parsed, 'spec/unpoly/form_spec.js', 4),
    [{ name: 'up.form submits', condition: 'up.migrate.loaded' }])
})
