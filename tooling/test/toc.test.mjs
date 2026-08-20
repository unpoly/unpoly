import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  START, END, GUIDE_DIR, TOC_THRESHOLD,
  githubSlug, headings, tocLines, withToc, hasToc,
  anchorsOf, linksOf, guideFiles, readGuide, guidesMissingToc, updateGuides,
} from '../toc.mjs'

// ---- slugs -----------------------------------------------------------------
// These are GitHub's rules, not ours: get them wrong and every link is silently dead.

test('slugs lowercase and hyphenate', () => {
  assert.equal(githubSlug('The full test suite is slow'), 'the-full-test-suite-is-slow')
})

test('slugs drop backticks, parentheses, slashes and apostrophes', () => {
  assert.equal(githubSlug('Running `bin/dev`'), 'running-bindev')
  assert.equal(githubSlug("Where to find a module's specs"), 'where-to-find-a-modules-specs')
  assert.equal(githubSlug("When async/await isn't enough"), 'when-asyncawait-isnt-enough')
  assert.equal(githubSlug('Callback arguments (advanced)'), 'callback-arguments-advanced')
})

test('slugs keep link text but drop the URL', () => {
  assert.equal(githubSlug('See [CI](commit-conventions.md#continuous-integration)'), 'see-ci')
})

test('repeated headings get a numeric suffix, as GitHub does', () => {
  let seen = new Map()
  assert.equal(githubSlug('Options', seen), 'options')
  assert.equal(githubSlug('Options', seen), 'options-1')
  assert.equal(githubSlug('Options', seen), 'options-2')
})

// ---- reading a guide -------------------------------------------------------

test('headings inside fenced code are not headings', () => {
  let markdown = [
    '# Title', '', '## Real', '', '```', '## Not a heading', '```', '', '## Also real',
  ].join('\n')
  assert.deepEqual(headings(markdown).map((h) => h.text), ['Title', 'Real', 'Also real'])
})

test('links inside an indented example are not links', () => {
  let markdown = [
    'Prose with a [real link](other.md#anchor).', '',
    '    See [`{ target }`](#options.target) for details.', '',
  ].join('\n')
  assert.deepEqual(linksOf(markdown), [{ target: 'other.md', anchor: 'anchor' }])
})

test('a TOC lists h2 and h3, nesting the h3s', () => {
  let markdown = ['# T', '', '## One', '', '### Under one', '', '#### Too deep', '', '## Two'].join('\n')
  assert.deepEqual(tocLines(markdown), [
    '- [One](#one)',
    '  - [Under one](#under-one)',
    '- [Two](#two)',
  ])
})

// ---- rewriting -------------------------------------------------------------

test('withToc replaces the block between the markers and leaves the rest alone', () => {
  let markdown = ['# T', '', 'Intro.', '', START, '- [stale](#stale)', END, '', '', '## One'].join('\n')
  assert.equal(withToc(markdown), ['# T', '', 'Intro.', '', START, '- [One](#one)', END, '', '', '## One'].join('\n'))
})

test('withToc refuses a guide that never opted in', () => {
  assert.throws(() => withToc('# T\n\n## One\n'), /markers/)
  assert.equal(hasToc('# T\n\n## One\n'), false)
})

test('withToc is idempotent', () => {
  let once = withToc(['# T', '', START, END, '', '', '## One', '', '### Two'].join('\n'))
  assert.equal(withToc(once), once)
})

// ---- the guides in this repository ----------------------------------------
// These are the drift guards. Each one failed for real at least once while this was written.

test('every guide TOC matches its headings', () => {
  let stale = updateGuides(undefined, { write: false }).map((f) => path.basename(f))
  assert.deepEqual(stale, [], 'stale TOC — run bin/update-contributing-tocs')
})

test('every guide long enough to want a TOC has one', () => {
  let missing = guidesMissingToc().map((f) => path.basename(f))
  assert.deepEqual(missing, [],
    `a guide over ${TOC_THRESHOLD.lines} lines with ${TOC_THRESHOLD.headings}+ headings needs ${START} ` +
    `markers — add them, then run bin/update-contributing-tocs`)
})

test('no guide heading uses a custom {#anchor}, which GitHub ignores', () => {
  let offenders = []
  for (let file of guideFiles()) {
    for (let { text } of headings(readGuide(file))) {
      if (text.includes('{#')) offenders.push(`${path.basename(file)}: ${text}`)
    }
  }
  assert.deepEqual(offenders, [])
})

test('every anchor link between contributor docs resolves', () => {
  let root = path.resolve(GUIDE_DIR, '../..')
  let files = [...guideFiles(), path.join(root, 'CONTRIBUTING.md')]
  let anchors = new Map()
  let anchorsFor = (file) => {
    if (!anchors.has(file)) {
      anchors.set(file, existsSync(file) ? anchorsOf(readFileSync(file, 'utf8')) : null)
    }
    return anchors.get(file)
  }

  let broken = []
  for (let file of files) {
    for (let { target, anchor } of linksOf(readFileSync(file, 'utf8'))) {
      if (/^[a-z]+:/.test(target)) continue
      let dest = target ? path.resolve(path.dirname(file), target) : file
      let found = anchorsFor(dest)
      if (found === null) broken.push(`${path.basename(file)} -> missing file ${target}`)
      else if (!found.has(anchor)) broken.push(`${path.basename(file)} -> ${target || '(self)'}#${anchor}`)
    }
  }
  assert.deepEqual(broken, [])
})
