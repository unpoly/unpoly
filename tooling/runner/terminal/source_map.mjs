// Remaps stack-trace frames from bundle positions (dist/specs.js:11887:34) back
// to original source (spec/unpoly/form_spec.js:877:9) using the .map files webpack
// emits next to each bundle. Async because SourceMapConsumer is async.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { SourceMapConsumer } from 'source-map'

// Matches the trailing "http://host:port/path:LINE:COL" of a stack frame.
const FRAME_RE = /(https?:\/\/\S+?):(\d+):(\d+)(?=[)\s]|$)/

export function createRemapper(projectRoot) {
  const consumers = new Map()

  async function consumerFor(urlPath) {
    if (consumers.has(urlPath)) return consumers.get(urlPath)
    let consumer = null
    try {
      const rawMap = JSON.parse(readFileSync(path.join(projectRoot, urlPath) + '.map', 'utf8'))
      consumer = await new SourceMapConsumer(rawMap)
    } catch {
      consumer = null
    }
    consumers.set(urlPath, consumer)
    return consumer
  }

  async function remapLine(line) {
    const match = line.match(FRAME_RE)
    if (!match) return line
    const [full, url, lineStr, colStr] = match
    let urlPath
    try { urlPath = new URL(url).pathname } catch { return line }
    const consumer = await consumerFor(urlPath)
    if (!consumer) return line
    // Stack columns are 1-based; source-map wants 0-based.
    const pos = consumer.originalPositionFor({ line: Number(lineStr), column: Number(colStr) - 1 })
    if (!pos || !pos.source) return line
    const source = pos.source.replace(/^webpack:\/\/[^/]*\//, '').replace(/^\.\//, '')
    return line.replace(full, `${source}:${pos.line}:${pos.column + 1}`)
  }

  async function remapStack(stack) {
    if (!stack) return stack
    const lines = await Promise.all(stack.split('\n').map(remapLine))
    return lines.join('\n')
  }

  return { remapStack }
}
