// TypeScript 7's checks of src/, for `bin/typecheck` and for the dev watcher, which checks types
// after its rounds of rebuilds (see TypeChecks in watch.mjs).
//
// There are three checks:
//
//   1. tsconfig.json: all of src/, with loose settings.
//   2. tsconfig.core.json: Unpoly's core (src/unpoly/), with stricter settings and without
//      unpoly-migrate's declarations. The folders listed in NOT_YET_STRICT get the same check
//      without the stricter settings.
//   3. The API probe: everything that the doc files below src/ document as public must exist in
//      the types (tooling/docs/api_probe.mjs). The core probe is a file that tsconfig.core.json's
//      check reads along with core, the migrate probe one that tsconfig.json's check reads.
//
// So two runs of tsc cover all three: the core check with the core probe, and the loose check
// with the migrate probe. Each takes ~0.35 s, and they run side by side (~0.5 s on 8 cores).
// `bin/typecheck` runs the loose check a third time, without the probe, for tsc's pretty output.
//
// The build doesn't use TypeScript at all: esbuild strips the types.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { PROJECT_ROOT } from './build_status.mjs'
import { formatFile } from './lint.mjs'
import { collectProbes, probeSource, translateError } from '../docs/api_probe.mjs'

const TSC_BIN = path.join(PROJECT_ROOT, 'node_modules', 'typescript', 'bin', 'tsc')

// Core folders that don't pass the stricter settings of tsconfig.core.json yet. tsc has no
// per-file settings, and leaving a folder out of the config's `include` doesn't help: other
// core files import it, so tsc checks it anyway. We run the core check a second time without
// the stricter settings, and take these folders' errors from that run.
export const NOT_YET_STRICT = [
  // All of core passes the stricter settings now.
]

// The settings that tsconfig.core.json adds to tsconfig.json. The second run turns them off.
// When tsconfig.core.json gets another setting, add it here.
const STRICT_SETTINGS = ['noImplicitAny', 'strictNullChecks']

// Where bin/typecheck writes the probe files (gitignored). The watcher writes its own, so that a
// bin/typecheck run beside it never reads a half-written one.
export const PROBE_DIR = 'tmp/api_probe'

// Resolves with tsc's exit code and output. `signal` aborts the run (see AbortController), and
// the promise then resolves with `aborted: true`. When tsc can't be spawned, `stderr` says why.
// `bin` is a seam for the self-tests.
export function tsc(args, { root = PROJECT_ROOT, stdio = 'pipe', signal, bin = TSC_BIN } = {}) {
  return new Promise((resolve) => {
    let child = spawn(bin, args, { stdio, cwd: root, signal })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (chunk) => stdout += chunk)
    child.stderr?.on('data', (chunk) => stderr += chunk)
    child.on('error', (error) => resolve({ code: 1, stdout, stderr: stderr || error.message, aborted: !!signal?.aborted }))
    // 'close', not 'exit': only then have we read all of its output.
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr, aborted: !!signal?.aborted }))
  })
}

// Splits tsc's plain output (`--pretty false`) into blocks. An error starts with
// `path(line,col): error`, followed by indented lines that elaborate it. An error without a
// location, like a missing type library, starts with `error`. Any other line is a block of its own.
export function outputBlocks(output) {
  let blocks = []
  for (let line of output.split('\n')) {
    if (/^\s/.test(line) && blocks.length) {
      blocks.at(-1).lines.push(line)
    } else if (line) {
      blocks.push({ lines: [line], error: /^(\S+\(\d+,\d+\): )?error TS\d+/.test(line) })
    }
  }
  return blocks
}

// tsc may also fail without printing an error, e.g. when it crashes.
export function crashed({ code, stdout, aborted }) {
  return !aborted && code !== 0 && !outputBlocks(stdout).some(({ error }) => error)
}

export function count(blocks) {
  return blocks.filter(({ error }) => error).length
}

function isNotYetStrict({ lines }) {
  return NOT_YET_STRICT.some((folder) => lines[0].startsWith(folder))
}

// Writes the probe files into `dir`, each with a tsconfig that adds it to the given config.
function writeProbes(root, dir) {
  let probes = collectProbes(root)
  fs.mkdirSync(path.join(root, dir), { recursive: true })
  let write = (name, config) => {
    let { source, headerLines } = probeSource(probes[name], path.relative(dir, 'src'))
    fs.writeFileSync(path.join(root, dir, `${name}.ts`), source)
    let probeConfig = { extends: path.relative(dir, config), files: [`${name}.ts`] }
    fs.writeFileSync(path.join(root, dir, `tsconfig.${name}.json`), JSON.stringify(probeConfig, null, 2) + '\n')
    return { probes: probes[name], file: `${dir}/${name}.ts`, config: `${dir}/tsconfig.${name}.json`, headerLines }
  }
  return { core: write('core', 'tsconfig.core.json'), migrate: write('migrate', 'tsconfig.json') }
}

function isIn(probe, { lines }) {
  return lines[0].startsWith(`${probe.file}(`)
}

// The blocks about a probe file, pointed at the doc entries they probe.
function probeErrors(probe, blocks) {
  return blocks.filter((block) => isIn(probe, block)).map((block) => {
    return { ...block, lines: translateError(block.lines, probe.probes, probe.headerLines) ?? block.lines }
  })
}

