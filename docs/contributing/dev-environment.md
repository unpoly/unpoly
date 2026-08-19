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
`bin/test` needs a **dev environment**: a build watcher and the spec server. It
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

Each line is `HH:MM:SS.mmm service | output`:

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

`bin/dev` also boots the (optional) sibling repositories
[`unpoly-manual-tests`](https://github.com/unpoly/unpoly-manual-tests) and
[`unpoly-site`](https://github.com/unpoly/unpoly-site), *if* you have them checked out
next to this repository:

```
projects/
  unpoly/                 # this repository
  unpoly-site/            # unpoly.com (Ruby) — serves on port 4567
  unpoly-manual-tests/    # manual test app (Ruby) — serves on port 4001
```

The directory names matter. `unpoly-site` reaches this repository through a committed
symlink that expects to find it at `../unpoly`.

See [Testing](testing.md) and [Documentation](documentation.md) respectively.
