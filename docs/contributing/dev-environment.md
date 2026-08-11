# Setting up a dev environment

The terms "bundler" and "build pipeline" both refer to tools like esbuild or Webpack.

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
