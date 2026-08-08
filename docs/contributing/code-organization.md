# Code organization

## Directory structure / Where to find files

You will mostly make changes in `src/unpoly` and test them in `spec/unpoly`.

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
  ...                     # ... other dev scripts

runner/                   # The Jasmine spec runner server (rarely need to edit here)
  ...

webpack/                  # Webpack configuration (rarely need to edit here)
  ...

node_modules/             # Development dependencies for tests and Webpack (Unpoly itself has no dependencies)
  ...

dist/                     # Output directory for the Webpack bundler (gitignored, never edit directly)
  unpoly.js               # ... Main Unpoly bundle (JS)
  unpoly.css              # ... Main Unpoly bundle (CSS)
  unpoly.min.js           # ... Minified Unpoly bundle (JS)
  unpoly.min.css          # ... Minified Unpoly bundle (CSS)
  ...
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

| Module | Topics | Selectors | Functions | Events |
|---|---|---|---|---|
| `up.link` | Hyperlinks, preloading, lazy-loading | `[up-follow]`, `[up-preload]`, `[up-defer]` | `up.follow()` | `up:link:follow` |
| `up.form` | Forms, validation, dependent fields | `[up-submit]`, `[up-validate]`, `[up-switch]` | `up.submit()`, `up.watch()` | `up:form:submit`, `up:form:validate` |
| `up.script` | Custom JavaScript, element data | `[up-data]` | `up.compiler()`, `up.hello()` | `up:assets:changed` |
| `up.layer` | Overlays, subinteractions | `[up-layer=new]`, `[up-accept]` | `up.layer.open()`, `up.layer.ask()` | `up:layer:accepted` |
| `up.fragment` | Rendering, targeting, render lifecycle | `[up-main]`, `[up-keep]` | `up.render()`, `up.reload()` | `up:fragment:loaded`, `up:fragment:inserted` |
| `up.radio` | Passive updates, polling | `[up-hungry]`, `[up-poll]` | — | `up:fragment:poll` |
| `up.motion` | Transitions, animations | `[up-transition]` | `up.morph()`, `up.animate()` | `up:motion:finish` |
| `up.status` | Navigation bars, loading state, previews | `[up-nav]`, `.up-current`, `[up-preview]` | `up.preview()` | — |
| `up.network` | HTTP client, caching, offline | — | `up.request()`, `up.cache.expire()` | `up:network:late`, `up:request:offline` |
| `up.event` | Emitting and observing events | — | `up.on()`, `up.emit()` | — |
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

> **TODO:** This section is still an outline. The notes below are the intended
> scope, not finished prose.

- Entrypoints and optional bundles
