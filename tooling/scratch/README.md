# The scratch server

A handful of real pages, served on port 4001, for trying an Unpoly change by hand.

For *using* it — writing a page, driving a browser, reading the request log — see
[Trying out changes](../../docs/contributing/trying-out-changes.md). This file is for
*changing* the server itself.

```
tooling/scratch/
  server.mjs      express wiring: routing, the build gate, request logging, error pages
  pages.mjs       a URL → the files behind it, and the listing (pure; unit-tested)
  helpers/        page-facing API: layout.mjs + layout.ejs, view.mjs
  assets/         styles.css, scripts.js — served at /assets
  pages/          the URL space — examples, tracked, and yours to edit while you work
```

`bin/scratch-server` is a shebang plus one import, like the other `bin/*` executables. The
dev environment runs it from the process table in `tooling/dev_env.mjs`.

## Rules that keep it small

- **Its own process, not a route on the spec server.** `bin/ci` boots that one, and
  dynamically importing whatever uncommitted files sit in `pages/` has no business near a CI
  run. It also gives the scratch pages the root of their own URL space.
- **Everything in `pages/` is a route.** No ignore lists, no underscore prefixes — which is
  why `helpers/`, `assets/` and this README live outside it.
- **Nothing here is isolated from you.** The pages are tracked examples, not fixtures — no test
  reads them — and you are expected to edit them and `git restore` afterwards. An earlier
  version gitignored `pages/*` behind an allowlist; that hid leftovers from `git status` and
  forced setup out of `assets/scripts.js` for no gain.
- **Helpers load files and build strings; they never touch `req` or `res`.** This is what
  stops a project-specific response API accreting (`acceptLayer(res)`, `respondSlowly(res)`)
  and leaves every response decision visible in the page that makes it.
- **No query-parameter magic.** No `?delay=`, no `?status=`, no header injection. A page that
  wants any of that writes four lines of Express, where you can see them.
- **The layout is asked for, not applied behind your back.** `layout()` hands back anything
  that already looks like a document, so a page owns its `<head>` by writing one.
- **The index and the error pages load no bundle**, so they still work when the build is
  broken — which is exactly when you need them.
- **The build protocol is reused, not reimplemented.** The gate is `waitForFreshBuild()` from
  `tooling/build/build_sync.mjs`, the same function `bin/test` waits on.
- **Log lines carry no timestamp.** Under `bin/dev` the supervisor stamps and prefixes every
  line; stamping here too would print two.

## Self-tests

`tooling/test/scratch/` — `pages` (resolution, the name guard, the listing), `helpers`
(wrapping, pass-through, EJS locals and error positions) and `server` (an Express instance on
an unusual port, with the build gate and the log injected).
