// Mirrors everything a run prints into tmp/test.log, with the colour codes stripped - the same
// split tmp/dev.log uses: colour in your terminal, plain text in the file.
//
// The point is to make truncation harmless. The part you need from a red run is the failure
// block, and piping through `tail` used to cut it off and cost you the whole run again. Now the
// terminal is only a view: the full output is on disk either way.
import { createWriteStream, mkdirSync } from 'node:fs'
import path from 'node:path'
import { PROJECT_ROOT } from '../../build/build_status.mjs'

const ANSI = /\x1b\[[0-9;]*m/g

// Relative, because it is printed for a human to open.
export const LOG_FILE = 'tmp/test.log'

export function teeToLogFile(file = path.join(PROJECT_ROOT, LOG_FILE), targets = [process.stdout, process.stderr]) {
  mkdirSync(path.dirname(file), { recursive: true })
  // Truncating, not appending: the log is "the last run", the way `| tee` behaved.
  let stream = createWriteStream(file)
  let restore = []

  for (let target of targets) {
    // Keep the original property value, so close() puts the stream back exactly as it was
    // rather than leaving a bound wrapper on it forever.
    let original = target.write
    let write = original.bind(target)
    restore.push(() => { target.write = original })
    target.write = (chunk, ...rest) => {
      stream.write(String(chunk).replace(ANSI, ''))
      return write(chunk, ...rest)
    }
  }

  return {
    close() {
      for (let undo of restore) undo()
      return new Promise((resolve) => stream.end(resolve))
    }
  }
}
