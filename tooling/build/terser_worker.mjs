// One worker thread of the TerserPool in terser.mjs.
import { parentPort } from 'node:worker_threads'
import { minify } from 'terser'
import { minifyOptions, stripOptions } from './terser.mjs'

parentPort.on('message', async ({ kind, ecma, code, map, url }) => {
  try {
    let options = kind === 'minify' ? minifyOptions({ ecma }) : stripOptions({ ecma })
    // Chain esbuild's map, so the result still points into src/.
    let sourceMap = map ? { content: map, url } : false
    let result = await minify(code, { ...options, sourceMap })
    parentPort.postMessage({ result: { code: result.code, map: result.map || null } })
  } catch (error) {
    parentPort.postMessage({ error: String(error?.stack || error) })
  }
})
