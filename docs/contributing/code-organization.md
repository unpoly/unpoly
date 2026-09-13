# Code organization

Where code lives in this repository and why: the directory layout, the `window.up` global,
which module owns which topic, how a module is structured internally, and where to find the
specs for a given file.
<!-- toc -->
- [Directory structure](#directory-structure)
  - [Where to find a module's specs](#where-to-find-a-modules-specs)
  - [Implementation plans](#implementation-plans)
- [Architecture](#architecture)
  - [Not an ESM module](#not-an-esm-module)
  - [Responsibilities](#responsibilities)
  - [Main module pattern](#main-module-pattern)
- [Entry points and optional bundles](#entry-points-and-optional-bundles)
<!-- /toc -->


## Directory structure

You will mostly make changes in `src/unpoly` and test them in `spec/unpoly`. How the specs
themselves are structured is covered in [Testing](testing.md#how-specs-are-organized).

This repository is organized like this:

```
src/                      # Webpack entry points for Unpoly's main and optional bundles
  unpoly.js               # ... Entry point for main Unpoly bundle (JS, CSS)
  unpoly-migrate.js       # ... Entry point for optional bundle that polyfills deprecated features
  ...                     # ... Other entry points for optional bundles

  unpoly/                 # Source code (JS, CSS) for main Unpoly modules
    form.js               # ... Code for up.form module
    link.js               # ... Code for up.link module
    link.sass             # ... CSS for up.link module
    layer.js              # ... Code for up.layer module
    ...                   # ... Code for other modules

    classes/              # Class definitions used by main modules
      params.js           # ... Code for up.Params class
      request.js          # ... Code for up.Request class
      response.js         # ... Code for up.Response class
      ...                 # ... Other class definitions

spec/
  unpoly/                 # Tests (Jasmine specs)
    form_spec.js          # ... Tests for up.form module
    form_switch_spec.js   # ... Tests for [up-switch], too large to keep in form_spec.js
    link_spec.js          # ... Tests for up.link module
    layer_spec.js         # ... Tests for up.layer module
    ...                   # ... Tests for other modules

    classes/              # Tests for classes in src/unpoly/classes
      params_spec.js      # ... Tests for up.Params class
      request_spec.js     # ... Tests for up.Request class
      response_spec.js    # ... Tests for up.Response class
      ...                 # ... Tests for other classes

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

### Where to find a module's specs

A module's specs are not always in a single file: a group that grew too large lives in a
sibling file sharing the module's prefix, like `form_switch_spec.js` above. See
[How specs are organized](testing.md#how-specs-are-organized) for the naming, how to
[find the spec for a feature](testing.md#finding-the-spec-for-a-feature), and
[where a new spec goes](testing.md#where-a-new-spec-goes).


### Implementation plans

A change worth more than one commit is worth a written plan first: what was decided,
what was ruled out and why, and the sequence of commits it will take. Plans go in
`docs/plans/`, which is gitignored except for its `.gitkeep`.

A plan is a working note, not a deliverable. Keeping it out of the history means it
never reaches a reviewer, while still surviving the branch switches and rebases that a
long-lived branch goes through.

Name the file after the change it plans — the request, the feature or the pull request —
so that a directory listing reads as an index:

```
docs/plans/
  pr-807-form-associated-custom-elements.md
  up-switch-array-fields.md
  optimistic-rendering.md
```


## Architecture

### Not an ESM module

Unpoly isn't an ESM module that can be imported. Instead it defines a global `window.up` and attaches all functions to that global. This is slightly unorthodox in an ESM world, but gives us some advantages:

- Non-ESM scripts can call functions like `up.form.submit()` without `import`-ing anything.
- The server-rendered HTML document can directly use Unpoly's HTML extensions (e.g. `[up-follow]`, `[up-submit]`).
- Callback attributes (like `[onclick]`, `[up-on-accepted]`) can directly call functions on the `up` global (no way to `import` here).

*Internally* Unpoly is free to use ESM modules and `import`/`export`, which Webpack will compile away.

### Responsibilities

Unpoly's functionality is handled by a number of "main modules" below. Each module handles a topic (e.g. "forms") and defines any HTML extensions and JS API to support that topic.

| Module | Topics | Example selectors | Example functions | Example events |
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

We rarely add a new main module. We sometimes rename an existing module when its responsibilities change, and the name no longer fits.


### Main module pattern

Main modules live in `src/unpoly`. E.g. `src/unpoly/link.js` defines the `up.link` module that deals with hyperlinks.

A module definition has the following jobs:

- Implement any HTML extensions, mostly new attributes like `[up-follow]`. These are either handled by event listeners, or by activating behavior on new DOM elements with a compiler.
- Define a companion JavaScript API (like `up.link.follow()`). Public JS API is exposed on the `window.up` global, internal API is hidden within closures.
- Often expose a configuration property (like `up.link.config`) that lets the developer configure the module's behavior.

To illustrate, here is a *very* simplified version of `up.link`:

```js
// An Unpoly "module" is simply an object property of the `window.up` global.
// Here we assign `up.link` to an IIFE that returns the public symbols (classic "module pattern")
up.link = (function() {
  
  // Short aliases for our two utility modules.
  const u = up.util
  const e = up.element
  
  // Settings to globally configure link handling.
  // Published as up.link.config.
  const config = new up.Config(() => ({
    followSelector: '[up-follow]',
  }))

  // Programmatically follow a link.
  // Published as up.link.follow()
  function follow(link) {
    // Allow listeners to prevent the follow
    if (emitFollowEvent(link).defaultPrevented) return
    
    // Instantiate a helper class to handle the following
    return new up.LinkFollower(link).execute()
  }

  // Return whether a link will be followed by Unpoly.
  // Published as up.link.isFollowable()
  function isFollowable(link) {
    return !!link.closest(config.followSelector)
  }

  // Internal helper to emit an up:link:follow event.
  // Not published.
  function emitFollowEvent(link) {
    return up.emit(link, 'up:link:follow')
  }
  
  // Handle clicks on links with an [up-follow] attribute
  document.addEventListener('click', function(event) {
    if (isFollowable(event.target)) {
      follow(event.target)
    }
  })
  
  // Return the public functions and values that will be set as up.link properties.
  // Do not return internal helpers.
  return {
    config,       // becomes up.link.config
    follow,       // becomes up.link.follow()
    isFollowable, // becomes up.link.isFollowable()
  }
})()

// We usually expose functions as `up.module.verb()`.
// Frequently used functions are aliased directly on `window.up` to shorten call sites.
up.follow = up.link.follow
```


## Entry points and optional bundles

Files directly in `src/` are Webpack entry points, one per bundle we publish. Everything
in `src/unpoly/` is only ever reached through one of them.

- `src/unpoly.js` is the main bundle. It is built twice: `unpoly.js` for current
  browsers, and `unpoly.es6.js` for
  [older ones](https://unpoly.com/install/legacy-browsers).
- `src/unpoly-migrate.js` polyfills renamed and removed APIs, so an app can
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
that behavior belongs in a main module, reachable through config from outside.
`unpoly-migrate` is the exception, and it earns it by shipping polyfills.

A new bundle needs an entry in `tooling/build/webpack/entries.js` *and* its output files listed in
`bin/release`, or it won't be published.
