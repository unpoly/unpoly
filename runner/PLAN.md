# Terminal spec runner — implementation plan

## Abstract

A single, beautiful terminal format for the Unpoly spec suite that serves humans,
agents, and CI equally, with a `--verbose` detail level for focused work. The
invariant: **the browser posts data (JSON-simple values only); Node does all
layout/formatting.** This makes the formatter a pure function covered by a fast,
zero-dependency `node:test` suite in `runner/test/`, independent of the 4000-spec
run.

All machinery lives in a top-level, feature-cohesive `runner/` (`server/`,
`terminal/`, `test/`); `bin/test`, `bin/ci`, `bin/test-server` are extensionless
thin wrappers. The runner is a *client* of an already-running dev environment: it
**assumes a server** (probes it, errors if absent) and, in dev, **assumes the
watcher** (waits on a build-status signal so an agent never tests stale code). CI
is separate and self-contained (`bin/ci`, built by `build-ci`, boots its own
server). No behavior branches on `CI=true`. Config is one schema readable from
env, query, or CLI flags. Browser↔Node coupling is one binding
(`window.__postToTerminal`) plus one lifecycle event (`specs:reset`).

## Resolved decisions

- **Folder**: `runner/` (top-level). Self-tests in `runner/test/`.
- **Single format** + `--verbose` detail toggle. `output` enum and the `Formatter`
  polymorphism are removed. `--verbose` (flag) / `VERBOSE=1` (env) — NOT `DEBUG`,
  which clashes with the `debug` npm package and the CI `DEBUG=puppeteer:*` usage.
- **Browser posts maximal JSON; Node formats.** Logs are serialized to strings in
  the browser (values are live there); everything else is data.
- **All runner code in `runner/`**, incl. the browser poster and the webpack
  plugin. Where another tree needs it, use a thin stub (not symlinks):
  `spec/helpers/terminal_reporter.js` is a 1-line `import` of
  `runner/terminal/poster.js` so `require.context` bundles it.
- **Lifecycle**: assume a running server (probe, error if absent). Dev waits on the
  watcher via `tmp/build-status.json`; CI (`bin/ci`) boots its own server and skips
  the wait. Never branch on `CI`.
- **Config** readable from env / query / **CLI** (`Config.fromArgv`, `--key=value`,
  CLI > env > default, strict on unknown flags). Tiny tokenizer, not `util.parseArgs`.
- **`bin/` wrappers** are extensionless executables (shebang + `chmod +x`), relying
  on Node 22's default extensionless-ESM detection (no `type:module`, which would
  break the CommonJS webpack configs). `runner/**` stays `.mjs`.
- **Transient files** (`build-status.json`, any `.pid`) live in the gitignored `tmp/`.
- **`webpack/test.js` and the `build-test` script are deleted** — the runner never
  builds; dev uses the watcher, CI uses `build-ci`.
- HTML state uses **CSS-selector notation** (`#id.class[attr="v"]`, `div` implied
  when anchored), Haml only inspired the indentation. Module: `dom_outline.mjs`.

## Data flow

```
browser (webpack bundle)
  Jasmine ─► runner/terminal/poster.js (bundled via spec/helpers/terminal_reporter.js stub)
     • Jasmine reporter → posts jasmineStarted/suiteStarted/specDone/suiteDone/jasmineDone
     • up.log.config.format = false (Unpoly logs arrive as "[cat] message")
     • wraps console.* → serializes args (runner/terminal/log_value.mjs), buffers per spec
     • on `specs:reset` (from reset_up.js): snapshot DOM→tree, close log buffer
                 │ window.__postToTerminal(event)   // JSON-simple values only
                 ▼
Node (runner/terminal)
  run.mjs       orchestration: preflight → puppeteer → wire → watchdog → exit
  receiver.mjs  stateful: group tracking, live progress, collect failures, drive formatter
  source_map.mjs remap bundle→source (async)
  stack.mjs     parse/filter/format frames
  dom_outline.mjs DOM-tree → CSS-selector outline
  formatter.mjs PURE: progress line / failure block / summary
  log_value.mjs PURE-ish: console arg serialization + substitution (shared w/ poster)

webpack --watch (development.js) ─► build_status.mjs plugin ─► tmp/build-status.json
run.mjs (dev) ── build_sync.mjs waits until fresh ◄──────────────┘
```

