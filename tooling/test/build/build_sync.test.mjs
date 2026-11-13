import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { waitForFreshBuild, waitForTypeCheck, freshnessSources, newestSource, newestSourceMtime, WATCHABLE_SUFFIXES, SOURCE_DIRS, BuildSyncError, BuildFailedError } from '../../build/build_sync.mjs'
import { LOADED_EXTENSIONS } from '../../build/esbuild.mjs'

const noop = async () => {}

test('errors when there is no status file', async () => {
  await assert.rejects(
    waitForFreshBuild({ request: noop, read: () => null, newestMtime: 0, isAlive: () => true, sleep: noop }),
    BuildSyncError
  )
})

test('errors when the watcher pid is dead', async () => {
  await assert.rejects(
    waitForFreshBuild({ request: noop, read: () => ({ pid: 1, state: 'idle', startedAt: 100 }), newestMtime: 0, isAlive: () => false, sleep: noop }),
    /process is gone/
  )
})

test('resolves when idle and built after the latest edit', async () => {
  let status = await waitForFreshBuild({ request: noop,
    read: () => ({ pid: 1, state: 'idle', startedAt: 200 }),
    newestMtime: 100, isAlive: () => true, sleep: noop,
  })
  assert.equal(status.state, 'idle')
})

test('resolves when a fresh build reports ok:true', async () => {
  let status = await waitForFreshBuild({ request: noop,
    read: () => ({ pid: 1, state: 'idle', startedAt: 200, ok: true, errors: '' }),
    newestMtime: 100, isAlive: () => true, sleep: noop,
  })
  assert.equal(status.ok, true)
})

test('throws BuildFailedError carrying the errors when the fresh build failed', async () => {
  await assert.rejects(
    waitForFreshBuild({ request: noop,
      read: () => ({ pid: 1, state: 'idle', startedAt: 200, ok: false, errors: 'ERROR in ./src/unpoly/foo.js\nSyntaxError' }),
      newestMtime: 100, isAlive: () => true, sleep: noop,
    }),
    (error) => {
      assert.ok(error instanceof BuildFailedError)
      assert.match(error.errors, /SyntaxError/)
      return true
    }
  )
})

test('times out when the build stays older than the edit', async () => {
  let clock = 0
  await assert.rejects(
    waitForFreshBuild({ request: noop,
      read: () => ({ pid: 1, state: 'idle', startedAt: 50 }),
      newestMtime: 100, isAlive: () => true,
      now: () => (clock += 1000), sleep: noop, timeoutMs: 2000, idleGraceMs: Infinity,
    }),
    /didn't finish a build/
  )
})

