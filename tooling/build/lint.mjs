// ESLint for the dev watcher: keeps the lint errors of every file in src/ and re-lints only what
// changed, so an ESLint violation reaches `bin/test` and `bin/dev status` like a syntax error does.
//
// The build itself never lints. CI and `bin/lint` run ESLint as a step of their own, over src/,
// spec/ and tooling/. Like the webpack build before, the watcher covers src/ only, and only
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
const ENTRY = path.join(PROJECT_ROOT, 'src/unpoly.js')

export class SourceLinter {
  #eslint = new ESLint({ cwd: PROJECT_ROOT })
  #formatter = null
  // Absolute path → ESLint result with its errors, for every file that has errors.
  #failing = new Map()
  #linted = false

  // Lints `files` (absolute paths as the watcher saw them change, or null for a change it
  // couldn't attribute), or all of src/ on the first call. Resolves with the formatted errors of
  // every file in src/, empty when there are none.
  async lint(files) {
    let targets = this.#linted ? [...files].filter((file) => file && isLinted(file)) : [path.join(PROJECT_ROOT, LINTED_DIR)]
    if (this.#linted && targets.length && !targets.includes(ENTRY)) targets.push(ENTRY)
    this.#linted = true

    let present = []
    for (let file of targets) {
      this.#failing.delete(file)
      // A deleted file has no errors left. A file the config ignores (like a build artifact)
      // would make ESLint warn about it.
      if (existsSync(file) && !(await this.#eslint.isPathIgnored(file))) present.push(file)
    }
    if (present.length) {
      for (let result of await this.#eslint.lintFiles(present)) {
        let errors = result.messages.filter((message) => message.severity === 2)
        if (errors.length) {
          this.#failing.set(result.filePath, { ...result, messages: errors, warningCount: 0, fixableWarningCount: 0 })
        }
      }
    }
    return this.format()
  }

  async format() {
    if (!this.#failing.size) return []
    this.#formatter ??= await this.#eslint.loadFormatter('stylish')
    // Paths from the project root, like esbuild's own errors.
    let results = [...this.#failing.values()].map((result) => ({ ...result, filePath: path.relative(PROJECT_ROOT, result.filePath) }))
    let text = await this.#formatter.format(results)
    // The status file is plain text. bin/test colors it itself.
    return [stripVTControlCharacters(text).trim()]
  }
}

function isLinted(file) {
  let relative = path.relative(PROJECT_ROOT, file)
  return relative.startsWith(LINTED_DIR + path.sep) && LINTED_EXTENSIONS.some((extension) => relative.endsWith(extension))
}
