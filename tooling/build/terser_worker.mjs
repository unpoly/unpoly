// One worker thread of the TerserPool in terser.mjs.
import { parentPort } from 'node:worker_threads'
import { minify } from 'terser'
import { minifyOptions, stripOptions } from './terser.mjs'
import { dropNeedlessNames } from './names.mjs'

parentPort.on('message', async ({ kind, ecma, code, map, url }) => {
  try {
    let options = kind === 'minify' ? minifyOptions({ ecma }) : stripOptions({ ecma })
    let trimmed = dropNeedlessNames(code, map)
    // Chain esbuild's map, so the result still points into src/.
    let sourceMap = trimmed.map ? { content: trimmed.map, url } : false
    let result = await minify(trimmed.js, { ...options, sourceMap })
    parentPort.postMessage({ result: { code: result.code, map: result.map || null } })
  } catch (error) {
    parentPort.postMessage({ error: String(error?.stack || error) })
  }
})
