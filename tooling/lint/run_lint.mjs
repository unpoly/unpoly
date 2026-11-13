// What `bin/lint` does: lint src/, spec/ and tooling/ with Oxlint (`.oxlintrc.json`), check
// src/unpoly.ts for api collisions (api_collisions.mjs), and check the API doc files below src/
// (doc_files.mjs). Extra arguments are forwarded to Oxlint, so `bin/lint --fix` works.
//
// Two builds also lint src/, with the same config (tooling/build/lint.mjs): the production build,
// so bin/release refuses lint errors, and the dev watcher, after every change, so `bin/test`
// reports a lint error in src/ like a syntax error. The other builds don't lint. Nothing else
// checks spec/ and tooling/, in particular no-undef, which catches a spec file using something
// from another file's scope. CI runs this as its own step.
//
// bin/ is not linted: its executables are extensionless, which Oxlint will not match.
import { spawn } from 'node:child_process'
import path from 'node:path'
import { PROJECT_ROOT } from '../build/build_status.mjs'
import { ApiCollisionCheck, ENTRY, formatProblems } from './api_collisions.mjs'
import { checkDocFiles, formatProblems as formatDocFileProblems } from './doc_files.mjs'
import { SRC } from '../docs/doc_file.mjs'

const OXLINT_BIN = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'oxlint')

// Resolves with Oxlint's exit code. A bin that can't be spawned counts as a failure.
function oxlint(args, { root, bin, stdio }) {
  return new Promise((resolve) => {
    let child = spawn(bin, args, { stdio, cwd: root })
    child.on('error', () => resolve(1))
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

// Runs all checks and prints their problems. Resolves with the exit code: Oxlint's, or 1 when
// only our own checks found problems. `root`, `bin`, `entry`, `docRoot` and `log` are seams for
// the self-tests.
export async function runLint({ extraArgs = [], root = PROJECT_ROOT, bin = OXLINT_BIN, entry = ENTRY, docRoot = SRC, log = console.log } = {}) {
  let args = ['src', 'spec', 'tooling', ...extraArgs]
  // Oxlint fixes in one pass and skips a fix that touches another one (like `{a: 1};` needing
  // both a space and no semicolon), where ESLint passes again. A silent pass first gets those.
  if (args.some((arg) => arg.startsWith('--fix'))) await oxlint(args, { root, bin, stdio: 'ignore' })
  let linted = oxlint(args, { root, bin, stdio: 'inherit' })
  let collisions = new ApiCollisionCheck(entry).check()
  let docFileProblems = checkDocFiles(docRoot)
  let code = await linted
  if (collisions.length) {
    log(formatProblems(collisions))
    code ||= 1
  }
  if (docFileProblems.length) {
    log(formatDocFileProblems(docFileProblems))
    code ||= 1
  }
  return code
}
