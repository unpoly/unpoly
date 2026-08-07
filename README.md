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

### Running tests

Unpoly's specs run in a real browser, driven from your terminal:

```
bin/test                             # the whole suite (a few minutes)
bin/test --spec="up.form"            # only specs whose full name contains this
```

Specs don't consume the sources directly, but a transpiled build in `dist/`. Hence
`bin/test` needs a **dev environment**: a build watcher and the spec server. It
starts one in the background if none is running (the first build takes ~15s), reuses
it on later runs, and waits for the watcher to pick up your latest edit — so you
never test stale code.

To follow the build and server logs, run the dev environment in its own terminal
instead:

```
bin/dev                              # run it in this terminal (Ctrl-C to stop)
bin/dev stop                         # stop a running environment
bin/dev status                       # report whether one is running (and flag a broken build)
```

If a build has errors — a syntax slip, or an ESLint violation — `bin/test` prints
them instead of running the specs and exits non-zero, and `bin/dev status` reports
them too. The watcher itself keeps running, so your next edit can fix things.

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
opens that single spec in a browser you can put DevTools on. Anything you
`console.log` in a spec or in `src/unpoly` appears in the browser log that
`--verbose` prints, so adding a log line and re-running is the quickest way to
inspect state.

**Options:**

| Option | Effect |
|--------|--------|
| `--spec="…"` | Only run specs whose full name contains this string |
| `--verbose` | Add the browser log + HTML state (fixtures, overlays) to each failure |
| `--browser=firefox` | Run in Firefox instead of Chrome |
| `--headless=false` | Show the browser window while running |
| `--stop-on-failure=false` | Keep running a spec after its first failed expectation (default: stop) |
| `--csp=…` · `--es6` · `--migrate` | Serve the specs under a CSP / ES6 / unpoly-migrate variant |

(`--minify` is also accepted but needs a minified build — `npm run build-ci`.)

In addition to the specs, there is an optional support repo [`unpoly-manual-tests`](https://github.com/unpoly/unpoly-manual-tests). It contains a Rails app to play with Unpoly features that are hard to test well with a unit test. E.g. the visual look of overlays, or edge cases when booting Unpoly. `bin/dev` also boots it, and the [`unpoly-site`](https://github.com/unpoly/unpoly-site) docs, if you have them checked out next to this repository.

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
