// Parses a (source-map-remapped) stack trace string into frames, filters them for
// compact vs verbose display, and renders "file:line in fn()" lines.
//
// Jasmine's ExceptionFormatter already collapses its own internal frames to a
// "<Jasmine>" marker before we ever see the stack, so the verbose view shows
// "<jasmine internals>" rather than real node_modules/jasmine paths.

export function parseFrames(stack) {
  if (!stack) return []
  return stack.split('\n').map(parseFrame)
}

function parseFrame(rawLine) {
  let text = rawLine.trim()
  if (!text) return { raw: rawLine, other: true }
  if (text === 'at <Jasmine>' || text === '<Jasmine>') return { raw: rawLine, jasmine: true }

  // "at fn (file:line:col)"  or  webkit "fn@file:line:col"
  let match =
    /^at (.+?) \((.+?):(\d+):(\d+)\)$/.exec(text) ||
    /^(.+?)@(.+?):(\d+):(\d+)$/.exec(text)
  if (match) return frame(rawLine, match[1], match[2], match[3], match[4])

  // "at file:line:col" (no function)
  match = /^at (.+?):(\d+):(\d+)$/.exec(text)
  if (match) return frame(rawLine, null, match[1], match[2], match[3])

  return { raw: rawLine, other: true } // message or unrecognized line
}

function frame(raw, func, file, line, col) {
  return {
    raw,
    func: func || null,
    file,
    line: Number(line),
    col: Number(col),
    nodeModules: /(^|\/)node_modules\//.test(file),
    spec: /(^|\/)spec\//.test(file),
    src: /(^|\/)src\//.test(file),
  }
}

export function filterFrames(frames, { verbose } = {}) {
  let real = frames.filter((f) => !f.other)
  if (verbose) return real

  // Compact: just the two most useful lines — the topmost frame in a spec file
  // (which test failed) and the topmost frame in src/ (where in Unpoly it
  // originated). Either may be absent (e.g. a plain expectation failure has only
  // a spec frame). Shown spec-first.
  let spec = real.find((f) => f.spec)
  let src = real.find((f) => f.src)
  let out = []
  if (spec) out.push(spec)
  if (src && src !== spec) out.push(src)
  return out
}

export function formatFrame(f) {
  if (f.jasmine) return '<jasmine internals>'
  let named = f.func && !/<?anonymous>?/.test(f.func)
  let where = named ? `${f.func}()` : 'anonymous function'
  return `${f.file}:${f.line} in ${where}`
}

export function formatStack(stack, { verbose } = {}) {
  return filterFrames(parseFrames(stack), { verbose }).map(formatFrame)
}
