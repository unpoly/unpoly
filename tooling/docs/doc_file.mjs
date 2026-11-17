// Reads the API doc files: the .md files below src/ outside a pages/ directory, which hold the
// API docs of the source file next to them (fragment.md for fragment.ts). unpoly-site parses them
// (DocComment.find_in_doc_file), and this module splits them into entries the same way.
//
// Only the site titles an entry from its directives, and its build rejects an H1 that doesn't
// match. We don't repeat its title rules here.
//
// tooling/lint/doc_files.mjs (bin/lint) reports the problems that parseDocFile() finds.
// tooling/docs/api_probe.mjs (bin/typecheck) checks that the entries name API that exists.
import fs from 'node:fs'
import path from 'node:path'
import { PROJECT_ROOT } from '../build/build_status.mjs'

export const SRC = path.join(PROJECT_ROOT, 'src')

// The site's DocComment patterns.
const SEPARATOR = /^-{5,}[ \t]*$/
const HEADING = /^#[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/
const OPENING_FENCE = /^[ \t]*(?:(?:[-+*]|\d{1,9}[.)])[ \t]+)*(`{3,}(?=[^`]*$)|~{3,})/
const CLOSING_FENCE = /^[ \t]*(`{3,}|~{3,})[ \t]*$/

// Like the site, which reads every .md file below src/ and takes one in a pages/ directory for a
// guide page.
export function docFiles(root = SRC) {
  return fs.readdirSync(root, { recursive: true })
    .filter((file) => file.endsWith('.md') && !file.split(path.sep).includes('pages'))
    .sort()
    .map((file) => path.join(root, file))
}

// The indexes of lines in fenced code blocks, fences included, and the index of a fence that is
// still open at the end (undefined if none is).
export function codeLines(lines) {
  let code = new Set()
  let fence, fenceIndex
  lines.forEach((line, index) => {
    let match
    if (fence) {
      code.add(index)
      if ((match = line.match(CLOSING_FENCE)) && match[1][0] === fence[0] && match[1].length >= fence.length) fence = undefined
    } else if ((match = line.match(OPENING_FENCE))) {
      code.add(index)
      fence = match[1]
      fenceIndex = index
    }
  })
  return { code, unclosed: fence ? fenceIndex : undefined }
}

// Splits the text of a doc file into its entries ({ line, lines }: the line number of its H1 and
// its lines from the H1 to its last non-blank line), and lists the mistakes that would keep the
// site from reading it as meant ({ line, message }), all of them at once:
//
// - an entry that does not start with an H1, or that has a second H1 (a missing separator),
// - an empty entry, and a separator before the first entry or after the last,
// - a separator without a blank line above and below (one followed by an H1, which was meant
//   to separate; any other line of dashes belongs to the entry, as it does for the site),
// - an unclosed code fence, which swallows the rest of the file.
export function parseDocFile(text) {
  let lines = text.replace(/^﻿/, '').split('\n').map((line) => line.replace(/\r$/, ''))
  if (lines.at(-1) === '') lines.pop()
  let entries = []
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

    if (!isH1(first)) {
      report(first, "An entry must start with an H1 like '# up.render()'.")
      continue
    }
    for (let index = first + 1; index <= last; index++) {
      if (isH1(index)) report(index, 'A second H1 in one entry. Is a ----- separator missing above it?')
    }
    entries.push({ line: first + 1, lines: lines.slice(first, last + 1) })
  }
  return { entries, problems: problems.sort((a, b) => a.line - b.line) }
}
