# Contributing to Unpoly

A collection of guides to help humans and agents work on the Unpoly framework.

Each section below summarizes a guide and says when to read it in full.\
The summaries are deliberately not sufficient: they exist so you can tell which guide
you need, not so you can skip it.


### [🍭 First change walkthrough](docs/contributing/first-change.md)

> A quick end-to-end pass through a typical change:\
> Implement a new `[up-*]` attribute, spec it, document it, commit it.

[Start with the walkthrough](docs/contributing/first-change.md) if this is your first change to Unpoly.


### [💻 Setting up a dev environment](docs/contributing/dev-environment.md)

> Tests don't run against `src/` directly, but against a transpiled
> build in `dist/`.\
> The `bin/dev` tool boots a build watcher, a test server and the documentation site.\
> Everything they print lands in `tmp/dev.log`, however the environment was started.

[Read the dev environment guide](docs/contributing/dev-environment.md) before trying out your changes,
when you suspect a stale build, or when you need to see what a service actually did.


### [🔭 Trying out changes](docs/contributing/trying-out-changes.md)

> Some things you have to see: how an overlay looks, a form across three validation
> roundtrips.\
> `bin/dev` serves a scratch server on port 4001 — a few real pages against a real server,
> where you add a page, poke at it with your mouse, Puppeteer or Playwright, and throw it away.

[Read the scratch server guide](docs/contributing/trying-out-changes.md) when a spec cannot
show you what you need to see. What you learn there still belongs in a spec.


### [🎓 Philosophy](docs/contributing/philosophy.md)

> Values that guide us when we decide which features to add, how we design them, and
> how we review code.
> Explains the shape of Unpoly's public API and internal implementation.
> Common use cases must have minimal call sites; complex use cases must be possible
> through configuration and escape hatches.

[Read our philosophy](docs/contributing/philosophy.md) before designing a new
feature, or before reviewing someone else's.


### [🗂️ Code organization](docs/contributing/code-organization.md)

> Where files live, why Unpoly is a `window.up` global, which module owns which topic,
> how we structure modules internally, and how to find tests for a given file.
> Implementation plans for larger changes go in `docs/plans/`, named after their subject.

[Read the code organization guide](docs/contributing/code-organization.md) before
adding or moving code.


### [💥 Testing](docs/contributing/testing.md)

> Any change must be tested. Tests ("specs") are written in Jasmine.
> They always run in a real browser, but can be driven from the terminal
> using `bin/test`. The network is always mocked. We have patterns to wait for
> async code. Filtering to the module you're editing turns a multi-minute suite into a few seconds.

[Read the full testing guide](docs/contributing/testing.md) before writing or changing a spec.
Many old specs use deprecated patterns, so don't copy a neighbour.


### [📖 Documentation](docs/contributing/documentation.md)

> All public API must be documented thoroughly.
> API references live in `/*- ... */` doc comments beside the code they describe,
> written in a superset of JSDoc with custom directives like `@selector`.
> Additionally, holistic guides in `src/unpoly/pages` show how to tie multiple features
> together for common use cases. A sibling repo (`../unpoly-site`) parses and serves all of it.

[Read the full documentation guide](docs/contributing/documentation.md) before
changing documentation. The directive set is large and you won't guess it.


### [👗 Code style](docs/contributing/code-style.md)

> No types, no dependencies, no jQuery.
> Byte count is a real constraint that sometimes
> justifies unconventional code.
> You can run ESLint with `bin/lint`.

[Skim the code style guide](docs/contributing/code-style.md) before showing your code to someone else.


### [✉️ Commit conventions](docs/contributing/commit-conventions.md)

> Commit messages are prefixed with the main module in square brackets, e.g.
> `[link] Ignore CTRL clicks`. CI runs all tests on every pull request.
> Agents should ask their human before committing, pushing or opening a
> pull request.

[Read the commit conventions](docs/contributing/commit-conventions.md) before making a
commit.


### [⚙️ Rendering core deep-dive](docs/contributing/rendering.md)

> Most calls to Unpoly end up in `up.render()`, its most complicated sub-system.
> It negotiates target selectors, makes requests, deals
> with unexpected responses and might update many elements or multiple layers.
> Control flow moves through numerous functions and objects.

[Read the rendering deep-dive](docs/contributing/rendering.md) before touching
`up.render()` or files in `src/unpoly/classes/change/`.


### [🔍 Selector lookup deep-dive](docs/contributing/selector-lookup.md)

> Unpoly has its own selector engine. Lookups are scoped to a single layer, skip
> elements that are being destroyed, understand custom selectors like `:main` and
> `:origin`, and prefer matches near the element the user interacted with.

[Read the selector lookup deep-dive](docs/contributing/selector-lookup.md) before writing
code that looks up elements, or when a lookup returns something you did not expect.


### [🔌 Compatibility](docs/contributing/compatibility.md)

> We support browser versions from the last two years and test in Chrome, Firefox and
> Safari. Breaking changes get a polyfill in `unpoly-migrate.js` instead of a major
> version bump.

[Read the compatibility guide](docs/contributing/compatibility.md) before breaking a public API,
or when using bleeding-edge JS or CSS features.


### [🚀 Releasing](docs/contributing/releasing.md)

> A release involves many steps. The `bin/release` tool guides you through the process.

[Read the release guide](docs/contributing/releasing.md) before publishing a new
version.
