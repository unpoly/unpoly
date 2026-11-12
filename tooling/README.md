# Tooling

Our own development machinery: it runs the specs, builds the bundles and manages the dev
environment. None of it ships — the npm package contains only `unpoly*.js` and friends.
For *using* it (`bin/test`, filters, options, exit codes) see
[Testing](../docs/contributing/testing.md). This file is for *changing* it.

```
tooling/
  runner/       the spec runner, split by where the code runs (below)
  scratch/      the scratch server — real pages on port 4001 (own README)
  build/        bin/build (esbuild + Terser), the watcher, and the build-freshness protocol
  lint/         our own lint checks: an Oxlint plugin, api collision and doc file checks (bin/lint)
  docs/         extract_docs.mjs, which moves doc comments from .ts files into sibling .md files
  dev_env.mjs   the dev environment behind bin/dev
  find_spec.mjs spec-title search behind bin/find-spec and bin/test --file
  outline.mjs   Markdown sections with line ranges, behind bin/outline
  test/         self-tests for all of the above, mirroring this layout
```

The `bin/*` executables hold no logic; each is a shebang plus one import from here.


## The spec runner's invariant

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
runner/browser (bundled into dist/specs.js, runs in the page)
  Jasmine ─► poster.js  (bundled via the spec/helpers/terminal_reporter.js stub)
     • Jasmine reporter → posts jasmineStarted/suiteStarted/specDone/suiteDone/jasmineDone
     • wraps console.* → serializes args (log_value.mjs), buffers per spec
     • on `specs:reset`: snapshot DOM (dom_snapshot.js), close the log buffer
                 │ window.__postToTerminal(event)
                 ▼
runner/terminal (runs in Node, drives the browser)
  run.mjs         orchestration (runDev/runCI): preflight → puppeteer → wire → watchdog → exit
  receiver.mjs    stateful: group tracking, live progress, collect failures, drive formatter
  source_map.mjs  remap bundle positions → original source (async)
  formatter.mjs   PURE: progress line / failure block / summary
  stack.mjs       PURE: parse/filter/format frames
  dom_outline.mjs PURE: DOM tree → CSS-selector outline
  urls.mjs        PURE: spec deep-links etc.

build/ (runs in Node, one step removed from the runner)
bin/build --watch (build/watch.mjs, in rounds) ─► build/build_status.mjs writer ─► tmp/build-status.json
run.mjs (dev) ── build/build_sync.mjs waits until fresh ◄───────────────────────────────┘
```

`runner/browser/log_value.mjs` is the odd one: it runs in the browser but is a pure
function, so its tests live in Node with the rest.

- `runner/server/` — the Express server and the EJS runner page.
- `runner/config.mjs` — the one config schema, readable from env / query / `--argv`.
  `spec` and `file` are lists: repeating the flag appends, and Express parses a repeated
  `?spec=` into an array, so both ends agree without special cases. The `spec` filter is
  *applied* in the browser by `spec/helpers/spec_filter.js`, which replaces Jasmine's
  single-value regex filter with a verbatim match against any of the values.
  (`Config.fromArgv`, `--key=value`, CLI > env > default, strict on unknown flags).
- `find_spec.mjs` — PURE (except `readSources()`): parses the suite from `spec/specs.js` with acorn → every spec's real full name (`bin/find-spec`, `--file=path:line`, the spec manifest self-test).
  For an `extendDescribe()` it returns the blocks *below* it, so `--file` on an extracted
  file runs that file rather than its whole namespace.
- `dev_env.mjs` — the dev environment: one process table, one supervisor, one pid
  file (`tmp/dev.pid`). See [its own contract](#the-dev-environment) below.
- `scratch/` — the scratch server behind port 4001: real pages for trying a change by hand.
  Its own process, deliberately not a route on the spec server, which `bin/ci` boots. See
  [its README](scratch/README.md) and [Trying out changes](../docs/contributing/trying-out-changes.md).
- `test/` — the self-tests: `bin/self-test`.
- `bin/test`, `bin/ci`, `bin/dev`, `bin/find-spec`, `bin/outline`, `bin/update-contributing-tocs` — thin **extensionless** executables (shebang +
  `chmod +x`), relying on Node 22's extensionless-ESM detection. The package is
  deliberately *not* `type: module` (that would make Node and esbuild treat every `.js` file
  as an ES module, while most of `src/` and `spec/` are still scripts), so everything under
  `tooling/**` is `.mjs` — except the three browser files, where the extension is what picks
  the module system.

Where another tree needs tooling code, use a thin stub rather than a symlink:
`spec/helpers/terminal_reporter.js` is a one-line `import` of `runner/browser/poster.js`,
so the `require('./helpers/**/*.js')` glob in `spec/specs.js` picks it up.

