# Setting up a dev environment

## Installing development dependencies

To build Unpoly you require Node.js, Webpack and other npm packages.

Install the Node version from `.nvmrc`.

To install required npm packages, run:

```
npm install
```

## Running the dev environment

Specs don't consume the sources directly, but a transpiled build in `dist/`. Hence
`bin/test` needs a **dev environment**: a build watcher, the spec server and the
[scratch server](trying-out-changes.md). It
starts one in the background if none is running (the first build takes ~15s), reuses
it on later runs, and waits for the watcher to pick up your latest edit — so you
never test stale code.

However you start it, everything the environment prints is also written to
[`tmp/dev.log`](#logs). To follow it live, run the dev environment in its own terminal
instead:

```
bin/dev                              # run it in this terminal (Ctrl-C to stop)
bin/dev stop                         # stop a running environment
bin/dev status                       # report whether one is running (and flag a broken build)
```

If a build has errors — a syntax slip, or an ESLint violation — `bin/test` prints
them instead of running the specs and exits non-zero, and `bin/dev status` reports
them too. The watcher itself keeps running, so your next edit can fix things.

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
09:48:50.554 watch       | asset unpoly.js 399 KiB [compared for emit] (name: unpoly)
09:48:50.554 watch       |   modules by path ./src/unpoly/classes/ 212 KiB 68 modules
09:48:50.554 watch       | webpack 5.105.4 compiled successfully in 11393 ms
09:48:53.217 docs        | == The Middleman is loading
```

What you can find in there:

- `watch` — the build watcher. What it rebuilt and how long it took, and the verbatim
  compile or ESLint errors when a build breaks.
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
read them from `tmp/build-status.json`.

One neighbour, `tmp/dev-crash.log`, is not a second log. It catches the supervisor's raw
output for the one case the log cannot cover: dying before it opens the log, which in
practice means a syntax error or bad import in `tooling/dev_env.mjs`. It is empty otherwise.

## What it runs

```
watch      # the Webpack build watcher, keeping dist/ current
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
