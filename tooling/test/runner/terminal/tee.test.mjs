import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { teeToLogFile } from '../../../runner/terminal/tee.mjs'

// A stand-in for process.stdout that records what it was asked to write.
function fakeStream() {
  return { written: [], write(chunk) { this.written.push(String(chunk)); return true } }
}

function logFile() {
  return path.join(mkdtempSync(path.join(tmpdir(), 'unpoly-tee-')), 'test.log')
}

test('mirrors output to the log file while leaving the terminal untouched', async () => {
  let file = logFile()
  let out = fakeStream()

  let tee = teeToLogFile(file, [out])
  out.write('64 passed, 1 failed\n')
  await tee.close()

  assert.deepEqual(out.written, ['64 passed, 1 failed\n'])
  assert.equal(readFileSync(file, 'utf8'), '64 passed, 1 failed\n')
})

test('strips colour codes from the log but not from the terminal', async () => {
  let file = logFile()
  let out = fakeStream()
  let red = `\x1b[31mF1) up.Params\x1b[39m\n`

  let tee = teeToLogFile(file, [out])
  out.write(red)
  await tee.close()

  assert.deepEqual(out.written, [red])
  assert.equal(readFileSync(file, 'utf8'), 'F1) up.Params\n')
})

test('restores the original write function on close', async () => {
  let file = logFile()
  let out = fakeStream()
  let original = out.write

  let tee = teeToLogFile(file, [out])
  assert.notEqual(out.write, original)
  await tee.close()

  assert.equal(out.write, original)
  // Writing after close reaches the terminal only.
  out.write('later\n')
  assert.equal(readFileSync(file, 'utf8'), '')
})
