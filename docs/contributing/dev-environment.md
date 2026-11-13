# Setting up a dev environment

Specs never run against `src/` directly, but against a transpiled build in `dist/`. One
command boots the build watcher, the spec server and the documentation site.

<!-- toc -->
- [Installing development dependencies](#installing-development-dependencies)
- [Running the dev environment](#running-the-dev-environment)
- [The build](#the-build)
- [Logs](#logs)
- [What it runs](#what-it-runs)
- [Running more than one checkout](#running-more-than-one-checkout)
<!-- /toc -->

## Installing development dependencies

To build Unpoly you require Node.js and the npm packages from `package.json` (esbuild,
Terser, Sass and Oxlint, among others). The build also calls Ruby, to render the one ERB
template that inserts the version number.

Install the Node version from `.nvmrc`.

To install required npm packages, run:

```
npm install
```

## Running the dev environment

Specs don't consume the sources directly, but a transpiled build in `dist/`. Hence
`bin/test` needs a **dev environment**: a build watcher, the spec server and the
[scratch server](trying-out-changes.md). It
starts one in the background if none is running (the first build takes a few seconds), reuses
it on later runs, and waits for the watcher to pick up your latest edit — so you
never test stale code.

The watcher writes to the same files in `dist/` as a production build. So `bin/build`
stops a running dev environment before it builds (except with `--watch`,
`--config=development` or `--config=minified`).

However you start it, everything the environment prints is also written to
[`tmp/dev.log`](#logs). To follow it live, run the dev environment in its own terminal
instead:

```
bin/dev                              # run it in this terminal (Ctrl-C to stop)
bin/dev stop                         # stop a running environment
bin/dev status                       # report whether one is running (and flag a broken build)
```

If a build has errors — a syntax slip, or a lint error — `bin/test` prints
them instead of running the specs and exits non-zero, and `bin/dev status` reports
them too. The watcher itself keeps running, so your next edit can fix things.

A **type error** doesn't break the build, and `bin/test` runs the specs anyway (see
[Testing](testing.md#check-types-and-lint-first)). `bin/dev status` lists type errors, but
still reports the environment as usable.

## The build

`bin/build` bundles every entry point in `src/` with [esbuild](https://esbuild.github.io/), which
also strips TypeScript's types, and minifies with [Terser](https://terser.org/).
`tooling/build/bundles.mjs` lists every bundle, and which `--config` builds it.

The watcher rebuilds only the bundles that read the file you edited, and lints the file with
Oxlint if it is in `src/` (see [Linting](code-style.md#linting)), usually within 300 ms.

esbuild only strips the types. After a change in `src/` (a doc file included) or in a
`tsconfig*.json`, the watcher runs the checks of `bin/typecheck` (see
[Type checking](code-style.md#type-checking)) in two tsc processes, which take another ~0.5 s
and every core. They start once the bundles are written, so the bundles are ready as early as
without them, and `bin/test` doesn't wait for them either: they run while it launches the
browser and the first specs run. A change that comes in during a check aborts it, and the
check runs again after that change's rebuild.

Of the one-shot builds, only the production build
(`bin/build` without `--config`, which `bin/release` runs) lints `src/`, and fails on an error.
None of them checks types. To check without the watcher, run `bin/typecheck` and `bin/lint` (see
[Testing](testing.md#check-types-and-lint-first)).

## Logs

Everything the dev environment prints goes to **`tmp/dev.log`**, whether you started it with
`bin/dev` or left `bin/test` to start one in the background. The location never depends on
how it was started, so you can read it without knowing who started what. Your terminal gets
the same lines in colour; the file is plain text.

A spec run is logged separately: `bin/test` mirrors its own output into **`tmp/test.log`**,
so a red run can be re-read instead of re-run.

Each line of the dev log is `HH:MM:SS.mmm service | output`:

```
09:48:38.636 server      | Unpoly specs serving on http://localhost:4000. Press CTRL+C to quit.
09:48:38.902 watch       | Watching src, spec, tooling/runner/browser for changes…
09:48:40.233 watch       | Built 9 of 9 bundles in 1326 ms
09:48:40.811 watch       | Checked types in 578 ms
09:48:41.217 docs        | == The Middleman is loading
09:49:12.480 watch       | Built 2 of 9 bundles in 118 ms
09:49:13.012 watch       | Found 1 type error in 531 ms:
09:49:13.012 watch       | src/unpoly/link.ts
09:49:13.012 watch       |   635:14   error  Type 'string' is not assignable to type 'number'.  TS2322
```

What you can find in there:

- `watch` — the build watcher. How many bundles it rebuilt and how long it took, the
  verbatim compile or lint errors when a build breaks, and the type check's errors, formatted
  like the lint errors.
- `server` — the spec server, including the port it came up on.
- `docs` — the documentation site, if you have that sibling repository checked out.
- `dev` — the supervisor itself: a service exiting, a sibling repository being skipped
  because it isn't checked out, and shutdown.

Because every line carries the service name, one service reads cleanly on its own:

```
grep -E '^[0-9:.]+ watch ' tmp/dev.log      # just the build
```

The log is truncated each time an environment starts, so what you are reading is the current
session and nothing older. For a **broken build** you don't need the log at all: `bin/test`
prints the errors instead of running the specs, and `bin/dev status` reports them too — both
read them from `tmp/build-status.json`. The same goes for type errors, which that file keeps
apart from the build's, under `types`.

One neighbour, `tmp/dev-crash.log`, is not a second log. It catches the supervisor's raw
output for the one case the log cannot cover: dying before it opens the log, which in
practice means a syntax error or bad import in `tooling/dev_env.mjs`. It is empty otherwise.

## What it runs

```
watch      # the build watcher, keeping dist/ current
server     # the spec runner            — serves on port 4000
scratch    # pages for trying a change by hand — serves on port 4001
docs       # unpoly.com, if checked out — serves on port 4567
```

The first three are in this repository. The last one is the (optional) sibling repository
[`unpoly-site`](https://github.com/unpoly/unpoly-site), booted *if* you have it checked out
next to this one:

```
projects/
  unpoly/                 # this repository
  unpoly-site/            # unpoly.com (Ruby) — serves on port 4567
```

The directory names matter: `unpoly-site` reaches this repository through a committed symlink
that expects to find it at `../unpoly`. If it isn't checked out, the environment says so and
carries on without it.

See [Trying out changes](trying-out-changes.md) for the scratch server, [Testing](testing.md)
for the spec runner, and [Documentation](documentation.md) for the site.


## Running more than one checkout

Two checkouts can each run their own environment — the state is already separate, since
`tmp/dev.pid` and `tmp/build-status.json` belong to the checkout rather than to your machine.
The ports are the only thing they share. Move them with `PORT_OFFSET`:

```
export PORT_OFFSET=100    # spec runner 4100, scratch 4101, docs 4667
bin/dev
```

Set it for **every** command in that checkout, `bin/test` included — the runner finds the
environment by probing its port, so a mismatch makes it conclude nothing is running. That
failure is loud rather than subtle: starting a second environment on ports another checkout
already holds stops immediately with `Port 4000 is already in use`.

The checkout that sets nothing keeps 4000, 4001 and 4567 — the numbers the rest of these
guides name.
