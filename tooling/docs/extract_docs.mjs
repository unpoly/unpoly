// Moves every /*- … */ doc comment of a .ts file into a sibling doc file (fragment.ts → fragment.md),
// which unpoly-site parses in its place. A one-off for the TypeScript migration.
//
// Usage: node tooling/docs/extract_docs.mjs src/unpoly/fragment.ts [more.ts …]
//
// Each entry in the doc file starts with an H1 (`# up.render()`), followed by the comment's text,
// dedented by the indentation of its `/*-` line, directives included and otherwise byte for byte.
// Entries are separated by a line of five dashes with a blank line above and below.
//
// The H1 follows unpoly-site's title rules (lib/unpoly/site/parser.rb, feature.rb, interface.rb),
// because the site rejects an H1 that does not match the title of the entry it heads.
// The doc file format is the site's DocComment.find_in_doc_file, which parseDocFile() mirrors.
//
// Prints a note for every comment that may not move cleanly; a note means: look at it by hand.
// The core is PURE: extract(), title() and parseDocFile() take text and touch no files.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// The patterns of unpoly-site's Parser, in the order it tries them. They are not anchored to a
// line start, so the first match anywhere in the comment wins, as it does for the site.
const INTERFACE = /@(class|namespace|page) (.+)/
const FEATURE = /@(function|selector|event|property|constructor|header|cookie) (.+)/
const PARTIAL = /@partial (.+)/

// A @page may be titled by a setext H1 at the start of its text (after the @page line is gone).
const PAGE_TITLE = /^[ \t\n]*(.+)\n={3,}(\n|$)/

