# Code organization

Where code lives, why Unpoly is a `window.up` global, which namespace owns which topic,
and how a namespace is structured internally.

<!-- toc -->
- [Directory structure](#directory-structure)
  - [Where to find a namespace's specs](#where-to-find-a-namespaces-specs)
  - [Implementation plans](#implementation-plans)
- [Architecture](#architecture)
  - [Not an ESM module](#not-an-esm-module)
  - [Responsibilities](#responsibilities)
  - [Namespace pattern](#namespace-pattern)
- [Entry points and optional bundles](#entry-points-and-optional-bundles)
<!-- /toc -->


## Directory structure

You will mostly make changes in `src/unpoly` and test them in `spec/unpoly`. How the specs
themselves are structured is covered in [Testing](testing.md#how-specs-are-organized).

This repository is organized like this:

```
src/                      # Webpack entry points for Unpoly's main and optional bundles
  unpoly.js               # ... Entry point for main Unpoly bundle (JS, CSS)
  unpoly-migrate.ts       # ... Entry point for optional bundle that polyfills deprecated features
  ...                     # ... Other entry points for optional bundles

  unpoly/                 # Source code (TS, JS, CSS) for Unpoly's namespaces
    form.ts               # ... Code for up.form namespace
    form/                 # ... Classes owned by up.form
      params.ts           # ...... Code for up.Params class
      ...
    link.ts               # ... Code for up.link namespace
    link.sass             # ... CSS for up.link namespace
    layer.ts              # ... Code for up.layer namespace
    layer/                # ... Classes owned by up.layer
      base.ts             # ...... Code for up.Layer class
      modes/              # ...... One class per layer mode (ModalLayer, PopupLayer, ...)
    fragment/             # ... Classes owned by up.fragment
      render/             # ...... The classes behind up.render()
    util/                 # ... Generic helper classes (up.Config, up.Rect, ...)
    ...                   # ... Other namespaces and their classes

spec/
  unpoly/                 # Tests (Jasmine specs), mirroring src/unpoly
    form_spec.js          # ... Tests for up.form namespace
    form_switch_spec.js   # ... Tests for [up-switch], too large to keep in form_spec.js
    form/                 # ... Tests for classes owned by up.form
      params_spec.js      # ...... Tests for up.Params class
    link_spec.js          # ... Tests for up.link namespace
    layer_spec.js         # ... Tests for up.layer namespace
    ...                   # ... Tests for other namespaces and classes

  helpers/                # Utility helpers and custom matchers for Jasmine specs
    reset_up.js           # ... Cleans up global state after each test
    to_have_selector.js   # ... Custom matcher
    fixture.js            # ... Helpers to insert temporary HTML into the DOM
    ...                   # ... Other helpers

bin/                      # Scripts for development
  dev                     # ... Start or stop dev environment (Webpack bundler, Jasmine runner)
  test                    # ... Run tests from terminal (will execute in headless Chrome internally)
  find-spec               # ... Find specs by a phrase in their describe()/it() titles
  ...                     # ... other dev scripts

tooling/                  # Our own dev machinery, never shipped (rarely need to edit here)
  runner/                 # ... Runs the specs: server, terminal driver, in-page reporter
  scratch/                # ... Pages for trying a change by hand (see Trying out changes)
  build/                  # ... bin/build and the Webpack configuration
  dev_env.mjs             # ... The dev environment behind bin/dev
  find_spec.mjs           # ... Spec-title search behind bin/find-spec
  test/                   # ... Unit tests for all of the above (bin/self-test)

docs/                     # Documentation for contributors, never shipped
  contributing/           # ... The guides linked from CONTRIBUTING.md
  plans/                  # ... Implementation plans (gitignored)

dist/                     # Output directory for the Webpack bundler (gitignored, never edit directly)
  unpoly.js               # ... Main Unpoly bundle (JS)
  unpoly.css              # ... Main Unpoly bundle (CSS)
  unpoly.min.js           # ... Minified Unpoly bundle (JS)
  unpoly.min.css          # ... Minified Unpoly bundle (CSS)
  ...
```

### Where to find a namespace's specs

A group that grew too large lives in a sibling file sharing the namespace's prefix, like
`form_switch_spec.js` above. See [Finding the spec for a feature](testing.md#finding-the-spec-for-a-feature).


### Implementation plans

A change worth more than one commit is worth a written plan first: what was decided,
what was ruled out and why, and the sequence of commits. Plans are working notes in
`docs/plans/`, which is gitignored. Name the file after the change, like
`docs/plans/up-switch-array-fields.md`.


## Architecture

### Not an ESM module

Unpoly isn't an ESM module that can be imported. Instead it defines a global `window.up` and attaches all functions to that global. This is slightly unorthodox in an ESM world, but gives us some advantages:

- Non-ESM scripts can call functions like `up.form.submit()` without `import`-ing anything.
- The server-rendered HTML document can directly use Unpoly's HTML extensions (e.g. `[up-follow]`, `[up-submit]`).
- Callback attributes (like `[onclick]`, `[up-on-accepted]`) can directly call functions on the `up` global (no way to `import` here).

*Internally* Unpoly's files are ES modules that `import` from each other. Webpack bundles them into one script that sets `window.up`. See the [namespace pattern](#namespace-pattern) below.

### Responsibilities

Unpoly's functionality is split into the namespaces below. Each namespace handles a topic (e.g. "forms") and defines any HTML extensions and JS API to support that topic.

| Namespace | Topics | Example selectors | Example functions | Example events |
|---|---|---|---|---|
| `up.link` | Hyperlinks, preloading, lazy-loading | `[up-follow]`, `[up-preload]`, `[up-defer]` | `up.follow()` | `up:link:follow` |
| `up.form` | Forms, validation, dependent fields | `[up-submit]`, `[up-validate]`, `[up-switch]` | `up.submit()`, `up.watch()` | `up:form:submit`, `up:form:validate` |
| `up.script` | Custom JavaScript, element data | `[up-data]` | `up.compiler()`, `up.hello()` | `up:assets:changed` |
| `up.layer` | Overlays, subinteractions | `[up-layer=new]`, `[up-accept]` | `up.layer.open()`, `up.layer.ask()` | `up:layer:accepted` |
| `up.fragment` | Rendering, targeting, render lifecycle | `[up-main]`, `[up-keep]` | `up.render()`, `up.reload()` | `up:fragment:loaded`, `up:fragment:inserted` |
| `up.radio` | Passive updates, polling | `[up-hungry]`, `[up-poll]` | `up.radio.startPolling()` | `up:fragment:poll` |
| `up.motion` | Transitions, animations | `[up-transition]` | `up.morph()`, `up.animate()` | `up:motion:finish` |
| `up.status` | Navigation bars, loading state, previews | `[up-nav]`, `.up-current`, `[up-preview]` | `up.preview()` | — |
| `up.network` | HTTP client, caching, offline | — | `up.request()`, `up.cache.expire()` | `up:network:late`, `up:request:offline` |
| `up.event` | Emitting and observing events | `[up-emit]` | `up.on()`, `up.emit()` | — |
| `up.protocol` | Server headers, optimized responses | — | — | *(`X-Up-*` headers)* |
| `up.element` | Low-level DOM helpers | — | `up.element.affix()`, `up.element.jsonAttr()` | — |
| `up.viewport` | Scrolling, focus | `[up-viewport]`, `[up-fixed=top]` | `up.reveal()`, `up.focus()` | — |
| `up.history` | URL updates, restoration | `[up-back]` | `up.history.push()` | `up:location:changed` |
| `up.util` | JavaScript helpers, relaxed JSON | — | `up.util.isBlank()`, `up.util.copy()` | — |
| `up.framework` | Booting, feature detection | `[up-boot=manual]` | `up.boot()` | `up:framework:booted` |
| `up.log` | Console logging | — | `up.log.enable()` | — |

We rarely add a new namespace. We sometimes rename an existing namespace when its responsibilities change, and the name no longer fits.


### Namespace pattern

Namespaces live in `src/unpoly`. E.g. `src/unpoly/link.ts` defines the `up.link` namespace that deals with hyperlinks.

A namespace definition has the following jobs:

- Implement any HTML extensions, mostly new attributes like `[up-follow]`. These are either handled by event listeners, or by activating behavior on new DOM elements with a compiler.
- Define a companion JavaScript API (like `up.link.follow()`), published on the `window.up` global.
- Often expose a configuration property (like `up.link.config`) that lets the developer configure the namespace's behavior.

Each namespace is an ES module that exports:

- **Named functions**, which other files `import`. Internal code never calls through the global (`up.link.follow()`), it imports `follow` from `./link.js`.
- **`api`**, the module's contribution to `window.up`: the namespace object, plus any shortcuts like `up.follow`. Public names may differ from the internal ones (`get: getOne`).
- Optionally **`install()`**, which performs all the module's side effects: registering compilers, macros and event listeners.

A module's top level only declares things. Nothing happens when it is imported.

To illustrate, here is a *very* simplified version of `up.link`:

```js
// Import the functions and classes we need from other modules.
import { Config } from './util/config.js'
import { emit } from './event.js'
import { LinkFollower } from './link/link_follower.js'

// Settings to globally configure link handling.
// Published as up.link.config.
export const config = new Config('up.link.config', () => ({
  followSelector: '[up-follow]',
}))

// Programmatically follow a link.
// Published as up.link.follow() and up.follow()
export function follow(link) {
  // Allow listeners to prevent the follow
  if (emitFollowEvent(link).defaultPrevented) return

  // Instantiate a helper class to handle the following
  return new LinkFollower(link).execute()
}

// Return whether a link will be followed by Unpoly.
// Published as up.link.isFollowable()
export function isFollowable(link) {
  return !!link.closest(config.followSelector)
}

// Internal helper to emit an up:link:follow event.
// Not exported, not published.
function emitFollowEvent(link) {
  return emit(link, 'up:link:follow')
}

// Side effects only run when the entry file calls install().
export function install() {
  // Handle clicks on links with an [up-follow] attribute
  document.addEventListener('click', function(event) {
    if (isFollowable(event.target)) {
      follow(event.target)
    }
  })
}

// The public functions and values that will be set as up.link properties.
// Do not add internal helpers.
export const api = {
  link: {
    config,       // becomes up.link.config
    follow,       // becomes up.link.follow()
    isFollowable, // becomes up.link.isFollowable()
  },
  // We usually expose functions as `up.namespace.verb()`.
  // Frequently used functions also get a shortcut directly on `window.up`.
  follow,         // becomes up.follow()
}
```

Classes live in a folder named after the namespace that owns them, next to the namespace
file: `form.ts` beside `form/`, `layer.ts` beside `layer/`. A published class goes where its
docs are (`up.Params` is documented under `up.form`). Closely related classes share a
sub-folder, like `fragment/render/` or `layer/modes/`. Generic helper classes live in
`util/`. A class file exports the class, and an `api` if the class is published.

Only top-level classes appear on `window.up`. Internal ones (like `up.ResponseDoc`) stay there
under their flat name, marked `@internal`, because the specs are a separate bundle and can't
import them. Subclasses and helpers that used to be nested (`up.Layer.Modal`) are not on
`window.up` at all, and are named so they stand on their own (`ModalLayer`). A class named
like a browser global is a named class expression bound to an `Up` name
(`export const UpRequest = class Request …`), so it keeps its runtime name without
shadowing the global.

The entry file `src/unpoly.js` ties the modules together. It imports every module, copies
each `api` onto `window.up` (the `apis` list), then calls each `install()` (the `installs`
list, which is the explicit install order). Its comments also explain the rules for import
cycles between modules. Two modules must not contribute the same key to `window.up`, or the
later one silently replaces the earlier one; [`bin/lint`](code-style.md) reports that.

Because internal callers import functions directly, a spec that spies on `up.link.follow`
doesn't intercept calls from other modules. A function that specs need to replace is wrapped
in `mockable()`, and specs call `up.link.follow.mock()` (see
[Testing](testing.md#spying-on-unpoly-functions)).

`util.ts`, `element.ts`, `browser.ts`, `error.ts` and the classes in `util/` and `error/` are
evaluated before any feature namespace, so they never import one like `up.fragment`.
Where they need one, they call it through `window.up` at call time.


## Entry points and optional bundles

Files directly in `src/` are Webpack entry points, one per bundle we publish. Everything
in `src/unpoly/` is only ever reached through one of them.

- `src/unpoly.js` is the main bundle. It is built twice: `unpoly.js` for current
  browsers, and `unpoly.es6.js` for
  [older ones](https://unpoly.com/install/legacy-browsers).
- `src/unpoly-migrate.ts` polyfills renamed and removed APIs, so an app can
  [upgrade](https://unpoly.com/changes/upgrading) without changing all its call sites at
  once. See [Compatibility](compatibility.md#breaking-changes) for how to write one.
- `src/unpoly-bootstrap{3,4,5}.js` adapt Unpoly to
  [Bootstrap](https://unpoly.com/install/bootstrap).

Read one of the Bootstrap entries before you add anything to `src/`. They contain no
behavior at all — only configuration:

```js
up.status.config.currentClasses.push('active')
up.viewport.config.fixedTopSelectors.push('.navbar.fixed-top')
```

That is the intended shape of an optional bundle: `up.*.config` defaults for one
ecosystem, plus a sibling `.sass` file. If a bundle seems to need behavior of its own,
that behavior belongs in a namespace, reachable through config from outside.
`unpoly-migrate` is the exception, and it earns it by shipping polyfills.

A new bundle needs an entry in `tooling/build/webpack/entries.js` *and* its output files listed in
`bin/release`, or it won't be published.
