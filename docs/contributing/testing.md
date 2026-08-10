# Testing

"Tests", "specs" and "examples" are used interchangeably.

Source lives in `src/unpoly/`; each module `foo.js` has a spec
`spec/unpoly/foo_spec.js`.

## Running tests

Unpoly's specs run in a real browser, driven from your terminal:

```
bin/test                             # the whole suite (a few minutes)
bin/test --spec="up.form"            # only specs whose full name contains this
```

`bin/test` needs a running [dev environment](dev-environment.md) and starts one in
the background if none is running.

**Filter while you work.** After editing `src/unpoly/form.js` (or its spec), run
`bin/test --spec="up.form"`. The full suite runs in a real browser and takes
several minutes, so run it unfiltered only as a final gate — and note that
[CI](commit-conventions.md#continuous-integration) runs the full matrix once you open
a pull request.

A run with one failing spec looks like this:

```
up.Params F........................................SSS..............SS.......... 64 passed, 1 failed, 5 skipped
up.Request . 1 passed

F1) up.Params → #toQuery → returns the query section for the given object

  Failure/error:
    Expected 'foo-key=foo%20value&bar-key=bar%20value' to equal 'foo-key=foo+value&bar-key=bar+value'.

  Stacktrace:
    spec/unpoly/classes/params_spec.js:35 in anonymous function

  Debug in browser:
    http://localhost:4000/specs?spec=up.Params%20%23toQuery%20returns%20the%20query%20section

65 passed, 1 failed, 5 skipped

Re-run with --verbose for browser logs and HTML state.
```

Stack traces are mapped back to the original source, and the `Debug in browser:` URL
opens that single spec in a browser you can put DevTools on.

**Debug by instrumenting, not stepping.** Anything you `console.log` in a spec or in
`src/unpoly` appears in the browser log that `--verbose` prints, so adding a log line
and re-running is usually the quickest way to inspect state — and the only way if you
can't open a browser. When you genuinely need DevTools, open the `Debug in browser:`
URL from a failing run rather than trying to step-debug the headless browser.

**Options:**

| Option | Effect |
|--------|--------|
| `--spec="…"` | Only run specs whose full name contains this string |
| `--verbose` | Add the browser log + HTML state (fixtures, overlays) to each failure |
| `--browser=firefox` | Run in Firefox instead of Chrome |
| `--headless=false` | Show the browser window while running |
| `--stop-on-failure=false` | Keep running a spec after its first failed expectation (default: stop) |
| `--csp=…` · `--es6` · `--migrate` | Serve the specs under a CSP / ES6 / unpoly-migrate variant |

(`--minify` is also accepted but needs a minified build — `bin/build --config=ci`.)

The spec runner itself is documented in [`runner/README.md`](../../runner/README.md).

## More sections

> **TODO:** This guide is still an outline. The notes below are the intended scope,
> not finished prose.

- Explain that it always runs a headless Chrome, even in CLI mode
  - Cannot use jsdom, tests care for nuances of browser implementations
- Chrome easier to debug for humans (can use DevTools)
- Organization
  - Finding specs
  - Running only single spec
  - Running only single example
    - Nested example groups are joined by space
- Spec Helpers
- Running all
  - Explain that it takes 5 minutes.
- Network mocked always
- Waiting for effects of async code
  - Await promise if you have one
  - Or do await wait()
  - Wait for time *only* when we do animations
  - Don't use jasmine.Clock()
- Fixture
  - Show deprecated ways to make fixtures
- Deprecated: jQuery
- Trigger class that triggers events
- Typical test
  - fixture
  - interaction
  - assert request
  - respond with test-provided HTML
  - assert mutated DOM
- Show repeated HTML gen with function

## Manual tests

In addition to the specs, there is an optional support repo
[`unpoly-manual-tests`](https://github.com/unpoly/unpoly-manual-tests). It contains a
Rails app to play with Unpoly features that are hard to test well with a unit test.
E.g. the visual look of overlays, or edge cases when booting Unpoly.
[`bin/dev`](dev-environment.md) also boots it, if you have it checked out next to this
repository.

> **TODO:** This section is still an outline. The notes below are the intended scope,
> not finished prose.

- Manual Tests Repo
  - Separate sibling repo
  - Auto booted
  - Is Rails
  - Can be used as scratch pad