test('the browser-side runner files the build compiles into the specs bundle are all scanned', () => {
  // tooling/ is scanned precisely because these reach dist/specs.js. Derive the set from the
  // imports rather than trusting a comment, and fail if any of it moves outside SOURCE_DIRS.
  const root = new URL('../../../', import.meta.url).pathname
  const entry = 'tooling/runner/browser/poster.js' // what spec/helpers/terminal_reporter.js pulls in

  const reachable = new Set()
  const visit = (relative) => {
    if (reachable.has(relative)) return
    reachable.add(relative)
    const source = readFileSync(path.join(root, relative), 'utf8')
    for (const [, target] of source.matchAll(/^import\s[^']*'(\.[^']+)'/gm)) {
      visit(path.join(path.dirname(relative), target))
    }
  }
  visit(entry)

  for (const file of reachable) {
    assert.ok(SOURCE_DIRS.some((dir) => file.startsWith(`${dir}/`)),
      `${file} reaches the specs bundle but lives outside the scanned directories (${SOURCE_DIRS.join(', ')})`)
  }
  assert.ok(reachable.size >= 3, 'expected poster.js and the two modules it imports')
})

test('a scan that finds nothing fails closed rather than reporting "fresh"', () => {
  assert.throws(() => newestSourceMtime('/nonexistent-checkout', ['src']), /No source files found/)
})


// --- Over-scanning, and the grace that pays for it -------------------------

// A fake checkout. `files` maps a relative path to an mtime in seconds, so a test can say which
// file is newest without sleeping. Its directories are older than every file.
function checkout(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'unpoly-src-'))
  const dirs = new Set()
  for (const [relative, seconds] of Object.entries(files)) {
    const full = path.join(root, relative)
    mkdirSync(path.dirname(full), { recursive: true })
    writeFileSync(full, '')
    utimesSync(full, seconds, seconds)
    for (let dir = path.dirname(full); dir !== root; dir = path.dirname(dir)) dirs.add(dir)
  }
  for (const dir of dirs) utimesSync(dir, 1, 1)
  return root
}

const idle = (startedAt, ok = true) => ({ pid: 1, state: 'idle', startedAt, ok })

test('only extensions a bundle can import count', () => {
  // The bug this replaced: every one of these used to make the freshness predicate
  // unsatisfiable, so bin/test waited 30s and refused to run. An allowlist ignores them, and
  // ignores the next file type nobody has thought of yet.
  const root = checkout({
    'src/unpoly/link.js': 1000,
    'src/unpoly/pages/closing-overlays.md': 2000,
    'src/unpoly/pages/images/render-lifecycle.xml': 2000,
    'src/unpoly-migrate/.htaccess': 2000,
    'spec/files/video.mp4': 2000,
  })
  try {
    assert.equal(newestSource(root, ['src', 'spec']).file, path.join('src', 'unpoly', 'link.js'))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('every extension that is an input does count', () => {
  const root = checkout({ 'src/a.js': 1000, 'src/b.sass': 2000, 'src/c.scss': 3000, 'src/d.css': 4000, 'src/e.js.erb': 5000, 'src/f.ts': 6000, 'src/g.mjs': 7000 })
  try {
    assert.equal(newestSource(root, ['src']).file, path.join('src', 'g.mjs'))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a bare .erb is not an input, because the erb plugin only loads /\\.js\\.erb$/', () => {
  const root = checkout({ 'src/a.js': 1000, 'src/template.erb': 2000 })
  try {
    assert.equal(newestSourceMtime(root, ['src']), 1000 * 1000)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a deleted or moved file counts, through its directory', () => {
  // Deleting spec/helpers/b.js changes no file's mtime. Only the directory's tells that a build
  // may be stale.
  const root = checkout({ 'spec/helpers/a.js': 1000, 'spec/helpers/b.js': 1000 })
  try {
    rmSync(path.join(root, 'spec/helpers/b.js'))
    utimesSync(path.join(root, 'spec/helpers'), 2000, 2000)
    let { mtime, file } = newestSource(root, ['spec'])
    assert.deepEqual({ mtime, file }, { mtime: 2000 * 1000, file: path.join('spec', 'helpers') })
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('WATCHABLE_SUFFIXES covers every extension the build loads', () => {
  // The guard on the one direction that bites silently: let the build load a new extension without
  // listing it here and those edits stop counting, so bin/test runs against a stale bundle
  // without saying so, and the dev watcher doesn't even rebuild. This fails instead.
  for (const extension of LOADED_EXTENSIONS) {
    assert.ok(WATCHABLE_SUFFIXES.includes(extension),
      `tooling/build/esbuild.mjs loads ${extension}, which is missing from WATCHABLE_SUFFIXES`)
  }
})

test('the browser-side runner directory is scanned, its Node-only siblings are not', () => {
  // poster.js and dom_snapshot.js are compiled into dist/specs.js, so they have to count. Nothing
  // else under tooling/ does, or every edit to the tooling itself would cost the grace period.
  const root = checkout({
    'src/a.js': 1000,
    'tooling/runner/browser/poster.js': 2000,
    'tooling/build/build_sync.mjs': 3000,
  })
  try {
    assert.equal(newestSource(root, SOURCE_DIRS).file, path.join('tooling', 'runner', 'browser', 'poster.js'))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('an idle watcher that never reacts means nothing needed building', async () => {
  // The bug this fixes: editing a guide page made the predicate unsatisfiable, so bin/test
  // waited out 30s and refused to run at all.
  let clock = 0
  const build = await waitForFreshBuild({ request: noop,
    read: () => idle(100),
    newestMtime: 200, newestFile: 'src/unpoly/pages/closing-overlays.md',
    isAlive: () => true, now: () => (clock += 1000), sleep: noop, idleGraceMs: 3000,
  })
  assert.equal(build.state, 'idle')
  // Named so the reader can judge: a guide page is fine, `unpoly/link.js` would not be.
  assert.equal(build.unbuiltEdit, 'src/unpoly/pages/closing-overlays.md')
})

test('it does not give up before the grace period', async () => {
  // The watcher needs a moment to notice a change; concluding "nothing is happening" too early
  // would run against the previous build for a file it really does consume.
  let clock = 0
  let reads = 0
  const build = await waitForFreshBuild({ request: noop,
    read: () => { reads++; return reads < 4 ? idle(100) : idle(300) },
    newestMtime: 200, isAlive: () => true,
    now: () => (clock += 400), sleep: noop, idleGraceMs: 3000,
  })
  assert.equal(build.startedAt, 300, 'should have waited for the real build')
  assert.equal(build.unbuiltEdit, undefined)
})

test('asks the watcher to rebuild when it does not react, and names the file it missed', async () => {
  // The backstop for a file event the watcher never got. Without it, bin/test ran against a stale
  // bundle after the grace period.
  let clock = 0
  let requests = []
  let status = idle(100)
  const build = await waitForFreshBuild({
    read: () => status,
    request: (file) => { requests.push([file, clock]); status = idle(clock + 20) },
    newestMtime: 200, newestFile: 'src/unpoly/link.ts',
    isAlive: () => true, now: () => (clock += 100), sleep: noop,
  })
  assert.deepEqual(requests.map(([files]) => files), [['src/unpoly/link.ts']])
  assert.ok(requests[0][1] >= 1000, 'asks only after giving the watcher a second')
  assert.equal(build.missedEdit, 'src/unpoly/link.ts')
  assert.equal(build.unbuiltEdit, undefined)
})

test('does not ask for a rebuild when the watcher reacts', async () => {
  let clock = 0
  let requests = 0
  let reads = 0
  const build = await waitForFreshBuild({
    read: () => (++reads < 5 ? idle(100) : idle(300)),
    request: () => requests++,
    newestMtime: 200, isAlive: () => true, now: () => (clock += 100), sleep: noop,
  })
  assert.equal(requests, 0)
  assert.equal(build.missedEdit, undefined)
})

test('a file from the future does not hold up the run once the requested build is done', async () => {
  // No build can ever start after its mtime. Waiting would end in the timeout.
  let clock = 0
  let status = idle(100)
  const build = await waitForFreshBuild({
    read: () => status,
    request: () => { status = idle(clock + 20) },
    newestMtime: 1e12, newestFile: 'src/unpoly/link.ts',
    isAlive: () => true, now: () => (clock += 100), sleep: noop,
  })
  assert.equal(build.unbuiltEdit, 'src/unpoly/link.ts')
  assert.ok(clock < 3000, `returned before the grace period (at ${clock})`)
})

test('a file from the future does not hold up the run when the watcher was still debouncing it', async () => {
  // The unlucky order: we are called within the watcher's debounce, so its round for the file
  // starts after we read the status. That round moves `startedAt`, but not past the mtime. We
  // used to take that as the watcher having reacted, never asked for a build, and timed out
  // after 30 s.
  let clock = 0
  let reads = 0
  let status = idle(100)
  const build = await waitForFreshBuild({
    read: () => { if (++reads === 2) status = idle(150); return status },
    request: () => { status = idle(clock + 20) },
    newestMtime: 1e12, newestFile: 'src/unpoly/link.ts',
    isAlive: () => true, now: () => (clock += 100), sleep: noop,
  })
  assert.equal(build.unbuiltEdit, 'src/unpoly/link.ts')
  assert.ok(clock < 3000, `returned before the grace period (at ${clock})`)
})

test('lists every source, newest first', () => {
  const root = checkout({ 'src/a.js': 3000, 'src/b.js': 2000, 'src/pages/x.md': 4000 })
  try {
    assert.deepEqual(newestSource(root, ['src']).sources.map(({ file }) => file), ['src/a.js', 'src/b.js', 'src', 'src/pages'])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

// A status from a watcher that tracks what it has seen (see BuildStatus).
const seenIdle = (startedAt, fullStartedAt, seen) => ({ ...idle(startedAt), fullStartedAt, seen })

test('a later round does not vouch for an edit the watcher never saw', async () => {
  // The bug this fixes: freshness was judged by `startedAt` alone, so any later round (another
  // file, an editor's swap file) hid a missed event, and the run went ahead against a stale bundle.
  let clock = 0
  let requests = []
  let status = seenIdle(300, 100, { 'src/unpoly/form.ts': 300, 'src/unpoly': 300 })
  const build = await waitForFreshBuild({
    read: () => status,
    request: (files) => {
      requests.push(files)
      status = seenIdle(clock, 100, { ...status.seen, 'src/unpoly/link.ts': clock })
    },
    sources: [{ file: 'src/unpoly/form.ts', mtime: 250 }, { file: 'src/unpoly', mtime: 250 }, { file: 'src/unpoly/link.ts', mtime: 200 }, { file: 'src/unpoly/util.ts', mtime: 50 }],
    isAlive: () => true, now: () => (clock += 100), sleep: noop,
  })
  assert.deepEqual(requests, [['src/unpoly/link.ts']])
  assert.equal(build.missedEdit, 'src/unpoly/link.ts')
})

test('a round that built everything vouches for every older edit', async () => {
  let requests = 0
  const build = await waitForFreshBuild({
    read: () => seenIdle(300, 300, {}),
    request: () => requests++,
    sources: [{ file: 'src/unpoly/link.ts', mtime: 250 }, { file: 'spec/helpers', mtime: 200 }],
    isAlive: () => true, sleep: noop,
  })
  assert.equal(requests, 0)
  assert.equal(build.missedEdit, undefined)
})

test('a seen file counts only for the edits before its round', async () => {
  // The watcher saw link.ts at 300, but it changed again at 400, and that event never came.
  let clock = 0
  let requests = []
  let status = seenIdle(300, 100, { 'src/unpoly/link.ts': 300 })
  const build = await waitForFreshBuild({
    read: () => status,
    request: (files) => { requests.push(files); status = seenIdle(clock, 100, { 'src/unpoly/link.ts': clock }) },
    sources: [{ file: 'src/unpoly/link.ts', mtime: 400 }],
    isAlive: () => true, now: () => (clock += 100), sleep: noop,
  })
  assert.deepEqual(requests, [['src/unpoly/link.ts']])
  assert.equal(build.missedEdit, 'src/unpoly/link.ts')
})

test('a build that starts but never settles still times out', async () => {
  let clock = 0
  await assert.rejects(
    waitForFreshBuild({ request: noop,
      read: () => ({ pid: 1, state: 'building', startedAt: 300, ok: true }),
      newestMtime: 200, isAlive: () => true,
      now: () => (clock += 1000), sleep: noop, timeoutMs: 5000,
    }),
    /didn't finish a build/
  )
})

test('a failed build is reported even when nothing rebuilt', async () => {
  // Otherwise a docs edit after a broken build would quietly run the suite against it.
  let clock = 0
  await assert.rejects(
    waitForFreshBuild({ request: noop,
      read: () => ({ pid: 1, state: 'idle', startedAt: 100, ok: false, errors: "TS1005: ';' expected." }),
      newestMtime: 200, isAlive: () => true,
      now: () => (clock += 1000), sleep: noop, idleGraceMs: 3000,
    }),
    BuildFailedError
  )
})

test('the timeout names the newest edit', async () => {
  let clock = 0
  await assert.rejects(
    waitForFreshBuild({ request: noop,
      read: () => ({ pid: 1, state: 'building', startedAt: 300, ok: true }),
      newestMtime: 200, newestFile: 'src/unpoly/link.js',
      isAlive: () => true, now: () => (clock += 1000), sleep: noop, timeoutMs: 5000,
    }),
    /newest edit: src\/unpoly\/link\.js/
  )
})

// --- waitForTypeCheck() --------------------------------------------------------

test('the type check is waited for until it is done', async () => {
  let reads = [
    { state: 'idle', types: { state: 'checking', startedAt: null, ok: null, errors: '' } },
    { state: 'idle', types: { state: 'done', startedAt: 300, ok: false, errors: 'src/a.ts\n  1:1  error  X' } },
  ]
  let result = await waitForTypeCheck({ read: () => reads.length > 1 ? reads.shift() : reads[0], sleep: noop })
  assert.deepEqual(result, { ok: false, errors: 'src/a.ts\n  1:1  error  X' })
})

test('a watcher that does not check types has no type check to wait for', async () => {
  // One started before the watcher could, which writes no `types`.
  assert.equal(await waitForTypeCheck({ read: () => ({ state: 'idle', ok: true }), sleep: noop }), null)
})

test('a type check that does not finish times out', async () => {
  let clock = { now: 0 }
  let result = await waitForTypeCheck({
    read: () => ({ state: 'idle', types: { state: 'checking' } }),
    now: () => clock.now,
    sleep: async (ms) => { clock.now += ms },
    timeoutMs: 1000,
  })
  assert.deepEqual(result, { timedOut: true })
})

test('a type check after a newer round in src/ is not reported', async () => {
  // An edit during the spec run, say: the check may include what the specs didn't test.
  let types = { state: 'done', startedAt: 250, ok: false, errors: 'X' }
  for (let status of [
    { startedAt: 200, fullStartedAt: 50, seen: { 'src/unpoly': 200, 'src/unpoly/link.ts': 200 } },
    { startedAt: 200, fullStartedAt: 50, seen: { 'tsconfig.json': 200 } },
    { startedAt: 200, fullStartedAt: 200, seen: {} },
  ]) {
    let result = await waitForTypeCheck({ builtAt: 100, root: '/project', read: () => ({ state: 'idle', ...status, types }), sleep: noop })
    assert.deepEqual(result, { outdated: true }, JSON.stringify(status))
  }
})

test('a type check after a newer round in spec/ is reported', async () => {
  // A spec save, or an editor's swap file. Turning real type errors into a notice would make the
  // run green.
  let result = await waitForTypeCheck({
    builtAt: 100,
    root: '/project',
    read: () => ({
      state: 'idle', startedAt: 200, fullStartedAt: 50,
      seen: { 'src/unpoly/link.ts': 100, 'spec/unpoly': 200, 'spec/unpoly/.link_spec.js.swp': 200 },
      types: { state: 'done', startedAt: 250, ok: false, errors: 'X' },
    }),
    sleep: noop,
  })
  assert.deepEqual(result, { ok: false, errors: 'X' })
})

test('a type check of the tested build is reported, although it started after the build', async () => {
  // It always does: the watcher checks types once a round's bundles are written.
  let result = await waitForTypeCheck({
    builtAt: 100,
    read: () => ({ state: 'idle', startedAt: 100, types: { state: 'done', startedAt: 150, ok: true, errors: '' } }),
    sleep: noop,
  })
  assert.deepEqual(result, { ok: true, errors: '' })
})

test('the tsconfigs count as sources to wait for, so a type check never uses the old settings', async (t) => {
  let root = mkdtempSync(path.join(tmpdir(), 'freshness-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(path.join(root, 'src'))
  writeFileSync(path.join(root, 'src/a.ts'), '')
  writeFileSync(path.join(root, 'tsconfig.core.json'), '{}')
  writeFileSync(path.join(root, 'tsconfig.json.bak'), '{}')
  utimesSync(path.join(root, 'tsconfig.core.json'), new Date(5_000_000), new Date(5_000_000))
  utimesSync(path.join(root, 'src/a.ts'), new Date(4_000_000), new Date(4_000_000))
  utimesSync(path.join(root, 'src'), new Date(4_000_000), new Date(4_000_000))

  let sources = freshnessSources(root)
  assert.deepEqual(sources.map(({ file }) => file), ['tsconfig.core.json', 'src', 'src/a.ts'])

  // A round that saw the source but not the tsconfig doesn't do.
  let requested = []
  let built = { pid: 1, state: 'idle', startedAt: 4_500_000, fullStartedAt: 0, seen: { src: 4_500_000, 'src/a.ts': 4_500_000 }, ok: true }
  let clock = { now: 0 }
  await waitForFreshBuild({
    sources, read: () => built, isAlive: () => true,
    now: () => clock.now, sleep: async (ms) => { clock.now += ms }, request: (files) => requested.push(files),
  })
  assert.deepEqual(requested, [['tsconfig.core.json']])
})
