// Prints the outline of Markdown files: the title, the opening paragraph and every heading with
// the lines its section spans, so a reader (often an agent) can read one section instead of the
// whole file. See bin/outline.
//
// Keep in sync with unpoly-site/source/skills/unpoly-docs/scripts/outline.py, the same tool for
// the agent skill. Both must pass tooling/test/fixtures/outline/, which is the contract between
// them: change a rule here, change it there, and pin it with a fixture.
//
// It reads the Markdown we write, not all of CommonMark: ATX and setext headings, fenced code,
// frontmatter, HTML comments, the <!-- toc --> blocks of the contributing guides and the <nav>
// blocks of the skill pages (breadcrumbs, contents, reading order).
//
// The core is PURE: outline() and formatOutlines() take Markdown text and touch no files.

// What a line is. SKIP holds nothing we would list or quote: frontmatter, comments, horizontal
// rules and the navigation that a generator wraps around the real text.
const SKIP = 'skip'
const CODE = 'code'
const BLANK = 'blank'
const TEXT = 'text'
const HEADING = 'heading'
const UNDERLINE = 'underline'

const IMAGE = /^\s*(?:\[\s*)?!\[[^\]]*\]\([^)]*\)(?:\]\([^)]*\))?\s*$|^\s*<img\b[^>]*>\s*$/

function splitLines(markdown) {
  let lines = markdown.split('\n').map((line) => line.replace(/\r$/, ''))
  // A final newline ends the last line rather than starting another, as `wc -l` counts.
  if (lines.at(-1) === '') lines.pop()
  return lines
}

// Gives every line a kind, and marks headings with their level and text. Lines are 0-based here.
function classify(lines) {
  let kinds = []
  let headings = []
  let i = 0

  if (lines[0] === '---') {
    let close = lines.indexOf('---', 1)
    if (close > 0) {
      for (; i <= close; i++) kinds.push(SKIP)
    }
  }

  // The fence that opened the current code block, or the end of the current skipped block.
  let fence = null
  let skipUntil = null

  for (; i < lines.length; i++) {
    let line = lines[i]

    if (fence) {
      kinds.push(CODE)
      let closing = /^\s*(`+|~+)\s*$/.exec(line)
      if (closing && closing[1][0] === fence[0] && closing[1].length >= fence.length) fence = null
      continue
    }

    if (skipUntil) {
      kinds.push(SKIP)
      if (skipUntil.test(line)) skipUntil = null
      continue
    }

    let opening = /^\s*(`{3,}|~{3,})(.*)$/.exec(line)
    // An info string may not hold a backtick, or ```this``` would open a block.
    if (opening && !(opening[1][0] === '`' && opening[2].includes('`'))) {
      fence = opening[1]
      kinds.push(CODE)
      continue
    }

    if (/^\s*<!--\s*toc\s*-->/.test(line)) {
      skipUntil = /<!--\s*(\/toc|tocstop)\s*-->/
      kinds.push(SKIP)
      continue
    }

    if (/^\s*<!--/.test(line)) {
      if (!line.includes('-->')) skipUntil = /-->/
      kinds.push(SKIP)
      continue
    }

    if (/^\s*<nav\b/.test(line)) {
      if (!line.includes('</nav>')) skipUntil = /<\/nav>/
      kinds.push(SKIP)
      continue
    }

    if (!line.trim()) {
      kinds.push(BLANK)
      continue
    }

    let atx = /^(#{1,6})[ \t]+(.*)$/.exec(line)
    if (atx) {
      let text = atx[2].replace(/(^|[ \t]+)#+[ \t]*$/, '')
      headings.push({ index: i, level: atx[1].length, text: headingText(text) })
      kinds.push(HEADING)
      continue
    }

    let underline = /^ {0,3}(=+|-+)\s*$/.exec(line)
    if (underline && isSetextText(lines[i - 1], kinds[i - 1])) {
      kinds[i - 1] = HEADING
      headings.push({ index: i - 1, level: underline[1][0] === '=' ? 1 : 2, text: headingText(lines[i - 1]) })
      kinds.push(UNDERLINE)
      continue
    }

    if (/^ {0,3}([-*_])( *\1){2,}\s*$/.test(line)) {
      kinds.push(SKIP)
      continue
    }

    kinds.push(TEXT)
  }

  return { kinds, headings }
}

// Only a paragraph line can be underlined into a heading. Underneath a list item, a table row,
// a quote or an indented line, a `---` is a horizontal rule.
function isSetextText(line, kind) {
  return kind === TEXT && !/^\s|^([-*+]|\d+[.)])(\s|$)|^>|\|/.test(line)
}

// `{#anchor}` sets the slug on unpoly.com and is no part of the heading's text.
function headingText(text) {
  return text.replace(/\s*\{#[^}]*\}\s*$/, '').trim()
}

// The title, the opening paragraph and the sections up to `depth`, with 1-based line ranges.
// A section includes its subsections. The intro is the text above the first listed heading.
export function outline(markdown, { depth = 3 } = {}) {
  let lines = splitLines(markdown)
  let { kinds, headings } = classify(lines)

  // The title is an H1 that comes before any content, so a document that opens with a
  // paragraph has no title, and its first H1 is listed like any other heading.
  let first = kinds.findIndex((kind) => kind !== SKIP && kind !== BLANK)
  let title = headings[0]?.index === first && headings[0].level === 1 ? headings[0] : null
  let body = headings.filter((heading) => heading !== title)
  let listed = body.filter((heading) => heading.level <= depth)

  // The opening paragraph: the first run of text lines above the first heading. Code and
  // images may come before it, but are not it.
  let summary = []
  let start = title ? title.index + 1 : 0
  let stop = body.length ? body[0].index : lines.length
  for (let i = start; i < stop; i++) {
    if (kinds[i] === TEXT && (summary.length || !IMAGE.test(lines[i]))) {
      summary.push(lines[i])
    } else if (summary.length) {
      break
    }
  }

  let sections = []
  let introEnd = listed.length ? listed[0].index : lines.length
  let hasIntro = kinds.slice(start, introEnd).some((kind) => kind !== SKIP && kind !== BLANK && kind !== UNDERLINE)
  if (hasIntro) sections.push({ start: 1, end: introEnd, label: '(intro)' })

  for (let heading of listed) {
    let next = body.find((other) => other.index > heading.index && other.level <= heading.level)
    sections.push({
      start: heading.index + 1,
      end: next ? next.index : lines.length,
      label: `${'#'.repeat(heading.level)} ${heading.text}`,
    })
  }

  return { lineCount: lines.length, title: title?.text, summary, sections }
}

// One block per file, with the range column as wide as its widest entry across all files, so
// several outlines read as one table.
export function formatOutlines(files, { depth = 3 } = {}) {
  let outlines = files.map(({ path, markdown }) => ({ path, ...outline(markdown, { depth }) }))
  let ranges = outlines.flatMap(({ sections }) => sections.map(({ start, end }) => `${start}-${end}`))
  let width = Math.max(0, ...ranges.map((range) => range.length)) + 2

  return outlines.map(({ path, lineCount, title, summary, sections }) => {
    let size = `(${lineCount} ${lineCount === 1 ? 'line' : 'lines'})`
    let block = [title ? `${path}: ${title} ${size}` : `${path} ${size}`]
    if (summary.length) block.push(...summary.map((line) => `  ${line}`), '')
    for (let { start, end, label } of sections) {
      block.push(`  ${`${start}-${end}`.padEnd(width)}${label}`)
    }
    return block.join('\n')
  }).join('\n\n')
}