## Contracts

### `window.__postToTerminal(event)` — JSON-simple values only

| type | fields |
|------|--------|
| `suiteStarted` | `description` |
| `suiteDone` | `description`, `failedExpectations[]` |
| `specDone` | `fullName`, `description`, `status`, `failedExpectations[]`, `failure?` |
| `jasmineDone` | `overallStatus`, `incompleteReason?`, `failedExpectations[]` |

- `failedExpectations[]`: `{ message, stack }` — raw stack, Node remaps it. On `jasmineDone`
  these belong to no spec (a top-level `afterAll` that threw) and are reported as their own
  failure, so a red run cannot print a green summary.
- `failure` (failed specs only): `{ log: string[], dom: DomNode[], domAt }`. Log lines are
  already serialized strings; `dom` is a tree, not HTML. `domAt` is `'failure'` for the
  usual snapshot taken at `specs:reset` — which, since specs stop at their first failed
  expectation, is the moment of the failure — or `'teardown'` for a spec that passed its
  expectations and then died while cleaning up (`Overlays survived reset!` and friends).
  A `'teardown'` snapshot is taken at `specDone`, after the other `afterEach` hooks have
  run, so `#fixtures` is already gone and the output says so.
- `DomNode`: `{ tag, id, classes[], attrs{}, children: (DomNode | { text })[] }`.
- `dom` is rooted at `<body>`, so it also captures elements a spec attached outside
  `#fixtures` and state Unpoly writes onto `body` itself. Jasmine's own
  `.jasmine_html-reporter` subtree is excluded — it renders every spec result and runs to
  thousands of nodes. A `MAX_NODES` budget (600, counting elements *and* text nodes)
  bounds the payload; if it clips, the producer appends a `{ text }` marker saying so
  rather than truncating silently.
- Node derives top-level groups from `suiteStarted`/`suiteDone` depth (depth 1 = group).

### `specs:reset` (browser `CustomEvent`)

Dispatched by `spec/helpers/reset_up.js` at the *top* of its `afterEach`, i.e. before
teardown, while the failure state is still on the page. `poster.js` listens and
snapshots the DOM for a failed spec, then closes the log buffer.

### `tmp/build-status.json` (watcher → runner)

`{ pid, state: "building" | "idle", startedAt, ok, errors }`. The watcher (`build/watch.mjs`)
watches the files itself and rebuilds in **rounds**: a round takes its `startedAt` before any
bundle reads a source, rebuilds every bundle that read a changed file, lints changed files in
`src/`, and only then writes `idle`. A change that arrives during a round starts another round
before `idle` is written. So `idle` means *every* bundle includes every edit the watcher has seen
(no partial-read race). esbuild's own per-context watchers could not promise that: each picks up
an edit on its own schedule, so all of them can be idle while one has not started on the edit yet.
`errors` is deduplicated, because the modern and es6 bundles report the same syntax error. `waitForFreshBuild` errors if the file is missing or the pid is dead, else waits
until `idle && startedAt >= newestSourceMtime`, then throws if `ok` is false;
`bin/dev status` reads the same two fields through `lastBuildErrors()`.