// The site's DocComment patterns.
const SEPARATOR = /^-{5,}[ \t]*$/
const HEADING = /^#[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/
const ESCAPED_PUNCTUATION = /\\([!-/:-@[-`{-~])/g
const OPENING_FENCE = /^[ \t]*(?:(?:[-+*]|\d{1,9}[.)])[ \t]+)*(`{3,}(?=[^`]*$)|~{3,})/
const CLOSING_FENCE = /^[ \t]*(`{3,}|~{3,})[ \t]*$/

const ENTRY_SEPARATOR = '\n\n-----\n\n'

// The title that unpoly-site gives the entry for a comment body, or undefined if it cannot parse it.
export function title(body) {
  let match
  if ((match = body.match(INTERFACE))) {
    let [, kind, name] = match
    name = name.trim()
    if (kind === 'page') {
      let rest = unindent(body.replace(INTERFACE, ''))
      let explicit = rest.match(PAGE_TITLE)
      if (explicit) return explicit[1].trim()
    }
    return name
  } else if ((match = body.match(FEATURE))) {
    let [, kind, name] = match
    name = name.trim()
    // Like Feature#short_signature. The name is kept as written: `up.Request#abort()` matches the
    // site's menu title, `up.Request.prototype.abort()` its title, and the site accepts either.
    if (kind === 'function') return `${name}()`
    if (kind === 'constructor') return `new ${name}()`
    return name
  } else if ((match = body.match(PARTIAL))) {
    return match[1].trim()
  }
}

// Like the site's Util.unindent: removes the indentation that all non-blank lines share.
function unindent(text) {
  let indents = text.split('\n').filter((line) => line.trim()).map((line) => line.match(/^[ \t]*/)[0].length)
  let shared = Math.min(...indents)
  return shared === Infinity ? text : text.split('\n').map((line) => line.slice(Math.min(shared, line.match(/^[ \t]*/)[0].length))).join('\n')
}

// The indexes of lines in fenced code blocks, fences included. Undefined fence = still open at the end.
function codeLines(lines) {
  let code = new Set()
  let fence
  lines.forEach((line, index) => {
    let match
    if (fence) {
      code.add(index)
      if ((match = line.match(CLOSING_FENCE)) && match[1][0] === fence[0] && match[1].length >= fence.length) fence = undefined
    } else if ((match = line.match(OPENING_FENCE))) {
      code.add(index)
      fence = match[1]
    }
  })
  return { code, unclosed: !!fence }
}

// What would keep the site from reading a body back as the same entry.
function bodyProblems(body) {
  let lines = body.split('\n')
  let { code, unclosed } = codeLines(lines)
  let problems = []
  if (unclosed) problems.push('has an unclosed code fence, which would swallow the entries after it')
  lines.forEach((line, index) => {
    if (code.has(index)) return
    let blankAround = (lines[index - 1] ?? '').trim() === '' && (lines[index + 1] ?? '').trim() === ''
    if (SEPARATOR.test(line) && blankAround) problems.push(`line ${index + 1} is a line of dashes, which would split the entry`)
    if (HEADING.test(line)) problems.push(`line ${index + 1} is an H1, which would start a second entry`)
  })
  return problems
}

// Splits a source file into its doc comment entries and the code without them.
export function extract(source, file = '(source)') {
  let lines = source.split('\n')
  let entries = []
  let notes = []
  let keep = []
  let i = 0

  while (i < lines.length) {
    let open = lines[i].match(/^([ \t]*)\/\*-[ \t]*$/)
    if (!open) {
      if (lines[i].includes('/*-')) notes.push(`${file}:${i + 1}: /*- not on a line of its own, left in place`)
      keep.push(lines[i++])
      continue
    }

    let indent = open[1]
    let start = i
    let end = start + 1
    while (end < lines.length && !/^[ \t]*\*\/[ \t]*$/.test(lines[end])) {
      if (lines[end].includes('*/')) throw new Error(`${file}:${end + 1}: */ that does not stand on a line of its own`)
      end++
    }
    if (end === lines.length) throw new Error(`${file}:${start + 1}: unterminated doc comment`)

    let bodyLines = lines.slice(start + 1, end).map((line, offset) => {
      if (line.startsWith(indent)) return line.slice(indent.length)
      if (line.trim()) notes.push(`${file}:${start + offset + 2}: indented less than its /*-, dedent drops its indentation`)
      return line.trimStart()
    })
    let body = bodyLines.join('\n').replace(/^\n+|\n+$/g, '')
    let heading = title(body)

    if (!heading) {
      notes.push(`${file}:${start + 1}: no @class, @namespace, @page, feature or @partial directive, H1 is a placeholder`)
    } else if (headingAsSiteReadsIt(heading) !== heading) {
      notes.push(`${file}:${start + 1}: the site would read the H1 '# ${heading}' as '${headingAsSiteReadsIt(heading)}'`)
    }
    for (let problem of bodyProblems(body)) notes.push(`${file}:${start + 1}: ${problem}`)

    entries.push({ title: heading ?? '(untitled)', body, line: start + 1 })

    // The line after the comment: code it documented, or a blank line (a comment that stands alone).
    let next = lines[end + 1]
    let prevBlank = keep.length === 0 || keep.at(-1).trim() === ''
    i = end + 1
    // Don't leave two blank lines where the comment was.
    if (prevBlank && next !== undefined && next.trim() === '') i++
  }

  // Collapse leading blank lines that a removed comment at the top would leave.
  while (keep.length && keep[0].trim() === '') keep.shift()

  let markdown = entries.length ? entries.map(({ title, body }) => `# ${title}\n\n${body}`).join(ENTRY_SEPARATOR) + '\n' : ''
  return { code: keep.join('\n'), markdown, entries, notes }
}

function headingAsSiteReadsIt(heading) {
  let match = `# ${heading}`.match(HEADING)
  return match && match[1].replace(ESCAPED_PUNCTUATION, '$1')
}

// Reads a doc file back into its entries, like the site's DocComment.find_in_doc_file.
export function parseDocFile(markdown) {
  let lines = markdown.split('\n')
  if (lines.at(-1) === '') lines.pop()
  let { code } = codeLines(lines)
  let separators = lines.flatMap((line, index) => {
    let isSeparator = SEPARATOR.test(line) && !code.has(index) && (index === 0 || !lines[index - 1].trim()) && !(lines[index + 1] ?? '').trim()
    return isSeparator ? [index] : []
  })
  let bounds = [-1, ...separators, lines.length]
  return bounds.slice(0, -1).map((separator, n) => {
    let entry = lines.slice(separator + 1, bounds[n + 1])
    while (entry.length && !entry[0].trim()) entry.shift()
    while (entry.length && !entry.at(-1).trim()) entry.pop()
    let heading = entry[0]?.match(HEADING)
    if (!heading) throw new Error(`Entry ${n + 1} does not start with an H1`)
    let body = entry.slice(1)
    while (body.length && !body[0].trim()) body.shift()
    return { title: heading[1].replace(ESCAPED_PUNCTUATION, '$1'), body: body.join('\n') }
  })
}

function main(files) {
  let exitCode = 0
  for (let file of files) {
    let mdFile = file.replace(/\.ts$/, '.md')
    if (mdFile === file) throw new Error(`Not a .ts file: ${file}`)
    let { code, markdown, entries, notes } = extract(fs.readFileSync(file, 'utf8'), file)
    if (entries.length) {
      if (fs.existsSync(mdFile)) throw new Error(`${mdFile} exists already`)
      fs.writeFileSync(mdFile, markdown)
      fs.writeFileSync(file, code)
    }
    console.log(`${file}: moved ${entries.length} doc comments${entries.length ? ` to ${mdFile}` : ''}`)
    for (let note of notes) console.log('  ' + note)
    if (notes.length) exitCode = 1
  }
  return exitCode
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2))
}
