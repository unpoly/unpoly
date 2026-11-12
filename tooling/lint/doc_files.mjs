// A check for the doc files: the .md files below src/ outside a pages/ directory, which hold the
// API docs of the source file next to them (fragment.md for fragment.ts). unpoly-site parses them
// (DocComment.find_in_doc_file, Parser#verify_heading!) and fails its build on a malformed one.
// This reports the same mistakes without a site build, and all of them at once:
//
// - an entry that does not start with an H1, or that has a second H1 (a missing separator),
// - an H1 that does not match the title the site gives the entry from its directives,
// - an empty entry, and a separator before the first entry or after the last,
// - a separator without a blank line above and below (one followed by an H1, which was meant
//   to separate; any other line of dashes belongs to the entry, as it does for the site),
// - an unclosed code fence, which swallows the rest of the file.
//
// `bin/lint` runs it.
import fs from 'node:fs'
import path from 'node:path'
import { PROJECT_ROOT } from '../build/build_status.mjs'
import { codeLines, ESCAPED_PUNCTUATION, HEADING, SEPARATOR, titles } from '../docs/extract_docs.mjs'

export const SRC = path.join(PROJECT_ROOT, 'src')

// Returns a list of problems ({ file, line, column, message }) in all doc files below root.
export function checkDocFiles(root = SRC) {
  return docFiles(root).flatMap((file) => {
    return checkDocFile(fs.readFileSync(file, 'utf8')).map(({ line, message }) => ({ file, line, column: 1, message }))
  })
}

// Like the site, which reads every .md file below src/ and takes one in a pages/ directory for a
// guide page.
function docFiles(root) {
  return fs.readdirSync(root, { recursive: true })
    .filter((file) => file.endsWith('.md') && !file.split(path.sep).includes('pages'))
    .sort()
    .map((file) => path.join(root, file))
}

// Returns a list of problems ({ line, message }) in the text of a doc file.
export function checkDocFile(text) {
  let lines = text.replace(/^﻿/, '').split('\n').map((line) => line.replace(/\r$/, ''))
  if (lines.at(-1) === '') lines.pop()
  let problems = []
  let report = (index, message) => problems.push({ line: index + 1, message })
  let isBlank = (index) => !(lines[index] ?? '').trim()
  let { code, unclosed } = codeLines(lines)
  let isH1 = (index) => HEADING.test(lines[index] ?? '') && !code.has(index)
  let nextContent = (index) => {
    while (++index < lines.length && isBlank(index));
    return index
  }

  if (unclosed !== undefined) report(unclosed, 'Unclosed code fence. It swallows the rest of the file, separators and entries included.')

  let separators = []
  lines.forEach((line, index) => {
    if (!SEPARATOR.test(line) || code.has(index)) return
    if ((index === 0 || isBlank(index - 1)) && isBlank(index + 1)) {
      separators.push(index)
    } else if (isH1(nextContent(index))) {
      // Split here anyway, so the entries around it are checked as meant.
      separators.push(index)
      report(index, 'A separator needs a blank line above and below.')
    }
  })

  let bounds = [-1, ...separators, lines.length]
  for (let n = 0; n < bounds.length - 1; n++) {
    let first = nextContent(bounds[n])
    let end = bounds[n + 1]
    if (first >= end) {
      if (end === lines.length && n === 0) continue // A blank file holds no entries.
      if (n === 0) report(end, 'A separator before the first entry.')
      else if (end === lines.length) report(bounds[n], 'A separator after the last entry.')
      else report(end, 'An empty entry between two separators.')
      continue
    }
    let last = end - 1
    while (isBlank(last)) last--

    let heading = lines[first].match(HEADING)
    if (!heading) {
      report(first, "An entry must start with an H1 like '# up.render()'.")
      continue
    }
    for (let index = first + 1; index <= last; index++) {
      if (isH1(index)) report(index, 'A second H1 in one entry. Is a ----- separator missing above it?')
    }

    let body = lines.slice(nextContent(first), last + 1).join('\n') + '\n'
    let accepted = titles(body)
    let actual = heading[1].replace(ESCAPED_PUNCTUATION, '$1')
    if (!accepted.length) {
      report(first, 'The entry has no directive that the site can title it by, like @function, @selector, @class, @page or @partial.')
    } else if (!accepted.includes(actual)) {
      report(first, `H1 '# ${actual}' does not match the entry's directives. Expected ${accepted.map((title) => `'# ${title}'`).join(' or ')}.`)
    }
  }
  return problems.sort((a, b) => a.line - b.line)
}

// Formats problems from checkDocFiles() like Oxlint's default output, with paths from the project root.
export function formatProblems(problems) {
  return problems.map(({ file, line, column, message }) => `${path.relative(PROJECT_ROOT, file)}:${line}:${column}: error unpoly(doc-files): ${message}`).join('\n')
}
