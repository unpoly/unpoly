import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, unlinkSync, watch, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { watchTree } from '../../build/watch_tree.mjs'

// A real tree in a temp directory, watched for real: the bugs this guards against live in
// Node and inotify, not in our code.
//
// The test fails when watchTree() leaves a watch open after close(). A watch it loses track of
// would otherwise keep the test runner waiting for ever instead of failing.
function tree(t, files = {}) {
  let root = mkdtempSync(path.join(tmpdir(), 'watch-tree-'))
  for (let [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    if (content.symlink) symlinkSync(path.join(root, content.symlink), path.join(root, file))
    else writeFileSync(path.join(root, file), content)
  }
  let events = []
  let open = new Set()
  let countingWatch = (dir, listener) => {
    let watcher = watch(dir, listener)
    open.add(watcher)
    let close = watcher.close.bind(watcher)
    watcher.close = () => { open.delete(watcher); close() }
    return watcher
  }
  let watcher = watchTree(root, (file, { directory }) => {
    events.push({ file: file && path.relative(root, file), directory })
  }, { skip: (name) => name === 'node_modules', watch: countingWatch })
  t.after(() => {
    watcher.close()
    let leaked = [...open]
    for (let fsWatcher of leaked) fsWatcher.close()
    rmSync(root, { recursive: true, force: true })
    assert.equal(leaked.length, 0, 'every watch is closed')
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

// A stand-in for fs.watch() whose watchers the test fires by hand, even after they were closed.
// `fail(dir)` may return an error to throw instead of watching.
function fakeWatch({ fail = () => null } = {}) {
  let watchers = []
  function watch(dir, listener) {
    let error = fail(dir)
    if (error) throw error
    let watcher = Object.assign(new EventEmitter(), {
      dir,
      closed: false,
      close() { this.closed = true },
      fire: (event, name) => listener(event, name),
    })
    watchers.push(watcher)
    return watcher
  }
  // The latest watcher for `dir`.
  let of = (dir) => watchers.findLast((watcher) => watcher.dir === dir)
  return { watch, of }
}

// A temp directory with these subdirectories, watched with a fakeWatch().
function fakeTree(t, dirs, options) {
  let root = mkdtempSync(path.join(tmpdir(), 'watch-tree-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (let dir of dirs) mkdirSync(path.join(root, dir), { recursive: true })
  let fake = fakeWatch(options)
  let events = []
  let errors = []
  let watcher = watchTree(root, (file, { directory }) => events.push({ file: file && path.relative(root, file), directory }), {
    watch: fake.watch,
    onError: (error, dir) => errors.push([error.code, path.relative(root, dir)]),
  })
  let at = (dir) => path.join(root, dir)
  return { root, at, events, errors, watcher, of: (dir) => fake.of(at(dir)) }
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

test('symlinked directories are not watched, whether they were there first or came later', async (t) => {
  // Like newestSource(). A link could also form a cycle.
  let { root, at, watcher, expectEvent } = tree(t, { 'real/a.js': '0', 'first': { symlink: 'real' } })
  await expectEvent('later', () => symlinkSync(at('real'), at('later')))
  assert.deepEqual(watcher.directories.sort(), [root, at('real')].sort())
})

test('skipped directories are not watched', (t) => {
  let { at, watcher } = tree(t, { 'node_modules/x/a.js': '0', 'sub/a.js': '0' })
  assert.deepEqual(watcher.directories.sort(), [at(''), at('sub')].map((dir) => dir.replace(/\/$/, '')).sort())
})

test('events from a watch that was dropped are ignored', (t) => {
  // A watch can still report after its directory was renamed away, under the old path, even when
  // a new directory of that name is watched by then.
  let { at, root, events, watcher, of } = fakeTree(t, ['sub'])
  let old = of('sub')
  renameSync(at('sub'), at('sub2'))
  of('').fire('rename', 'sub')
  of('').fire('rename', 'sub2')
  mkdirSync(at('sub'))
  of('').fire('rename', 'sub')
  assert.ok(old.closed)
  assert.deepEqual(watcher.directories.sort(), [root, at('sub'), at('sub2')].sort())

  events.length = 0
  old.fire('change', 'a.js')
  assert.deepEqual(events, [], 'the old watch says nothing')
  of('sub').fire('change', 'a.js')
  assert.deepEqual(events, [{ file: 'sub/a.js', directory: false }])
})

test('a directory that cannot be watched is reported, the others are watched', (t) => {
  // Out of inotify watches. Without the report, edits in it would silently not rebuild.
  let enospc = Object.assign(new Error('ENOSPC: System limit for number of file watchers reached'), { code: 'ENOSPC' })
  let { at, root, errors, watcher } = fakeTree(t, ['full', 'fine'], { fail: (dir) => dir.endsWith('full') ? enospc : null })
  assert.deepEqual(errors, [['ENOSPC', 'full']])
  assert.deepEqual(watcher.directories.sort(), [root, at('fine')].sort())
})

test('a watch that fails later is reported and dropped, unless its directory is gone', (t) => {
  let { at, root, errors, watcher, of } = fakeTree(t, ['a', 'b'])
  of('a').emit('error', Object.assign(new Error('EIO'), { code: 'EIO' }))
  assert.deepEqual(errors, [['EIO', 'a']])
  rmSync(at('b'), { recursive: true })
  of('b').emit('error', Object.assign(new Error('EPERM'), { code: 'EPERM' }))
  assert.deepEqual(errors, [['EIO', 'a']], 'the parent reports a directory that is gone')
  assert.deepEqual(watcher.directories, [root])
})
