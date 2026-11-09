import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TerserPool } from '../../build/terser.mjs'

const url = new URL('../fixtures/build/dying_worker.mjs', import.meta.url)

test('a worker that exits fails its job instead of leaving it pending', async () => {
  let pool = new TerserPool({ size: 1, url })
  try {
    await assert.rejects(pool.run({ kind: 'exit' }), /exited with code 3/)
    // The pool replaces the dead worker.
    assert.equal((await pool.run({ kind: 'ok' })).code, 'ok')
  } finally {
    await pool.close()
  }
})

test('a worker that throws outside its handler fails its job', async () => {
  let pool = new TerserPool({ size: 1, url })
  try {
    await assert.rejects(pool.run({ kind: 'throw' }), /Worker blew up/)
    assert.equal((await pool.run({ kind: 'ok' })).code, 'ok')
  } finally {
    await pool.close()
  }
})
