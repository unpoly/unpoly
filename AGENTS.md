# Notes for AI coding agents

Read [`README.md` → Running tests](README.md#running-tests) for the actual workflow —
`bin/test`, filtering with `--spec`, `--verbose`, the auto-started dev environment,
the failure report, and options. This file only adds agent-specific guidance and a
map of the runner internals.

## Iterating

- **Filter while you work.** After editing `src/unpoly/form.js` (or its spec), run
  `bin/test --spec="up.form"`. The full suite runs in a real browser and takes
  several minutes.
- **Run the full suite (`npm test`, no filter) only as a final gate** — after a
  major change and once no human review is pending. CI runs the full matrix on push
  regardless, so it's rarely worth your minutes mid-task.
- A preflight failure (exit `3`/`4`) means the dev environment couldn't start or the
  build didn't refresh — a setup problem, not a spec failure.

## Debugging

Prefer instrumenting over stepping: add a `console.log` / `console.debug` in a spec
or in `src/unpoly` and re-run with `--verbose` — it shows up in the failure's browser
log (objects, arrays and DOM elements are serialized; `%s`/`%o` substitution works).
When you genuinely need DevTools, open the `Debug in browser:` URL from a failing run
(a Chrome MCP can drive it) — don't try to step-debug the headless browser.

## How it fits together (for changing the runner itself)

All runner code lives in `runner/`. The invariant: **the browser posts data
(JSON-simple values); Node does all formatting** — which keeps the formatter pure and
fast to test.

- `runner/terminal/run.mjs` — orchestration (`runDev`/`runCI`): preflight, Puppeteer,
  wiring, exit codes.
- `runner/terminal/receiver.mjs` — turns posted events into live progress + a
  collected failure list; drives the formatter.
- `runner/terminal/formatter.mjs`, `dom_outline.mjs`, `stack.mjs`, `log_value.mjs`,
  `urls.mjs` — **pure** helpers (covered by `runner/test/`, run with
  `npm run self-test-runner`). `log_value` runs in the browser but is unit-tested in Node.
- `runner/terminal/source_map.mjs` — remaps stacks to original source.
- `runner/terminal/build_status.mjs` / `build_sync.mjs` — the watcher writes
  `tmp/build-status.json`; the runner waits on it so it never tests stale code.
- `runner/terminal/poster.js` + `dom_snapshot.js` — run in the **browser** (bundled
  via the stub `spec/helpers/terminal_reporter.js`): post structured events over
  `window.__postToTerminal` and snapshot the DOM on the `specs:reset` event.
- `runner/server/` — the Express server and EJS runner page.
- `runner/config.mjs` — the config schema (env / query / `--argv`).
- `runner/dev_env.mjs` — start/stop the background dev environment (foreman +
  `Procfile.test`); `startDevEnv()` resolves once the first build + server are ready.
- `bin/test`, `bin/ci`, `bin/dev` — thin extensionless wrappers.

CI (`.github/workflows/test.yml`) runs `npm run build-ci` then `npm run test-ci`
(`bin/ci`), which boots its own server and skips the watcher wait.

## Repository conventions

- Source lives in `src/unpoly/`; each module `foo.js` has a spec `spec/unpoly/foo_spec.js`.
- Specs use both native DOM and jQuery (`$`), plus many custom matchers in `spec/helpers/`.
- Do not commit anything in `dist/` or `tmp/` — both are generated/gitignored.
- Ask before committing (per the maintainer's workflow).
