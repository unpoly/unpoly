// ESLint for the dev watcher: keeps the lint errors of every file in src/ and re-lints only what
// changed, so an ESLint violation reaches `bin/test` and `bin/dev status` like a syntax error does.
// The production build (what bin/release publishes) uses it once, to refuse code with errors.
//
// The other one-shot builds don't lint. CI and `bin/lint` run ESLint as a step of their own, over
// src/, spec/ and tooling/. Like the webpack build before, the watcher covers src/ only, and only
// errors fail a build. Warnings don't.

import { existsSync } from 'node:fs'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { ESLint } from 'eslint'
import { PROJECT_ROOT } from './build_status.mjs'

const LINTED_DIR = 'src'
const LINTED_EXTENSIONS = ['.js', '.ts']
// The entry's no-api-collisions rule (tooling/eslint/no_api_collisions.mjs) reads the `api` of
// every module, so a change to any of them can make the entry fail. ESLint can't know that, so
// we lint the entry again with every change to src/.
const ENTRY = 'src/unpoly.ts'

export class SourceLinter {
  #root
  #eslint
  #formatter = null
  // Absolute path → ESLint result with its errors, for every file that has errors.
  #failing = new Map()
  #linted = false
  // The formatted warnings of the files the last call linted, empty when there are none. They
  // don't fail a build, so they only go to the watcher's log.
  warnings = []

  // `root` is a seam for the self-tests.
  constructor({ root = PROJECT_ROOT } = {}) {
    this.#root = root
    this.#eslint = new ESLint({ cwd: root })
  }

  // Lints `files` (absolute paths as the watcher saw them change, or null for a change it
  // couldn't attribute), or all of src/ on the first call. Resolves with the formatted errors of
  // every file in src/, empty when there are none.
  async lint(files) {
    if (!this.#linted) {
      this.#linted = true
      // Not through the loop below: ESLint reports a directory as ignored.
      return this.#lintTargets([path.join(this.#root, LINTED_DIR)])
    }
    let entry = path.join(this.#root, ENTRY)
    let targets = [...files].filter((file) => file && this.#isLinted(file))
    if (targets.length && !targets.includes(entry)) targets.push(entry)

    let present = []
    for (let file of targets) {
      this.#failing.delete(file)
      // A deleted file has no errors left. A file the config ignores (like a build artifact)
      // would make ESLint warn about it.
      if (existsSync(file) && !(await this.#eslint.isPathIgnored(file))) present.push(file)
    }
    return this.#lintTargets(present)
  }

  async #lintTargets(targets) {
    let warned = []
    if (targets.length) {
      for (let result of await this.#eslint.lintFiles(targets)) {
        let errors = result.messages.filter((message) => message.severity === 2)
        if (errors.length) {
          this.#failing.set(result.filePath, { ...result, messages: errors, warningCount: 0, fixableWarningCount: 0 })
        }
        let warnings = result.messages.filter((message) => message.severity === 1)
        if (warnings.length) {
          warned.push({ ...result, messages: warnings, errorCount: 0, fatalErrorCount: 0, fixableErrorCount: 0 })
        }
      }
    }
    this.warnings = await this.#format(warned)
    return this.format()
  }

  // The formatted errors of every file in src/, empty when there are none.
  format() {
    return this.#format([...this.#failing.values()])
  }

  async #format(results) {
    if (!results.length) return []
    this.#formatter ??= await this.#eslint.loadFormatter('stylish')
    // Paths from the project root, like esbuild's own errors.
    let text = await this.#formatter.format(results.map((result) => ({ ...result, filePath: path.relative(this.#root, result.filePath) })))
    // The status file is plain text. bin/test colors it itself.
    return [stripVTControlCharacters(text).trim()]
  }

  #isLinted(file) {
    let relative = path.relative(this.#root, file)
    return relative.startsWith(LINTED_DIR + path.sep) && LINTED_EXTENSIONS.some((extension) => relative.endsWith(extension))
  }
}
