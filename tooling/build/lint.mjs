// Oxlint for the dev watcher: keeps the lint errors of every file in src/ and re-lints only what
// changed, so a lint error reaches `bin/test` and `bin/dev status` like a syntax error does.
// The production build (what bin/release publishes) uses it once, to refuse code with errors.
//
// The watcher uses Oxlint's native rules only (`.oxlintrc.native.json`), which take ~50 ms for a
// changed file. The rules that run in JavaScript (code style, `declare` on class fields) would add
// a second to every round, so they wait for `bin/lint`, CI and the production build, which use
// the full `.oxlintrc.json`. The entry's api collision check (tooling/lint/api_collisions.mjs)
// runs with every round.
//
// The other one-shot builds don't lint. CI and `bin/lint` lint src/, spec/ and tooling/. Like the
// webpack build before, the watcher covers src/ only, and only errors fail a build. Warnings only
// go to the watcher's log.

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { PROJECT_ROOT } from './build_status.mjs'
import { ApiCollisionCheck } from '../lint/api_collisions.mjs'

const OXLINT_BIN = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'oxlint')
const LINTED_DIR = 'src'
const LINTED_EXTENSIONS = ['.js', '.ts']
const ENTRY = 'src/unpoly.ts'

export const NATIVE_CONFIG = '.oxlintrc.native.json'
export const FULL_CONFIG = '.oxlintrc.json'

export class SourceLinter {
  #root
  #config
  #apiCollisions
  // Absolute path → Oxlint's errors in that file, for every file that has errors.
  #failing = new Map()
  #collisions = []
  #linted = false
  // The formatted warnings of the files the last call linted, empty when there are none. They
  // don't fail a build, so they only go to the watcher's log.
  warnings = []

  // `root` is a seam for the self-tests. `config` is relative to it.
  constructor({ root = PROJECT_ROOT, config = NATIVE_CONFIG } = {}) {
    this.#root = root
    this.#config = config
    this.#apiCollisions = new ApiCollisionCheck(path.join(root, ENTRY))
  }

  // Lints `files` (absolute paths as the watcher saw them change, or null for a change it
  // couldn't attribute), or all of src/ on the first call. Resolves with the formatted errors of
  // every file in src/, empty when there are none.
  async lint(files) {
    let targets
    if (this.#linted) {
      targets = [...files].filter((file) => file && this.#isLinted(file))
      for (let file of targets) this.#failing.delete(file)
      // A deleted file has no errors left.
      targets = targets.filter((file) => existsSync(file))
    } else {
      this.#linted = true
      targets = [path.join(this.#root, LINTED_DIR)]
    }

    // The entry's collisions depend on every module's api, so we check them with every round.
    // That only parses the modules that changed.
    this.#checkApiCollisions()
    let warned = new Map()
    for (let diagnostic of targets.length ? await this.#oxlint(targets) : []) {
      let file = path.resolve(this.#root, diagnostic.filename)
      let byFile = diagnostic.severity === 'error' ? this.#failing : warned
      byFile.set(file, [...(byFile.get(file) ?? []), diagnostic])
    }
    this.warnings = this.#format(warned)
    return this.format()
  }

  // The formatted errors of every file in src/, empty when there are none.
  format() {
    let blocks = this.#format(this.#failing)
    if (this.#collisions.length) blocks.push(formatFile(ENTRY, this.#collisions))
    return blocks
  }

  // Paths from the project root, like esbuild's own errors.
  #format(diagnosticsByFile) {
    return [...diagnosticsByFile].map(([file, diagnostics]) => formatFile(path.relative(this.#root, file), diagnostics))
  }

  #checkApiCollisions() {
    if (!existsSync(path.join(this.#root, ENTRY))) return
    this.#collisions = this.#apiCollisions.check().map((problem) => ({ ...problem, severity: 'error', code: 'unpoly(api-collisions)' }))
  }

  // Resolves with Oxlint's errors and warnings in `targets`, as { filename, line, column,
  // message, code, severity }.
  #oxlint(targets) {
    let args = ['-c', this.#config, '-f', 'json', '--no-error-on-unmatched-pattern', ...targets]
    return new Promise((resolve) => {
      let child = spawn(OXLINT_BIN, args, { cwd: this.#root })
      let stdout = ''
      let stderr = ''
      child.stdout.on('data', (data) => stdout += data)
      child.stderr.on('data', (data) => stderr += data)
      child.on('close', () => {
        let report
        try {
          report = JSON.parse(stdout)
        } catch {
          // A broken config, for example. Fail the build with what Oxlint said.
          resolve([{ filename: this.#config, severity: 'error', message: `Oxlint failed: ${(stderr || stdout).trim()}` }])
          return
        }
        resolve(report.diagnostics.map((diagnostic) => ({
          filename: diagnostic.filename,
          severity: diagnostic.severity === 'error' ? 'error' : 'warning',
          line: diagnostic.labels?.[0]?.span.line,
          column: diagnostic.labels?.[0]?.span.column,
          message: diagnostic.message,
          code: diagnostic.code,
        })))
      })
    })
  }

  #isLinted(file) {
    let relative = path.relative(this.#root, file)
    return relative.startsWith(LINTED_DIR + path.sep) && LINTED_EXTENSIONS.some((extension) => relative.endsWith(extension))
  }
}

// Like ESLint's "stylish" format. The status file is plain text, bin/test colors it itself.
function formatFile(file, diagnostics) {
  let lines = diagnostics.map(({ line, column, message, code, severity }) => {
    let position = line ? `${line}:${column}` : ''
    return `  ${position.padEnd(7)}  ${severity}  ${message}${code ? `  ${code}` : ''}`
  })
  return [file, ...lines].join('\n')
}
