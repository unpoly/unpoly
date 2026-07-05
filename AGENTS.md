# Notes for AI coding agents

How to work effectively in the Unpoly repository as an automated agent. Humans
should read [`README.md`](README.md); this is the same information framed for an
edit → test → fix loop.

## The dev environment (auto-started)

Running specs needs a spec server + a build watcher. You don't have to manage them:
`bin/test` **starts them in the background automatically** if they aren't running
(first build ~15s), and reuses them on later runs. It prints a line telling you they
were left running; stop them with `bin/dev stop`. (`bin/dev` alone runs them in the
foreground.)

## Running the specs

Unpoly has ~4000 Jasmine specs that run in a **real browser** (they manipulate the
actual DOM and cannot run under jsdom). To verify a change:

```
bin/test --spec="up.form"      # or: SPEC="up.form" npm test
```

`bin/test` drives Chrome headlessly and prints one compact report. Before running it
**waits for the watcher to finish rebuilding your latest edit**, so you never test
stale code. Exit codes: `0` pass · `1` failures · `2` runner timeout · `3` couldn't
start the dev environment · `4` build didn't refresh in time.

Config is one schema, readable as `--flags` or env vars (CLI wins): `--spec`,
`--csp`, `--es6`, `--minify`, `--migrate`, `--browser`, `--headless`. Unknown flags
error (so typos are caught).

## Run only what you changed

**The full suite runs in a real browser and takes several minutes. Do not run it on
every change.** Filter to the related module — the top-level `describe` is named
after it:

```
bin/test --spec="up.form"      # after editing src/unpoly/form.js or its spec
```

If a change touches shared behaviour, run each affected group. **Run the full suite
(`npm test`, no filter) only after a major change and once no human review is
pending** — it's a slow final gate, not part of iteration. CI runs the full matrix
on push regardless.

## What you get on a failure

Compact (default): the failure message, a **stack trace mapped to the original
source** (`spec/unpoly/form_spec.js:877`, not a `dist/specs.js` position — source
maps make this work even though the test build isn't minified), and a
`Debug in browser:` URL for that one spec.

`--verbose` adds, per failure:

- the **browser log** — Unpoly's requests / fragment updates / layer changes, plus
  anything you logged (see below);
- the **HTML state** — `#fixtures` and open overlays at the moment of failure,
  rendered as an indented CSS-selector outline.

```
bin/test --spec="up.layer" --verbose
```

## Echoing values while debugging

Add `console.log` / `console.debug` / `console.warn` in a spec or in `src/unpoly` and
it appears under **Browser log** in `--verbose` output. Notes:

- The transport carries **only simple values**, so the runner **serializes your
  arguments to strings in the browser** before sending. Objects, arrays and DOM
  elements are fine: objects render as JSON, elements as their opening tag, circular
  structures as `(circular structure)`, and long values are truncated.
- **String substitution is supported** (`%s`, `%o`, `%d`, `%c`), like the browser
  console: `console.log('user %o at step %d', user, 3)`.

## Interactive debugging

Prefer the terminal loop (edit → `bin/test` → read → edit); for runtime insight,
instrument with `console.log` and re-run the filtered spec. When you genuinely need
DevTools, open the `Debug in browser:` URL (live because `npm run dev` is serving) —
a Chrome MCP can drive it to inspect the live DOM/console.

## How it fits together (for changing the runner itself)

All runner code lives in `runner/`:

- `runner/terminal/run.mjs` — orchestration (`runDev`/`runCI`): preflight, Puppeteer,
  wiring, exit codes.
- `runner/terminal/receiver.mjs` — turns posted events into live progress + a
  collected failure list; drives the formatter.
- `runner/terminal/formatter.mjs`, `dom_outline.mjs`, `stack.mjs` — **pure**
  formatting (covered by `runner/test/`, run with `npm run self-test-runner`).
- `runner/terminal/source_map.mjs` — remaps stacks to original source.
- `runner/terminal/log_value.mjs` — serializes console args (runs in the browser;
  unit-tested in Node).
- `runner/terminal/build_status.mjs` / `build_sync.mjs` — the watcher writes
  `tmp/build-status.json`; the dev runner waits on it.
- `runner/terminal/poster.js` — runs in the **browser** (bundled via the stub
  `spec/helpers/terminal_reporter.js`): posts structured events over
  `window.__postToTerminal`, captures console + a DOM snapshot on the `specs:reset`
  event, and disables Unpoly's CSS log styling.
- `runner/server/` — the Express server and EJS runner page.
- `runner/config.mjs` — the config schema (env / query / `--argv`).
- `runner/dev_env.mjs` — start/stop the background dev environment (foreman +
  `Procfile.test`); `startDevEnv()` resolves once the first build + server are ready.
- `bin/test`, `bin/ci`, `bin/test-server`, `bin/dev` — thin extensionless wrappers.

The invariant: **the browser posts data (JSON-simple values); Node does all
formatting.** That keeps the formatter pure and fast to test.

CI (`.github/workflows/test.yml`) runs `npm run build-ci` then `npm run test-ci`
(`bin/ci`), which boots its own server and skips the watcher wait.

## Repository conventions

- Source lives in `src/unpoly/`; each module `foo.js` has a spec `spec/unpoly/foo_spec.js`.
- Specs use both native DOM and jQuery (`$`), plus many custom matchers in `spec/helpers/`.
- Do not commit anything in `dist/` or `tmp/` — both are generated/gitignored.
- Ask before committing (per the maintainer's workflow).
