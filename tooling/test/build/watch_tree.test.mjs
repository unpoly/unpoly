import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { watchTree } from '../../build/watch_tree.mjs'

// A real tree in a temp directory, watched for real: the bugs this guards against live in
// Node and inotify, not in our code.
function tree(t, files = {}) {
  let root = mkdtempSync(path.join(tmpdir(), 'watch-tree-'))
  for (let [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    writeFileSync(path.join(root, file), content)
  }
  let events = []
  let watcher = watchTree(root, (file, { directory }) => {
    events.push({ file: file && path.relative(root, file), directory })
  }, { skip: (name) => name === 'node_modules' })
  t.after(() => {
    watcher.close()
    rmSync(root, { recursive: true, force: true })
  })
  let at = (file) => path.join(root, file)
  // Resolves once an event for `file` arrives after this call, or fails after a second.
  let expectEvent = async (file, action) => {
    events.length = 0
    action()
    let deadline = Date.now() + 1000
    while (!events.some((event) => event.file === file)) {
      if (Date.now() > deadline) assert.fail(`no event for ${file} (got ${JSON.stringify(events)})`)
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
  return { root, at, events, watcher, expectEvent }
}

// What an atomic save does, and Claude Code's Edit tool: write a temp file, rename it over.
function replace(file, content) {
  writeFileSync(file + '.tmp', content)
  renameSync(file + '.tmp', file)
}

test('a file replaced on disk keeps reporting, every time', async (t) => {
  // The bug this fixes: Node's recursive fs.watch() lost the file with its old inode, so the
  // second save of a file went unnoticed.
  let { at, expectEvent } = tree(t, { 'sub/a.js': '0' })
  for (let i = 1; i <= 3; i++) {
    await expectEvent('sub/a.js', () => replace(at('sub/a.js'), String(i)))
  }
  await expectEvent('sub/a.js', () => writeFileSync(at('sub/a.js'), 'in place'))
})

test('a file deleted and recreated keeps reporting (git checkout)', async (t) => {
  let { at, expectEvent } = tree(t, { 'sub/a.js': '0' })
  await expectEvent('sub/a.js', () => { unlinkSync(at('sub/a.js')); writeFileSync(at('sub/a.js'), '1') })
  await expectEvent('sub/a.js', () => writeFileSync(at('sub/a.js'), '2'))
  await expectEvent('sub/a.js', () => { unlinkSync(at('sub/a.js')); writeFileSync(at('sub/a.js'), '3') })
})

test('a renamed directory is watched under its new name', async (t) => {
  let { at, events, watcher, expectEvent } = tree(t, { 'sub/a.js': '0' })
  await expectEvent('sub2', () => renameSync(at('sub'), at('sub2')))
  assert.ok(events.find((event) => event.file === 'sub').directory, 'the old name is reported as a directory')
  await expectEvent('sub2/a.js', () => writeFileSync(at('sub2/a.js'), '1'))
  assert.ok(!watcher.directories.includes(at('sub')), 'the old name is no longer watched')
})

test('a new directory is watched, nested ones too', async (t) => {
  let { at, events, expectEvent } = tree(t)
  await expectEvent('new', () => mkdirSync(at('new/deeper'), { recursive: true }))
  assert.ok(events.find((event) => event.file === 'new').directory)
  await new Promise((resolve) => setTimeout(resolve, 20))
  await expectEvent('new/deeper/a.js', () => writeFileSync(at('new/deeper/a.js'), '1'))
})

test('a directory deleted and recreated under the same name is watched again', async (t) => {
  let { at, expectEvent } = tree(t, { 'sub/a.js': '0' })
  await expectEvent('sub', () => {
    rmSync(at('sub'), { recursive: true })
    mkdirSync(at('sub'))
  })
  await new Promise((resolve) => setTimeout(resolve, 20))
  await expectEvent('sub/b.js', () => writeFileSync(at('sub/b.js'), '1'))
})

test('a root deleted and created again is watched again', async (t) => {
  // `rm -rf tmp` used to end the watch on tmp/ for good, and with it bin/test's rebuild requests.
  let { root, at, events, expectEvent } = tree(t, { 'sub/a.js': '0' })
  await expectEvent('', () => rmSync(root, { recursive: true }))
  assert.ok(events.find((event) => event.file === '').directory)
  await expectEvent('', () => mkdirSync(at('sub'), { recursive: true }))
  await new Promise((resolve) => setTimeout(resolve, 20))
  await expectEvent('sub/b.js', () => writeFileSync(at('sub/b.js'), '1'))
})

test('skipped directories are not watched', (t) => {
  let { at, watcher } = tree(t, { 'node_modules/x/a.js': '0', 'sub/a.js': '0' })
  assert.deepEqual(watcher.directories.sort(), [at(''), at('sub')].map((dir) => dir.replace(/\/$/, '')).sort())
})
