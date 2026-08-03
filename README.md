<p>
  <a href="https://makandra.de/">
    <picture>
      <source media="(prefers-color-scheme: light)" srcset="media/sponsored-by-makandra.light.svg">
      <source media="(prefers-color-scheme: dark)" srcset="media/sponsored-by-makandra.dark.svg">
      <img align="right" width="27%" alt="Sponsored by makandra" src="media/sponsored-by-makandra.light.svg">
    </picture>
  </a>

  <a href="https://unpoly.com">
    <picture>
      <source media="(prefers-color-scheme: light)" srcset="media/unpoly-logo.light.svg">
      <source media="(prefers-color-scheme: dark)" srcset="media/unpoly-logo.dark.svg">
      <img width="330" alt="Unpoly 3" role="heading" aria-level="1" src="media/unpoly-logo.light.svg">
    </picture>
  </a>
</p>

<p>
  <img alt="jsDelivr hits (npm)" src="https://img.shields.io/jsdelivr/npm/hy/unpoly">
  <img alt="NPM Downloads" src="https://img.shields.io/npm/dy/unpoly?label=npm">
  <img alt="Dependency count" src="https://badgen.net/bundlephobia/dependency-count/unpoly?label=dependencies&color=grey">
</p>


Progressive enhancement for HTML
--------------------------------

[Unpoly](https://unpoly.com) enhances your HTML with attributes to build dynamic UI on the server.

Unpoly works with any language or framework. It plays nice with existing code, and gracefully degrades without JavaScript.

This branch tracks the current major version, Unpoly **3.x**.\
If you're using Unpoly **2.x**, use the [`2.x-stable`](https://github.com/unpoly/unpoly/tree/2.x-stable) branch.\
If you're using Unpoly **1.x** or **0.x**, use the [`1.x-stable`](https://github.com/unpoly/unpoly/tree/1.x-stable) branch.


Getting started
---------------

- See [unpoly.com](https://unpoly.com) for guides and documentation.
- See [demo.unpoly.com](https://demo.unpoly.com) for an example application using Unpoly.
- See [installation instructions](https://unpoly.com/install) for many different package managers and languages.
- See [discussions](https://github.com/unpoly/unpoly/discussions) for our community forum.
- See [notable changes](https://unpoly.com/changes).


Development
-----------

### Installing development dependencies

To build Unpoly you require Node.js, Webpack and other npm packages.

Install the Node version from `.nvmrc`.

To install required npm packages, run:

```
npm install
```

### Quick start

After `npm install`, run the specs with:

```
npm test          # or: bin/test
```

That's it — the first run starts a background dev environment (spec server + build
watcher) and reuses it afterwards. See [Running tests](#running-tests) for filtering,
debugging, and the `bin/dev` command; the granular build/watch tasks are described
below.


### Building the library

Tests don't consume the sources directly, but from a transpiled build in `dist/`.

To make fresh build for development, run:

```
npm run build-dev
```

This will build transpiled files such as:

```
dist/unpoly.js
dist/unpoly.css
dist/unpoly-migrate.js
dist/jasmine.js
dist/specs.js
```

There is also a task `npm run build` for a production build. This does not build files for testing, but also outputs minified versions.

### Watching files for changes

During development it is impractical to make a full build after every change. Instead it is recommend to watch the project:

```
npm run watch-dev
```

This will make a fresh build and then watch the project for changes to the source files. 

When a source changes, affected build files are automatically recompiled. The incremental recompilation is much faster than a full build.

### Running tests

Unpoly's ~4000 specs run in a **real browser** (they manipulate the actual DOM and
cannot run under jsdom).

```
npm test          # or: bin/test
```

`bin/test` runs the specs headlessly in Chrome (Puppeteer) and prints a single,
compact report. It needs a **dev environment** — a spec server plus a build watcher
— and **starts one in the background automatically** if it isn't already running
(the first build takes ~15s), reusing it on later runs. It also **waits for the
watcher to finish rebuilding your latest edit**, so you never test stale code.

Prefer to run the dev environment yourself (e.g. to watch the build logs), or need
to control the background one? Use `bin/dev`:

```
bin/dev            # run server + watcher in the foreground (Ctrl-C to stop)
bin/dev stop       # stop a background environment that bin/test started
bin/dev status     # report whether the dev environment is running
```

**Run a subset.** Filter on the spec's full name (the top-level `describe` is named
after the module). The whole suite takes a few minutes, so filter while iterating:

```
bin/test --spec="up.form"                    # the whole up.form suite
SPEC="up.form" npm test                      # same, via env
bin/test --spec="up.form submits the form"   # a single example
```

**On failure**, a spec stops at its **first** failed expectation — so the report
(message, stack, log and DOM) describes one coherent moment rather than a cascade of
consequential failures (pass `--stop-on-failure=false` to see every failed
expectation instead). Each report shows the message, a **stack trace mapped back to
the original source** (`spec/unpoly/form_spec.js:877`, not a bundle position), and a
`Debug in browser:` URL for that one spec. Add **`--verbose`** for the deep dive — it
also prints the **browser log** and the **HTML state** (fixtures + overlays) at the
moment of failure:

```
bin/test --spec="up.layer" --verbose
```

Anything you `console.log` / `console.debug` in a spec or in `src/unpoly` shows up in
that browser log (objects, arrays and DOM elements are serialized), so adding a log
line and re-running is the quickest way to inspect state.

**Options** — pass as `--flags` or `UPPERCASE` env vars (a flag beats the env):

| Option | Effect |
|--------|--------|
| `--spec="…"` | Only run specs whose full name contains this string |
| `--verbose` | Add the browser log + HTML state to each failure |
| `--browser=firefox` | Run in Firefox instead of Chrome |
| `--headless=false` | Show the browser window while running |
| `--stop-on-failure=false` | Keep running a spec after its first failed expectation (default: stop) |
| `--csp=…` · `--es6` · `--migrate` | Serve the specs under a CSP / ES6 / unpoly-migrate variant |

(`--minify` is also accepted but needs a minified build — `npm run build-ci`.)

Exit codes: `0` pass · `1` failures · `2` runner timeout · `3` couldn't start the
dev environment · `4` build didn't refresh in time.

#### In a browser (for interactive debugging)

For DevTools (breakpoints, element inspection, poking at `up.*`), open
`http://localhost:4000` (served by the dev environment). The `Debug in browser:` URL
a failing run prints opens the browser straight to that single spec.

In addition to the unit tests, there is an optional support repo [`unpoly-manual-tests`](https://github.com/unpoly/unpoly-manual-tests). It contains a Rails app to play with Unpoly features that are hard to test well with a unit test. E.g. the visual look of overlays, or edge cases when booting Unpoly.

> **Working with an AI coding agent?** See [`AGENTS.md`](AGENTS.md).

### Making a new release

There is a guided CLI interface to lead you through the release process. To start the process run:

```
npm run release
```



Credits
-------

- [Henning Koch](mailto:henning.koch@makandra.de) from [makandra](https://makandra.com) ([@triskweline](https://twitter.com/triskweline) on Twitter)
- [Contributors](https://github.com/unpoly/unpoly/graphs/contributors)
