// A stand-in for terser_worker.mjs that dies on its first job, in the way the job asks for.
import { parentPort } from 'node:worker_threads'

parentPort.on('message', ({ kind }) => {
  if (kind === 'exit') process.exit(3)
  if (kind === 'throw') setTimeout(() => { throw new Error('Worker blew up') })
  if (kind === 'ok') parentPort.postMessage({ result: { code: 'ok', map: null, keptNames: 0 } })
})
