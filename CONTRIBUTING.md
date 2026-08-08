# Contributing to Unpoly

A guide for humans and agents.

Throughout these docs, a **developer** builds an app with Unpoly, a **visitor** uses
that app, and a **maintainer** works on Unpoly itself — you.

Each section below summarizes a guide and says when to read it. The summaries are
deliberately not sufficient: they exist so you can tell which guide you need, not so
you can skip it. Guides marked *(outline)* are still notes rather than finished prose.


## First change walkthrough

One end-to-end pass through a typical change — implement an attribute, spec it,
document it, commit it — showing only the happy path. It links out at every step
rather than explaining anything twice.

**If this is your first change to Unpoly, start here.** It's the shortest path from a
checkout to a reviewable commit, and it will tell you which of the guides below you
actually need.

[Your first change to Unpoly](docs/contributing/first-change.md) *(outline)*


## Setting up a dev environment

Specs and the docs site don't run against `src/` directly, but against a transpiled
build in `dist/`. `bin/dev` runs the build watcher and spec server that produce it,
and also boots the sibling docs and manual-test repos if you have them checked out.

**Read before you run anything for the first time**, or when you suspect you're
testing a stale build.

[Setting up a dev environment](docs/contributing/dev-environment.md)


## Values & API philosophy

Why Unpoly looks the way it does: what we optimize for (bytes, no race conditions,
graceful degradation without JS) and how a feature escalates from a single HTML
attribute to a low-level JavaScript call when defaults don't fit.

**Read before designing a new feature, or before reviewing someone else's.** These
are the criteria a feature is judged against, and they explain most rejections.

[Values & API philosophy](docs/contributing/values-and-api-philosophy.md)


## Code organization

Where files live, why Unpoly is a `window.up` global rather than an ESM module, which
"main module" owns which topic, and the module pattern every one of them follows.

**Read before adding or moving code** — particularly if you're unsure which module a
change belongs in, since that decision also fixes where its spec, docs and commit
prefix go.

[Code organization](docs/contributing/code-organization.md)


## Testing

Specs are Jasmine, always run in a real browser, and are driven from the terminal
with `bin/test`. The network is always mocked. Filtering to the module you're editing
turns a multi-minute suite into a few seconds.

**Read before writing a spec — and especially before copying an existing one.** Old
specs still contain deprecated jQuery and fixture patterns, so pattern-matching a
neighbouring spec will reproduce them, and nothing will fail to tell you. The rules
for awaiting async effects are also not guessable.

[Testing](docs/contributing/testing.md) *(partly outline)*


## Documentation

API references live in `/*- ... */` doc comments beside the code they describe,
written in a superset of JSDoc with custom directives like `@selector` and
`@section`. Holistic guides live as Markdown in `src/unpoly/pages`. A sibling repo
(`../unpoly-site`) parses and serves all of it.

**Read before adding or changing any doc comment or guide page.** The directive set
is large and you won't guess it, and there are conventions for how features are named
in prose.

[Documentation](docs/contributing/documentation.md) *(outline)*


## Code style

No types, no dependencies, no jQuery. Byte count is a real constraint that sometimes
justifies code you'd otherwise call ugly, and there are naming conventions that don't
match common JS habits (`parseURL()`, not `parseUrl()`).

**Skim once before your first pull request.**

[Code style](docs/contributing/code-style.md) *(outline)*


## Commit conventions

Commit subjects are prefixed with the main module in square brackets, e.g.
`[link] Ignore clicks when the visitor holds Ctrl`. CI runs the full matrix on push.

**Read before your first commit.** Agents should ask their human before committing,
pushing or opening a pull request.

[Commit conventions](docs/contributing/commit-conventions.md) *(outline)*


## Rendering core deep-dive

How a render pass actually works: `up.render()`, the render job, and the change
classes that decide what a response is allowed to do — including the awkward cases
like multiple targets, missing targets, hungry elements, layer changes and
revalidation.

**Read before touching `up.fragment` or `src/unpoly/classes/change/`.** Rendering is
the one subsystem where a wrong mental model yields code that passes its specs and is
still wrong.

[Rendering core deep-dive](docs/contributing/rendering.md) *(outline)*


## Compatibility

We support browser versions from the last two years and test in Chrome, Firefox and
Safari. Renames and removals get a polyfill in `unpoly-migrate.js` instead of a major
version bump.

**Read before removing or renaming a public API,** or before reaching for a JS or CSS
feature that might be too new.

[Compatibility](docs/contributing/compatibility.md) *(outline)*


## Releasing

`npm run release` starts a guided CLI that walks through cutting a release.

**Maintainers only, when publishing a new version.**

[Making a new release](docs/contributing/releasing.md)
