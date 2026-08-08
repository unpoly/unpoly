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

The following will build the library and start a server to run tests:

```
npm run dev
```

Allow a moment for Unpoly and tests to build in `dist/`. Changing a file will re-build automatically.

`npm run dev` runs the spec server and a build watcher together. With it running,
you can run tests in either of these ways:

- From your terminal, using `npm test` (or `bin/test`) — see [Running tests](#running-tests)
- In a browser, by opening `http://localhost:4000`

See [Running tests](#running-tests) for details, or run the underlying tasks individually as described below.


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
cannot run under jsdom). Both ways of running them assume a **running dev
environment** — start it once, in its own terminal:

```
npm run dev
```

This runs the spec server and a build watcher together (via `Procfile.dev`).

#### From the terminal

```
npm test          # or: bin/test
```

`npm test` drives the specs headlessly in Chrome (Puppeteer) and prints a single,
compact report. It does **not** build or start a server itself — it relies on the
watcher and server from `npm run dev`, and errors clearly if either is missing. It
also **waits for the watcher to finish rebuilding your latest edit** before running,
so you never test stale code.

Run a subset by filtering on the spec's full name (the top-level `describe` is named
after the module). Config can come from a `--flag` or an env var:

```
bin/test --spec="up.form"                    # the whole up.form suite
SPEC="up.form" npm test                      # same, via env
bin/test --spec="up.form submits the form"   # a single example
```

Each failure prints the message, a **stack trace mapped back to the original
source** (e.g. `spec/unpoly/form_spec.js:877`, not a bundle position), and a
`Debug in browser:` URL for that one spec. Add **`--verbose`** for the deep dive: it
also shows the **browser log** (Unpoly's requests / fragment updates / layer
changes, plus anything you `console.log`) and the **HTML state** (fixtures and
overlays) at the moment of failure:

```
bin/test --spec="up.layer" --verbose
```

Exit codes: `0` pass · `1` failures · `2` runner timeout · `3` no server · `4`
watcher not running or build stale. Other options: `--headless=false` (show the
window), `--browser=firefox`.

#### In a browser (for interactive debugging)

For DevTools (breakpoints, element inspection, poking at `up.*`), open
`http://localhost:4000` (served by `npm run dev`). The `Debug in browser:` URL a
failing terminal run prints opens the browser straight to that single spec.

In addition to the unit tests, there is an optional support repo [`unpoly-manual-tests`](https://github.com/unpoly/unpoly-manual-tests). It contains a Rails app to play with Unpoly features that are hard to test well with a unit test. E.g. the visual look of overlays, or edge cases when booting Unpoly.

> **Working with an AI coding agent?** See [`AGENTS.md`](AGENTS.md) for the same powers described from an agent's point of view.

### Making a new release

There is a guided CLI interface to lead you through the release process. To start the process run:

```
npm run release
```



Credits
-------

- [Henning Koch](mailto:henning.koch@makandra.de) from [makandra](https://makandra.com) ([@triskweline](https://twitter.com/triskweline) on Twitter)
- [Contributors](https://github.com/unpoly/unpoly/graphs/contributors)