`newestSourceMtime` walks `src`, `spec` and `tooling/runner/browser`, counting only the
extensions a bundle can import (`WATCHABLE_SUFFIXES`, which also decides what makes the watcher
rebuild), plus every directory: a deleted or moved file changes no file's mtime, only its
directory's. The watcher in turn rebuilds everything when a directory appears, moves or vanishes.
It watches each directory on its own (`build/watch_tree.mjs`), not with Node's recursive
`fs.watch()`, which on Linux watches each file's inode and so went deaf to a file after its first
atomic save, Edit-tool write or `git checkout`. `tooling/runner/browser` is in because
`spec/helpers/terminal_reporter.js` imports `poster.js` from it, which pulls two more modules into
`dist/specs.js`; the rest of `tooling` runs in Node and can never be bundled. One self-test derives
the bundled set from the imports and fails if any of it moves outside a scanned directory; another
fails if `build/esbuild.mjs` loads an extension that isn't listed — the drift that would otherwise
stop those edits counting and run the suite against a stale bundle in silence.

An allowlist rather than a skip list, because a skip list only skips what someone remembered to
name: `src` alone holds 117 guide pages, an images tree of diagrams and recordings, and an
`.htaccess`, and any of them being the newest file used to make the predicate unsatisfiable, so
`bin/test` waited 30s and refused to run. `.mjs` is listed for `runner/browser/log_value.mjs`,
which is bundled; the Node-only `.mjs` files elsewhere in `tooling` are never scanned.

The watcher answers every change in these directories with a round, an empty one for a file no
bundle reads (a guide page, a swap file), so `startedAt` passes every mtime the runner can see. If
the watcher is still `idle` with an unchanged `startedAt` after 1s, it has missed a file event.
`waitForFreshBuild` then writes the newest file's path to `tmp/build-request`, which the watcher
watches, and the watcher rebuilds for it. `bin/test` names the file (`missedEdit`), since a watcher
that misses events deserves a look. A watcher that ignores the request (one started before requests
existed) gets a 3s grace, after which the run proceeds and reports `unbuiltEdit`. Under-scanning is
the failure that matters, and over-scanning cannot cause it. The 30s timeout now means only that a
build started and never finished.

**Only the watcher writes it**, which is what keeps it single-writer: one-shot builds
(`build/build.mjs`) never create a `BuildStatus`. Under webpack, `bin/build --config=ci` reused
the watcher's plugin and overwrote a running watcher's status with its own pid, and every reader
then concluded the environment was gone.

Transient files (`build-status.json`, `build-request`, any `.pid`, any `.log`) belong in the gitignored `tmp/`.

## Output

