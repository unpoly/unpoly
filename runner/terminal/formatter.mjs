// Pure formatting: turns the run model (built by receiver.mjs) into strings.
// No I/O, no Puppeteer, no state — so it's covered directly by runner/test/.
// Colors come from picocolors, which disables itself when stdout is not a TTY or
// NO_COLOR is set (the self-tests run with NO_COLOR).

import pc from 'picocolors'
import { renderOutline } from './dom_outline.mjs'

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
  for (let message of failure.messages) lines.push(indent(pc.red(message), 4))
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
      lines.push(indent('HTML state:', 2))
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
