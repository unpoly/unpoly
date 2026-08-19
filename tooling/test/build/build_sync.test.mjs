import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { waitForFreshBuild, newestSource, newestSourceMtime, WATCHABLE_SUFFIXES, SOURCE_DIRS, BuildSyncError, BuildFailedError } from '../../build/build_sync.mjs'

const noop = async () => {}

test('errors when there is no status file', async () => {
  await assert.rejects(
    waitForFreshBuild({ read: () => null, newestMtime: 0, isAlive: () => true, sleep: noop }),
    BuildSyncError
  )
})

test('errors when the watcher pid is dead', async () => {
  await assert.rejects(
    waitForFreshBuild({ read: () => ({ pid: 1, state: 'idle', startedAt: 100 }), newestMtime: 0, isAlive: () => false, sleep: noop }),
    /process is gone/
  )
})

test('resolves when idle and built after the latest edit', async () => {
  let status = await waitForFreshBuild({
    read: () => ({ pid: 1, state: 'idle', startedAt: 200 }),
    newestMtime: 100, isAlive: () => true, sleep: noop,
  })
  assert.equal(status.state, 'idle')
})

test('resolves when a fresh build reports ok:true', async () => {
  let status = await waitForFreshBuild({
    read: () => ({ pid: 1, state: 'idle', startedAt: 200, ok: true, errors: '' }),
    newestMtime: 100, isAlive: () => true, sleep: noop,
  })
  assert.equal(status.ok, true)
})

test('throws BuildFailedError carrying the errors when the fresh build failed', async () => {
  await assert.rejects(
    waitForFreshBuild({
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
    waitForFreshBuild({
      read: () => ({ pid: 1, state: 'idle', startedAt: 50 }),
      newestMtime: 100, isAlive: () => true,
      now: () => (clock += 1000), sleep: noop, timeoutMs: 2000,
    }),
    /didn't finish a build/
  )
})

test('the browser-side runner files webpack compiles into the specs bundle are all scanned', () => {
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
// file is newest without sleeping.
function checkout(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'unpoly-src-'))
  for (const [relative, seconds] of Object.entries(files)) {
    const full = path.join(root, relative)
    mkdirSync(path.dirname(full), { recursive: true })
    writeFileSync(full, '')
    utimesSync(full, seconds, seconds)
  }
  return root
}

const idle = (startedAt, ok = true) => ({ pid: 1, state: 'idle', startedAt, ok })

test('only extensions webpack has a loader for count', () => {
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
  const root = checkout({ 'src/a.js': 1000, 'src/b.sass': 2000, 'src/c.scss': 3000, 'src/d.css': 4000, 'src/e.js.erb': 5000, 'src/f.ts': 6000 })
  try {
    assert.equal(newestSource(root, ['src']).file, path.join('src', 'f.ts'))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a bare .erb is not an input, because the loader tests /\\.js\\.erb$/', () => {
  const root = checkout({ 'src/a.js': 1000, 'src/template.erb': 2000 })
  try {
    assert.equal(newestSourceMtime(root, ['src']), 1000 * 1000)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('WATCHABLE_SUFFIXES covers every extension the webpack configs load', () => {
  // The guard on the one direction that bites silently: add a loader for a new extension without
  // listing it here and those edits stop counting, so bin/test runs against a stale bundle
  // without saying so. This fails instead.
  // Every extension a rule can match, not just one of them: `/\.(sass|scss)$/` has to have both
  // listed, or dropping one goes unnoticed because the other still matches the rule.
  const listed = new Set(WATCHABLE_SUFFIXES.flatMap((suffix) => suffix.slice(1).split('.')))
  const shared = readFileSync(new URL('../../build/webpack/shared.js', import.meta.url), 'utf8')
  for (const [, source] of shared.matchAll(/test:\s*\/(.+?)\/[gimsuy]*,/g)) {
    for (const [, extension] of source.matchAll(/([a-z][a-z0-9]*)/g)) {
      assert.ok(listed.has(extension),
        `tooling/build/webpack/shared.js loads .${extension} (/${source}/), which is missing from WATCHABLE_SUFFIXES`)
    }
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
  const build = await waitForFreshBuild({
    read: () => idle(100),
    newestMtime: 200, newestFile: 'src/unpoly/pages/closing-overlays.md',
    isAlive: () => true, now: () => (clock += 1000), sleep: noop, idleGraceMs: 3000,
  })
  assert.equal(build.state, 'idle')
  // Named so the reader can judge: a guide page is fine, `unpoly/link.js` would not be.
  assert.equal(build.unbuiltEdit, 'src/unpoly/pages/closing-overlays.md')
})

test('it does not give up before the grace period', async () => {
  // Webpack needs a moment to notice a change; concluding "nothing is happening" too early
  // would run against the previous build for a file it really does consume.
  let clock = 0
  let reads = 0
  const build = await waitForFreshBuild({
    read: () => { reads++; return reads < 4 ? idle(100) : idle(300) },
    newestMtime: 200, isAlive: () => true,
    now: () => (clock += 400), sleep: noop, idleGraceMs: 3000,
  })
  assert.equal(build.startedAt, 300, 'should have waited for the real build')
  assert.equal(build.unbuiltEdit, undefined)
})

test('a build that starts but never settles still times out', async () => {
  let clock = 0
  await assert.rejects(
    waitForFreshBuild({
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
    waitForFreshBuild({
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
    waitForFreshBuild({
      read: () => ({ pid: 1, state: 'building', startedAt: 300, ok: true }),
      newestMtime: 200, newestFile: 'src/unpoly/link.js',
      isAlive: () => true, now: () => (clock += 1000), sleep: noop, timeoutMs: 5000,
    }),
    /newest edit: src\/unpoly\/link\.js/
  )
})
