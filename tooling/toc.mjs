// Generates the table of contents that sits below each long guide's intro, and the checks that
// keep it honest. Guides opt in by carrying the two marker comments; everything between them is
// regenerated from the headings, so a renamed heading can never leave a stale link behind.
//
// Slugs follow GitHub's algorithm, because that is what renders these files. Custom `{#anchor}`
// syntax works in `src/unpoly/pages/` (a different parser builds unpoly.com) but not here.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const START = '<!-- toc -->'
export const END = '<!-- /toc -->'

export const GUIDE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/contributing')

// A guide this size with this many headings is hard to hold in your head, so it earns a TOC.
export const TOC_THRESHOLD = { lines: 150, headings: 5 }

// github-slugger: lowercase, drop punctuation, spaces to hyphens, repeats get a -N suffix.
export function githubSlug(text, seen = new Map()) {
  let slug = text.trim()
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .toLowerCase()
    .replace(/[^\w\- ]/g, '')
    .replace(/ /g, '-')
  let n = seen.get(slug) || 0
  seen.set(slug, n + 1)
  return n === 0 ? slug : `${slug}-${n}`
}

// Lines outside fenced code and outside indented code blocks. Both can hold text that looks
// like a heading or a link — the guides are full of examples of both.
function* proseLines(markdown) {
  let fenced = false
  for (let line of markdown.split('\n')) {
    if (line.startsWith('```')) { fenced = !fenced; continue }
    if (fenced || /^ {4,}\S/.test(line)) continue
    yield line
  }
}

export function headings(markdown) {
  let seen = new Map()
  let result = []
  for (let line of proseLines(markdown)) {
    let match = /^(#{1,6}) (.+)$/.exec(line)
    if (match) {
      let text = match[2].trim()
      result.push({ level: match[1].length, text, slug: githubSlug(text, seen) })
    }
  }
  return result
}

// The anchors a link in another file may point at. Site pages under src/unpoly/pages/ declare
// theirs explicitly, so honor both spellings there.
export function anchorsOf(markdown) {
  let anchors = new Set()
  for (let { text, slug } of headings(markdown)) {
    anchors.add(slug)
    let explicit = /\{#([^}]+)\}/.exec(text)
    if (explicit) anchors.add(explicit[1])
  }
  return anchors
}

export function linksOf(markdown) {
  let links = []
  for (let line of proseLines(markdown)) {
    for (let [, target, anchor] of line.matchAll(/\]\(([^)#\s]*)#([^)\s]+)\)/g)) {
      links.push({ target, anchor })
    }
  }
  return links
}

// h2 and h3 only: h1 is the page title, and h4 would describe paragraphs rather than topics.
export function tocLines(markdown) {
  return headings(markdown)
    .filter(({ level }) => level === 2 || level === 3)
    .map(({ level, text, slug }) => {
      let label = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s*\{#[^}]+\}/, '')
      return `${'  '.repeat(level - 2)}- [${label}](#${slug})`
    })
}

export function hasToc(markdown) {
  return markdown.includes(START) && markdown.includes(END)
}

// The same text with its TOC block rebuilt. Throws unless the guide has opted in, so a caller
// cannot accidentally invent a TOC where nobody wanted one.
export function withToc(markdown) {
  if (!hasToc(markdown)) throw new Error(`No ${START} … ${END} markers`)
  let before = markdown.slice(0, markdown.indexOf(START))
  let after = markdown.slice(markdown.indexOf(END) + END.length)
  return before + [START, ...tocLines(markdown), END].join('\n') + after
}

export function guideFiles(dir = GUIDE_DIR) {
  return readdirSync(dir).filter((name) => name.endsWith('.md')).sort()
    .map((name) => path.join(dir, name))
}

export function readGuide(file) {
  return readFileSync(file, 'utf8')
}

// Guides that ought to carry a TOC but do not, so the convention cannot quietly lapse.
export function guidesMissingToc(files = guideFiles()) {
  return files.filter((file) => {
    let text = readGuide(file)
    if (hasToc(text)) return false
    let big = text.split('\n').length >= TOC_THRESHOLD.lines
    let deep = headings(text).filter(({ level }) => level === 2 || level === 3).length >= TOC_THRESHOLD.headings
    return big && deep
  })
}

// Rewrites every opted-in guide. Returns the files whose TOC was out of date.
export function updateGuides(files = guideFiles(), { write = true } = {}) {
  let stale = []
  for (let file of files) {
    let text = readGuide(file)
    if (!hasToc(text)) continue
    let updated = withToc(text)
    if (updated !== text) {
      stale.push(file)
      if (write) writeFileSync(file, updated)
    }
  }
  return stale
}
