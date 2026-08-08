# The spec runner

Everything that runs Unpoly's specs lives here. For *using* it (`bin/test`, filters,
options, exit codes) see [Testing](../docs/contributing/testing.md).
This file is for *changing* it.

## The invariant

**The browser posts data (JSON-simple values only); Node does all
layout/formatting.** So the formatter stays a pure function, covered by a fast
`node:test` suite that doesn't need the 4000-spec run.

Two more rules that keep the seams thin:

- Browser↔Node coupling is exactly one binding (`window.__postToTerminal`) plus one
  lifecycle event (`specs:reset`).
- **Nothing branches on `CI=true`.** Dev and CI are separate entry points
  (`bin/test` / `bin/ci`) that differ in their preflight, not in their behavior.

## Modules

```
browser (webpack bundle)
  Jasmine ─► terminal/poster.js  (bundled via the spec/helpers/terminal_reporter.js stub)
     • Jasmine reporter → posts jasmineStarted/suiteStarted/specDone/suiteDone/jasmineDone
     • wraps console.* → serializes args (terminal/log_value.mjs), buffers per spec
     • on `specs:reset`: snapshot DOM (terminal/dom_snapshot.js), close the log buffer
                 │ window.__postToTerminal(event)
                 ▼
Node (runner/terminal)
  run.mjs         orchestration (runDev/runCI): preflight → puppeteer → wire → watchdog → exit
  receiver.mjs    stateful: group tracking, live progress, collect failures, drive formatter
  source_map.mjs  remap bundle positions → original source (async)
  formatter.mjs   PURE: progress line / failure block / summary
  stack.mjs       PURE: parse/filter/format frames
  dom_outline.mjs PURE: DOM tree → CSS-selector outline
  urls.mjs        PURE: spec deep-links etc.
  log_value.mjs   PURE: console arg serialization (runs in the browser, unit-tested in Node)

webpack --watch (webpack/development.js) ─► terminal/build_status.mjs plugin ─► tmp/build-status.json
run.mjs (dev) ── terminal/build_sync.mjs waits until fresh ◄────────────────────┘
```

- `server/` — the Express server and the EJS runner page.
- `config.mjs` — the one config schema, readable from env / query / `--argv`
  (`Config.fromArgv`, `--key=value`, CLI > env > default, strict on unknown flags).