One format, with `--verbose` as a detail toggle — there is no `output` enum and no
`Formatter` polymorphism. (The flag is `--verbose` / `VERBOSE=1`, deliberately not
`DEBUG`, which clashes with the `debug` npm package and CI's `DEBUG=puppeteer:*`.)

Normal: a progress line per top-level group (`up.layer .....F... 8 passed, 1 failed`),
then a numbered failure list (message + compact stack + deep-link), then a summary.
The compact stack keeps just two frames — the topmost in a `spec/` file and the topmost
in `src/` — and renders them `path:line in fn()`. `--verbose` keeps every frame, and adds
the browser log plus the HTML state as a CSS-selector outline (`#id.class[attr="v"]`,
`div` implied when anchored).

## Lifecycle

- `bin/test` → `runDev(argv, env)`: require a filter or `--all` (else exit `5`) → ensure a
  dev environment (start it if needed, else exit `3`) → `waitForFreshBuild` (else exit `4`) →
  build the minified bundles if this run loads stale ones → confirm the bundles the page loads
  are in `dist` (else exit `4`) → puppeteer → receiver → exit 0/1.
  The watcher builds everything except the minified bundles, which is why that one build lives
  here. The `dist` check comes *after* the build wait, because `dist` is gitignored: before the
  watcher's first build everything is missing, and asking up front failed every fresh clone's
  first run.
  `bin/test` also mirrors everything it prints into `tmp/test.log` (colours stripped), so a
  truncated terminal never costs a run.
- `bin/ci` → `runCI(argv, env)`: boots its own server, skips the build wait, runs
  against `bin/build --config=ci` artifacts. CI workflow: `npm ci` (install) → `bin/build --config=ci` → `bin/ci`.
- Exit codes: `0` pass · `1` failures · `2` runner timeout (the watchdog fires when the
  receiver sees no event for 30s) · `3` no dev environment · `4` build stale, or a bundle
  the page loads is absent from `dist` · `5` bad config/flags, or an unfiltered run
  without `--all` · `6` build failed (compile/lint errors).

`up.log.config.format` deliberately stays at its default (`true`): some specs assert on
the exact `%c`-styled arguments Unpoly passes to `console.warn`/`debug`. The console
wrapper strips the `%c`/CSS while serializing, so the terminal output is clean anyway.

## The dev environment

`dev_env.mjs` owns the dev environment end to end — there is no Procfile and no
process manager. The rules, in one place:

- **One process table.** A process with a `cwd` lives in a sibling repository: it is
  skipped when that repository isn't checked out, and its death never takes the
  environment down. Everything else is required — if it exits, the environment stops.
- **One supervisor.** `spawnSupervisor()` runs `node tooling/dev_env.mjs`, which
  executes the table and prefixes each child's output with its name. `bin/dev` and
  `bin/test` spawn the identical supervisor; only its stdio differs (your terminal
  vs. `tmp/dev.log`).
- **One pid file.** Both start paths spawn the supervisor `detached`, so its pid *is*
  a process group id and `killGroup()` sweeps every descendant — `sh`, `npm`, esbuild,
  Ruby and all. `killGroup()` has no bare-pid fallback on purpose: that would signal
  one process, orphan the descendants, and report success. The supervisor removes
  `tmp/dev.pid` as it exits, so a wedged one stays reachable for a second
  `bin/dev stop`; a file left by a SIGKILLed one is inert (see below).
- **One log.** The supervisor writes `tmp/dev.log` itself rather than having its stdio
  redirected into it, so the log lands in the same place however the environment was
  started. It used to exist only on the background path, which made "read `tmp/dev.log`"
  advice that worked or not depending on who had started what — a coin flip a human shrugs
  off and an agent cannot. Every line goes to two sinks, because their readers differ: the
  terminal keeps colors, the file does not. Colors are for the human watching a build; in a
  file they only cost tokens and wreck field splitting — the label sits between the
  timestamp and the text, so `awk '{print $2}'` yields `\x1b[36mwatch` and an exact label
  match never fires. Only child text is stripped — our labels come in two variants, so we never
  colorize and undo it. Children are *asked* for colors (`FORCE_COLOR`) only when there is a
  terminal to show them on, and `NO_COLOR` still wins; they are piped, so otherwise they
  turn their own colors off and the build's coloured errors were being thrown away even with a
  human watching. `DEV_ENV_BACKGROUND` tells a background supervisor it has no terminal:
  without it, its terminal sink *is* the file its raw stdio points at, and every line lands
  twice (169 lines in each, measured). The timestamp comes from the supervisor, since
  third-party children cannot be made to agree on a format — WEBrick stamps its own, the
  build watcher stamps nothing — though it marks when the pipe delivered, not when the child spoke.
- **One port table.** `tooling/ports.mjs` owns all four (spec server, scratch, start lock,
  docs), and `PORT_OFFSET` moves them together so a second checkout can run its own
  environment. They are fixed numbers rather than derived from the checkout path because the
  guides quote them; an offset is opt-in, so the default checkout stays documented. Nothing
  else was shared — `tmp/dev.pid` and `tmp/build-status.json` are already anchored to the
  project root — which is why ports were the whole of the collision. A service that can read
  the table (our own two) is given no `PORT`; only middleman needs one passed in.
- **One decision about state**: `devEnvState()` → `running` · `booting` · `foreign` ·
  `unidentified` · `none`. Everything — `bin/dev`, `runDev()`, `stopDevEnv()` — asks it
  and switches on the answer. Nothing else reads `tmp/dev.pid`, and two rules make its
  answer trustworthy:
  - *A live pid proves nothing.* Pids get recycled, so the recorded pid must also
    still **be** a supervisor: a `node` process whose argv names this file. Without
    that an unrelated process inheriting our old pid made the environment look busy,
    and `killGroup()` would have signalled a stranger's whole group. Where we cannot
    read a command line at all (no `/proc`, no usable `ps`) the answer is `unidentified`
    rather than "absent" — we neither signal it nor start beside it, because guessing
    "not ours" would spawn a second environment next to a healthy one. A zombie is *not*
    one of those cases: its `/proc` entry reads empty, so it is a proven stranger, and
    starting beside something that holds no ports or files is right.
  - *Liveness is the server's socket*, which the OS closes when the process dies — it
    cannot go stale or be forged. `build-status.json` is deliberately **not** consulted
    here: any one-shot build could overwrite it and make a healthy environment look
    dead. (`waitForFreshBuild()` still reads the watcher pid from it, for freshness
    rather than for existence.)
- **One start lock.** `withStartLock()` holds a listening socket on `START_LOCK_PORT`
  for the whole of `startUnderLock()` — probe, clear a leftover, claim, spawn, **write
  the pid** — so `bin/dev` and `bin/test` fired together cannot both get through; the
  loser is told the port is taken. A socket is the only lock available without a
  dependency that the OS also *releases* for us, so it cannot outlive its holder and
  never needs recovering. Readiness is awaited *outside* the lock: by then the pid file
  names a live supervisor, so a later start sees `booting` and stops.

  The scope is the whole point, and three attempts got it wrong. Deciding a pid file is
  stale and then acting on it are two steps: an `O_EXCL` create alone let racers unlink
  each other's fresh claim, an atomic rename let them displace it, and holding the lock
  only until the claim was *returned* left the file empty — which reads as "nothing
  running", so a racer cleared the winner's own claim. `startUnderLock()` also asserts
  the file names its supervisor before returning. A self-test pins the invariant by
  failing if two bodies ever run at once.
- **One readiness check.** `startDevEnv()` resolves only once the watcher has
  finished a build it *started after the spawn* (so a stale `build-status.json`
  can't satisfy it) and the server answers. It rejects — killing what it started —
  if the supervisor dies first or `READY_TIMEOUT` passes.
- Being detached means Ctrl-C reaches `bin/dev`, not the supervisor, so `bin/dev`
  forwards the signal.

## Self-tests

`bin/self-test` (`node --test 'tooling/test/**/*.test.mjs'`, `NO_COLOR=1`) — no
browser, no build, runs in a second. Cover changes here rather than through the
suite. What's covered today:

- `formatter` / `stack` / `dom_outline` / `urls`: progress line, compact vs. verbose
  failure block, frame selection, selector outline, summary.
- `log_value`: `%s/%o/%d/%c` substitution, objects, circular structures, elements —
  including that an agent-inserted `console.log` reaches verbose output but not compact.
- `config`: `fromArgv`/`fromProcessEnv` precedence, unknown-flag error, CSP header,
  dist filenames. Plus a `server` integration test (start Express, fetch `/specs` with
  csp/es6/min/migrate, assert headers + script tags).
- `run`: `missingDistFiles()` — which bundles a config actually loads (migrate only with
  `--migrate`), and that a watcher-built `dist` leaves nothing to report.
- `build_sync`: dead pid / missing file / stale / fresh / timeout, with an injected clock.
- `receiver`: canned event arrays → captured output + exit code.
- `scratch`: page resolution and the name guard, layout wrapping vs. pass-through, EJS locals
  and error positions, plus an Express instance with the build gate and log injected.
- `extract_docs`: the H1 for each kind of doc comment (by unpoly-site's title rules), the
  separators between entries, the notes on comments that may not move cleanly, and a round
  trip from comments to doc file and back.
- `dev_env`: the state machine, the start lock, pid-file identity — plus `createLog`: both
  sinks reached, escapes stripped from the file only, one timestamp shared by both lines,
  truncation per session, and `terminal: false` writing the file alone.