## Contracts

### window.__postToTerminal(event) — JSON-simple values only

| type | fields |
|------|--------|
| jasmineStarted | totalSpecs |
| suiteStarted | description |
| suiteDone | description, failedExpectations[] |
| specDone | fullName, description, status, failedExpectations[], pendingReason?, failure? |
| jasmineDone | overallStatus, totalTime, incompleteReason?, failedExpectations[] |

- failedExpectations[]: `{ message, matcherName, stack }` (raw stack; Node remaps).
- failure (only when failed): `{ log: string[], dom: DomNode[] }` (log lines already
  serialized; dom is a tree, not HTML).
- DomNode: `{ tag, id, classes[], attrs{}, children:(DomNode|{text})[] }`.
- Node derives top-level groups from suiteStarted/suiteDone depth (depth 1 = group).

### specs:reset (browser CustomEvent)
Dispatched by reset_up.js at the top of its afterEach, before teardown (present
tense = before). poster.js listens → snapshot DOM for a failed spec, close log buffer.

### tmp/build-status.json (webpack → runner)
`{ pid, state:"building"|"idle", startedAt, finishedAt|null, hash }`. Single shared
plugin instance counts in-flight sub-compilers, so `idle` means *all* current
rebuilds finished (no partial-read race). Reader: `waitForFreshBuild` errors if the
file is missing or the pid is dead; else waits until `idle && startedAt >= newestSourceMtime`.

## Output

Normal: per-top-level-group progress line (`up.layer .....F... 8 passed, 1 failed`),
then a numbered failure list (message + compact stack + deep-link), then a run
summary. Compact stack drops `node_modules/**` frames; renders `path:line in fn()`.

`--verbose` adds per failure: full stack, Browser log, and HTML state as a
CSS-selector outline.

Deep-link built Node-side: `serverURL + '/specs?spec=' + encodeURIComponent(fullName)`.

## Logs & value serialization

The poster wraps `console.*`, serializes each call to a string via `log_value.mjs`
(supports `%s/%o/%d/%c` substitution; serializes arrays/objects/elements; circular
→ `(circular structure)`; truncated ~200 chars), buffers per spec, closes on
`specs:reset`. Only strings cross the transport. Documented for agents in AGENTS.md.

## Lifecycle

- `bin/test` → `runDev(argv, env)`: probe server (else exit 3) → `waitForFreshBuild`
  (else exit 4) → puppeteer → receiver → exit 0/1.
- `bin/ci` → `runCI(argv, env)`: boot own server, skip the build wait, run against
  `build-ci` artifacts.
- Exit codes: 0 pass · 1 fail · 2 runner timeout · 3 no server · 4 watcher missing/stale.
- Both extensionless executables; `--verbose`/`VERBOSE` toggles detail.

## Self-tests (runner/test/, node:test, NO_COLOR)

- formatter/stack/dom_outline: progress line, compact vs verbose failure block,
  stack filtering (`node_modules` dropped), CSS-selector outline, summary.
- agent-inserted debug: `failure.log` line appears in verbose output, not compact;
  `log_value` substitution + object/circular/element serialization.
- config: fromArgv/fromProcessEnv precedence, unknown-flag error, toCSPHeader,
  distFilenames; server integration test (start express, fetch /specs with
  csp/es6/min/migrate, assert header + script tags) — no browser.
- build_sync: dead pid / missing file / stale / fresh / timeout (injected clock).
- receiver: canned event arrays → captured output + exit code.

## Removals & CI

Delete `webpack/test.js`, the `build-test` script, the `output` enum, the
`Formatter` polymorphism, and all `CI`/`SKIP_BUILD` branching in the runner. Add
`BuildStatusPlugin` to `webpack/development.js`. CI workflow: `npm ci` →
`npm run build-ci` → `node bin/ci`.

## Sequence

0. Restructure (move server/config into runner/, extensionless bins) — done first.
1. Pure modules + baseline tests.
2. New format (formatter/dom_outline/receiver), TDD.
3. Config (fromArgv, distFilenames) + config/server tests.
4. Poster rework + `specs:reset`.
5. Build sync (plugin + reader + development.js + tmp/).
6. Wrappers + preflight; delete test.js/output/Formatter; update workflow.
7. Docs + full-suite gate.
