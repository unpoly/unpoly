// A check for the structure of the API doc files (see tooling/docs/doc_file.mjs). unpoly-site
// fails its build on a malformed one. This reports the same structural mistakes without a site
// build, and all of them at once. Only the site checks that an entry's H1 matches its directives.
//
// `bin/lint` runs it.
import fs from 'node:fs'
import path from 'node:path'
import { PROJECT_ROOT } from '../build/build_status.mjs'
import { docFiles, parseDocFile, SRC } from '../docs/doc_file.mjs'

// Returns a list of problems ({ file, line, column, message }) in all doc files below root.
export function checkDocFiles(root = SRC) {
  return docFiles(root).flatMap((file) => {
    return checkDocFile(fs.readFileSync(file, 'utf8')).map(({ line, message }) => ({ file, line, column: 1, message }))
  })
}

// Returns a list of problems ({ line, message }) in the text of a doc file.
export function checkDocFile(text) {
  return parseDocFile(text).problems
}

// Formats problems from checkDocFiles() like Oxlint's default output, with paths from the project root.
export function formatProblems(problems) {
  return problems.map(({ file, line, column, message }) => `${path.relative(PROJECT_ROOT, file)}:${line}:${column}: error unpoly(doc-files): ${message}`).join('\n')
}