// Runs the core check and the loose check, each with its probe, side by side. Resolves with the
// blocks of tsc's output (see outputBlocks()), sorted by the check that reports them:
//
//   core:   the core check's (tsconfig.core.json)
//   loose:  the loose check's (tsconfig.json)
//   probe:  both probes', pointed at their doc entries
//
// and the `crashes`: the runs that crashed (see crashed()), with their config. Resolves with
// `aborted: true` instead when `signal` aborted a run. An error that both checks find is in `core`
// and in `loose`. `bin` is a seam for the self-tests.
export async function checkTypes({ root = PROJECT_ROOT, probeDir = PROBE_DIR, extraArgs = [], signal, bin } = {}) {
  let probes = writeProbes(root, probeDir)
  let run = (args) => tsc([...args, '--pretty', 'false', ...extraArgs], { root, signal, bin, stdio: ['ignore', 'pipe', 'pipe'] })
  let coreArgs = ['--project', probes.core.config]
  let [core, coreNotYetStrict, migrate] = await Promise.all([
    run(coreArgs),
    NOT_YET_STRICT.length ? run([...coreArgs, ...STRICT_SETTINGS.flatMap((setting) => [`--${setting}`, 'false'])]) : null,
    run(['--project', probes.migrate.config]),
  ])
  let runs = [core, coreNotYetStrict, migrate].filter(Boolean)
  if (runs.some(({ aborted }) => aborted)) return { aborted: true }
  let coreBlocks = [
    ...outputBlocks(core.stdout).filter((block) => !(block.error && isNotYetStrict(block))),
    ...(coreNotYetStrict ? outputBlocks(coreNotYetStrict.stdout).filter((block) => block.error && isNotYetStrict(block)) : []),
  ]
  let migrateBlocks = outputBlocks(migrate.stdout)
  return {
    core: coreBlocks.filter((block) => !isIn(probes.core, block)),
    loose: migrateBlocks.filter((block) => !isIn(probes.migrate, block)),
    probe: [...probeErrors(probes.core, coreBlocks), ...probeErrors(probes.migrate, migrateBlocks)],
    crashes: [
      ...[core, coreNotYetStrict].filter((result) => result && crashed(result)).map((result) => ({ config: 'tsconfig.core.json', ...result })),
      ...(crashed(migrate) ? [{ config: 'tsconfig.json', ...migrate }] : []),
    ],
  }
}

// Where the watcher writes its probe files.
const WATCH_PROBE_DIR = 'tmp/api_probe_watch'

// The type check of the dev watcher: all three checks. Resolves with `{ errors, count }`, where
// `errors` are blocks of type errors, one per file, formatted like the lint errors (see
// lint.mjs), and `count` is the number of errors. An error that both checks find is listed once.
// Resolves with null when `signal` aborted the check.
export async function watchTypeErrors({ root = PROJECT_ROOT, signal } = {}) {
  let result = await checkTypes({ root, probeDir: WATCH_PROBE_DIR, signal })
  if (result.aborted) return null
  let blocks = [...result.core, ...result.loose, ...result.probe].filter(({ error }) => error)
  let unique = [...new Map(blocks.map((block) => [block.lines.join('\n'), block])).values()]
  let byFile = new Map()
  for (let { lines } of unique) {
    let { file, ...diagnostic } = parseError(lines)
    byFile.set(file, [...(byFile.get(file) ?? []), diagnostic])
  }
  let errors = [...byFile].map(([file, diagnostics]) => formatFile(file, diagnostics))
  errors.push(...result.crashes.map(tscFailure))
  return { errors, count: unique.length + result.crashes.length }
}

// A tsc run that crashed or couldn't be spawned, formatted like an error in its config.
export function tscFailure({ config, code, stdout, stderr }) {
  return formatFile(config, [{ severity: 'error', message: `tsc failed (exit code ${code}): ${(stderr || stdout).trim() || 'no output'}` }])
}

// What `bin/typecheck` does: runs the checks and prints their errors. checkTypes() runs the loose
// check too, with the migrate probe, but without tsc's pretty output. We only take the probe's
// errors from that run, and let a run of its own print the loose check's errors as tsc prints
// them. An error that both checks find is printed twice. Resolves with the exit code. `root`,
// `bin` and `log` are seams for the self-tests.
export async function runTypecheck({ extraArgs = [], root = PROJECT_ROOT, bin, log = console.log } = {}) {
  let checks = checkTypes({ root, extraArgs, bin })
  let loose = await tsc(['--project', 'tsconfig.json', ...extraArgs], { root, bin, stdio: 'inherit' })
  let { core, probe, crashes } = await checks
  // tsc has printed its own failures, but not that it could not start.
  if (loose.stderr) crashes.unshift({ config: 'tsconfig.json', ...loose })
  for (let { lines } of [...core, ...probe]) log(lines.join('\n'))
  // The loose check and the migrate probe's run fail the same way when tsc can't start.
  for (let failure of new Set(crashes.map(tscFailure))) log(failure)
  let coreErrorCount = count(core)
  if (coreErrorCount) {
    log(`\nFound ${coreErrorCount} error${coreErrorCount === 1 ? '' : 's'} in the core check (tsconfig.core.json).`)
  }
  let probeErrorCount = count(probe)
  if (probeErrorCount) {
    log(`\nFound ${probeErrorCount} doc ${probeErrorCount === 1 ? 'entry' : 'entries'} for public API that the types don't have (tooling/docs/api_probe.mjs).`)
  }
  return loose.code || (coreErrorCount || probeErrorCount || crashes.length ? 1 : 0)
}

// The lines of an error block (see outputBlocks()) as `{ file, line, column, message, code }`.
// The message keeps the indented lines that elaborate it. An error without a location is filed
// under "tsc".
export function parseError([first, ...rest]) {
  let match = first.match(/^(?:(\S+)\((\d+),(\d+)\): )?error (TS\d+): (.*)$/)
  if (!match) return { file: 'tsc', severity: 'error', message: [first, ...rest].join('\n') }
  let [, file = 'tsc', line, column, code, message] = match
  return { file, line: line && Number(line), column: column && Number(column), severity: 'error', message: [message, ...rest].join('\n'), code }
}
