// Pure formatting: turns the run model (built by receiver.mjs) into strings.
// No I/O, no Puppeteer, no state — so it's covered directly by tooling/test/.
// Colors come from picocolors, which disables itself when stdout is not a TTY or
// NO_COLOR is set (the self-tests run with NO_COLOR).

import pc from 'picocolors'
import { renderOutline } from './dom_outline.mjs'

// A build (webpack / ts-loader syntax / ESLint) failed — render its errors the way
// we render a spec failure: a red header and the indented error output.
export function buildFailure(errors) {
  let lines = []
  lines.push('')
  lines.push(pc.red('✗ Build failed'))
  lines.push('')
  lines.push(indent((errors || '').trim() || '(no error output captured)', 2))
  lines.push('')
  return lines.join('\n') + '\n'
}

// One character per spec in the live progress line.
export function mark(status) {
  switch (status) {
    case 'passed': return pc.green('.')
    case 'failed': return pc.red('F')
    case 'pending': return pc.yellow('S')
    default: return ''
  }
}

export function groupHeader(name) {
  return name + ' '
}

// "N passed, N failed, N skipped", colored red if anything failed else green.
// With { always: false }, zero failed/skipped categories are omitted.
function formatCounts({ passed, failed, pending }, { always = true } = {}) {
  let parts = [`${passed} passed`]
  if (always || failed) parts.push(`${failed} failed`)
  if (always || pending) parts.push(`${pending} skipped`)
  let text = parts.join(', ')
  return failed ? pc.red(text) : pc.green(text)
}

export function groupSummary(counts) {
  return ' ' + formatCounts(counts, { always: false }) + '\n'
}

// failure: { index, path, messages[], frames[], log[], dom, debugURL }
export function failureBlock(failure, { verbose } = {}) {
  let lines = []
  lines.push('')
  lines.push(pc.red(`F${failure.index}) `) + failure.path)
  lines.push('')

  lines.push(indent('Failure/error:', 2))
  lines.push(indent(pc.red(failure.message), 4))
  if (failure.extraFailures > 0) {
    let plural = failure.extraFailures === 1 ? '' : 's'
    lines.push(indent(pc.dim(`(+${failure.extraFailures} more failed expectation${plural}, not shown)`), 4))
  }
  lines.push('')

  lines.push(indent('Stacktrace:', 2))
  for (let frame of failure.frames) lines.push(indent(pc.dim(frame), 4))

  if (verbose && failure.log && failure.log.length) {
    lines.push('')
    lines.push(indent('Browser log:', 2))
    for (let entry of failure.log) lines.push(indent(entry, 4))
  }

  if (verbose && failure.dom && failure.dom.length) {
    let outline = renderOutline(failure.dom)
    if (outline) {
      lines.push('')
      // Two different moments, and they must not look alike: a teardown snapshot is
      // taken after the other afterEach hooks ran, so #fixtures is already destroyed.
      let title = failure.domAt === 'teardown'
        ? 'HTML state (after teardown, since the spec failed while cleaning up):'
        : 'HTML state:'
      lines.push(indent(title, 2))
      lines.push(indent(outline, 4))
    }
  }

  if (failure.debugURL) {
    lines.push('')
    lines.push(indent('Debug in browser:', 2))
    lines.push(indent(pc.cyan(failure.debugURL), 4))
  }

  return lines.join('\n') + '\n'
}

// A problem with the run as a whole rather than with a spec: an incomplete run, or a
// filter that matched nothing. Printed after the summary, because the summary's counts
// are what make it puzzling ("0 failed" yet non-zero exit).
export function runProblem(message) {
  return pc.red(message) + '\n'
}

export function runSummary(counts, { verbose } = {}) {
  let hint = (counts.failed && !verbose)
    ? '\n\n' + pc.dim('Re-run with --verbose for browser logs and HTML state.')
    : ''
  return '\n' + formatCounts(counts, { always: true }) + hint + '\n'
}

function indent(text, spaces) {
  let pad = ' '.repeat(spaces)
  return String(text).split('\n').map((line) => pad + line).join('\n')
}