- `dev_env.mjs` — the dev environment: one process table, one supervisor, one pid
  file (`tmp/dev.pid`). See [its own contract](#the-dev-environment) below.
- `test/` — the self-tests: `npm run self-test-runner`.
- `bin/test`, `bin/ci`, `bin/dev` — thin **extensionless** executables (shebang +
  `chmod +x`), relying on Node 22's extensionless-ESM detection. The package is
  deliberately *not* `type: module` (that would break the CommonJS webpack configs),
  so everything under `runner/**` is `.mjs`.

Where another tree needs runner code, use a thin stub rather than a symlink:
`spec/helpers/terminal_reporter.js` is a one-line `import` of `terminal/poster.js`,
so webpack's `require.context` picks it up.

## Contracts

### `window.__postToTerminal(event)` — JSON-simple values only

| type | fields |
|------|--------|
| `jasmineStarted` | `totalSpecs` |
| `suiteStarted` | `description` |
| `suiteDone` | `description`, `failedExpectations[]` |
| `specDone` | `fullName`, `description`, `status`, `failedExpectations[]`, `pendingReason?`, `failure?` |
| `jasmineDone` | `overallStatus`, `totalTime`, `incompleteReason?`, `failedExpectations[]` |

- `failedExpectations[]`: `{ message, matcherName, stack }` — raw stack, Node remaps it.
- `failure` (failed specs only): `{ log: string[], dom: DomNode[] }`. Log lines are
  already serialized strings; `dom` is a tree, not HTML.
- `DomNode`: `{ tag, id, classes[], attrs{}, children: (DomNode | { text })[] }`.
- Node derives top-level groups from `suiteStarted`/`suiteDone` depth (depth 1 = group).

### `specs:reset` (browser `CustomEvent`)

Dispatched by `spec/helpers/reset_up.js` at the *top* of its `afterEach`, i.e. before
teardown, while the failure state is still on the page. `poster.js` listens and
snapshots the DOM for a failed spec, then closes the log buffer.

### `tmp/build-status.json` (webpack → runner)

`{ pid, state: "building" | "idle", startedAt, finishedAt | null, hash }`. A single
shared plugin instance counts in-flight sub-compilers, so `idle` means *all* current
rebuilds finished (no partial-read race). `waitForFreshBuild` errors if the file is
missing or the pid is dead, else waits until `idle && startedAt >= newestSourceMtime`.

Transient files (`build-status.json`, any `.pid`) belong in the gitignored `tmp/`.

## Output

One format, with `--verbose` as a detail toggle — there is no `output` enum and no
`Formatter` polymorphism. (The flag is `--verbose` / `VERBOSE=1`, deliberately not
`DEBUG`, which clashes with the `debug` npm package and CI's `DEBUG=puppeteer:*`.)

Normal: a progress line per top-level group (`up.layer .....F... 8 passed, 1 failed`),
then a numbered failure list (message + compact stack + deep-link), then a summary.
The compact stack drops `node_modules/**` frames and renders `path:line in fn()`.
`--verbose` adds the full stack, the browser log, and the HTML state as a
CSS-selector outline (`#id.class[attr="v"]`, `div` implied when anchored).

## Lifecycle

- `bin/test` → `runDev(argv, env)`: ensure a dev environment (start it if needed, else
  exit `3`) → `waitForFreshBuild` (else exit `4`) → puppeteer → receiver → exit 0/1.
  The runner never builds; dev relies on the watcher.
- `bin/ci` → `runCI(argv, env)`: boots its own server, skips the build wait, runs
  against `npm run build-ci` artifacts. CI workflow: `npm ci` → `build-ci` → `bin/ci`.
- Exit codes: `0` pass · `1` failures · `2` runner timeout (the watchdog fires when the
  receiver sees no event for 30s) · `3` no dev environment · `4` build stale ·
  `5` bad config/flags.

`up.log.config.format` deliberately stays at its default (`true`): some specs assert on
the exact `%c`-styled arguments Unpoly passes to `console.warn`/`debug`. The console
wrapper strips the `%c`/CSS while serializing, so the terminal output is clean anyway.

## The dev environment

`dev_env.mjs` owns the dev environment end to end — there is no Procfile and no
process manager. The rules, in one place:

- **One process table.** A process with a `cwd` lives in a sibling repository: it is
  skipped when that repository isn't checked out, and its death never takes the
  environment down. Everything else is required — if it exits, the environment stops.
- **One supervisor.** `spawnSupervisor()` runs `node runner/dev_env.mjs`, which
  executes the table and prefixes each child's output with its name. `bin/dev` and
  `bin/test` spawn the identical supervisor; only its stdio differs (your terminal
  vs. `tmp/dev.log`).
- **One pid file.** Both start paths spawn the supervisor `detached`, so its pid *is*
  a process group id and `killGroup()` sweeps every descendant — `sh`, `npm`, webpack,
  Ruby and all. `killGroup()` has no bare-pid fallback on purpose: that would signal
  one process, orphan the descendants, and report success. The parent writes
  `tmp/dev.pid` (the caller needs the pid at once) and the supervisor removes it as
  it exits — so a wedged supervisor stays reachable for a second `bin/dev stop`. A
  file left by a SIGKILLed one is harmless.
- **One definition of "running"**: `runningDevEnvPid()` — the spec server answers
  *and* the watcher is alive. It is what `bin/dev` and `runDev()` both ask. The pid
  file is never trusted on its own; `recordedPid()` reports only live pids.
- **One readiness check.** `startDevEnv()` resolves only once the watcher has
  finished a build it *started after the spawn* (so a stale `build-status.json`
  can't satisfy it) and the server answers. It rejects — killing what it started —
  if the supervisor dies first or `READY_TIMEOUT` passes, and refuses outright if
  another environment is already booting.
- Being detached means Ctrl-C reaches `bin/dev`, not the supervisor, so `bin/dev`
  forwards the signal.

## Self-tests

`npm run self-test-runner` (`node --test runner/test/*.test.mjs`, `NO_COLOR=1`) — no
browser, no build, runs in a second. Cover changes here rather than through the
suite. What's covered today:

- `formatter` / `stack` / `dom_outline` / `urls`: progress line, compact vs. verbose
  failure block, `node_modules` filtering, selector outline, summary.
- `log_value`: `%s/%o/%d/%c` substitution, objects, circular structures, elements —
  including that an agent-inserted `console.log` reaches verbose output but not compact.
- `config`: `fromArgv`/`fromProcessEnv` precedence, unknown-flag error, CSP header,
  dist filenames. Plus a `server` integration test (start Express, fetch `/specs` with
  csp/es6/min/migrate, assert headers + script tags).
- `build_sync`: dead pid / missing file / stale / fresh / timeout, with an injected clock.
- `receiver`: canned event arrays → captured output + exit code.
