# Code organization

Where code lives, why Unpoly is a `window.up` global, which namespace owns which topic,
how a namespace is structured internally, and how modules import each other.

<!-- toc -->
- [Directory structure](#directory-structure)
  - [Module or class](#module-or-class)
  - [File names](#file-names)
  - [Where to find a namespace's specs](#where-to-find-a-namespaces-specs)
  - [Implementation plans](#implementation-plans)
- [Architecture](#architecture)
  - [Not an ESM module](#not-an-esm-module)
  - [Responsibilities](#responsibilities)
  - [Namespace pattern](#namespace-pattern)
  - [Imports, exports and types](#imports-exports-and-types)
- [Entry points and optional bundles](#entry-points-and-optional-bundles)
<!-- /toc -->


## Directory structure

You will mostly make changes in `src/unpoly` and test them in `spec/unpoly`. How the specs
themselves are structured is covered in [Testing](testing.md#how-specs-are-organized).

This repository is organized like this:

```
src/                      # Entry points for Unpoly's main and optional bundles
  unpoly.ts               # ... Entry point for main Unpoly bundle (JS, CSS)
  unpoly-migrate.ts       # ... Entry point for optional bundle that polyfills deprecated features
  ...                     # ... Other entry points for optional bundles

  unpoly/                 # Source code (TS, CSS) and API docs for Unpoly's namespaces
    form.ts               # ... Code for up.form namespace
    form.md               # ... API docs for up.form namespace (see Documentation)
    form/                 # ... Classes and types owned by up.form
      types.ts            # ...... Types for up.form
      params.ts           # ...... Code for up.Params class
      params.md           # ...... API docs for up.Params class
      ...
    link.ts               # ... Code for up.link namespace
    link.sass             # ... CSS for up.link namespace
    layer.ts              # ... Code for up.layer namespace
    layer/                # ... Classes owned by up.layer
      base.ts             # ...... Code for up.Layer class
      modes/              # ...... One class per layer mode (ModalLayer, PopupLayer, ...)
    fragment/             # ... Classes owned by up.fragment
      matching/           # ...... The selector engine behind fragment lookups
      rendering/          # ...... The functions and classes behind up.render()
    framework/            # ... Classes owned by up.framework (Registry)
    util/                 # ... Generic helper classes (Config, Rect, ...)
    internal.ts           # ... Internals the specs and unpoly-migrate need, published as up.internal
    pages/                # ... Guide pages and shared partials (see Documentation)
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
  dev                     # ... Start or stop dev environment (build watcher, Jasmine runner)
  test                    # ... Run tests from terminal (will execute in headless Chrome internally)
  find-spec               # ... Find specs by a phrase in their describe()/it() titles
  ...                     # ... other dev scripts

tooling/                  # Our own dev machinery, never shipped (rarely need to edit here)
  runner/                 # ... Runs the specs: server, terminal driver, in-page reporter
  scratch/                # ... Pages for trying a change by hand (see Trying out changes)
  build/                  # ... bin/build: esbuild, Terser and the build watcher
  dev_env.mjs             # ... The dev environment behind bin/dev
  find_spec.mjs           # ... Spec-title search behind bin/find-spec
  test/                   # ... Unit tests for all of the above (bin/self-test)

docs/                     # Documentation for contributors, never shipped
  contributing/           # ... The guides linked from CONTRIBUTING.md
  plans/                  # ... Implementation plans (gitignored)

dist/                     # Output directory for the build (gitignored, never edit directly)
  unpoly.js               # ... Main Unpoly bundle (JS)
  unpoly.css              # ... Main Unpoly bundle (CSS)
  unpoly.min.js           # ... Minified Unpoly bundle (JS)
  unpoly.min.css          # ... Minified Unpoly bundle (CSS)
  ...
```

### Module or class

Choose the shape that makes the callers' code simplest, even if the implementation gets
longer. Any minifier shortens a module's function names, but class members only when
properties are mangled, which apps that minify Unpoly themselves usually don't do. So write a
module (a file with exported functions and private helpers), and a class only when:

- callers keep an object and call it more than once, or at different times;
- several instances live at the same time, each with its own state;
- subclasses override parts of its behavior;
- it's a singleton with mutable state. Initialize its state only in a `reset()` method, which
  the constructor calls and which runs on `up:framework:reset`. Teardown, like closing overlays
  or finishing animations, comes first in `reset()`.

A one-shot computation is a function, even when its helpers share values: pass each helper
the values it needs. Keep a class only when most helpers need most of the same values.

A class that only its main module uses doesn't need a function facade of its own.

A base class may exist only to share state and the methods that use it. Share stateless
helpers as functions instead of inheriting them.

### File names

A file whose main export is a class is named after that class, in snake case:
`UpdateLayerPlan` lives in `update_layer_plan.ts`. A module file is named after its main
export where one dominates (`render_from_url.ts`), or after its topic otherwise
(`render_options.ts`).

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

*Internally* Unpoly's files are ES modules that `import` from each other. esbuild bundles them into one script that sets `window.up`. See the [namespace pattern](#namespace-pattern) below.

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
| `up.error` | Error classes, expected rejections | — | `up.error.muteUncriticalRejection()` | — |

We rarely add a new namespace. We sometimes rename an existing namespace when its responsibilities change, and the name no longer fits.


### Namespace pattern

Namespaces live in `src/unpoly`. E.g. `src/unpoly/link.ts` defines the `up.link` namespace that deals with hyperlinks.

A namespace definition has the following jobs:

- Implement any HTML extensions, mostly new attributes like `[up-follow]`. These are either handled by event listeners, or by activating behavior on new DOM elements with a compiler.
- Define a companion JavaScript API (like `up.link.follow()`), published on the `window.up` global.
- Often expose a configuration property (like `up.link.config`) that lets the developer configure the namespace's behavior.

Each namespace is an ES module that exports:

- **Named functions**, which other files `import`. Internal code never calls through the global (`up.link.follow()`), it imports `follow` from `./link.js`.
- **`api`**, the module's contribution to `window.up`: the namespace object, plus any shortcuts like `up.follow`. Public names may differ from the internal ones (`get: getSmart`, `config: linkConfig`). It only holds public API, never an internal helper.
- Optionally **`install()`**, which performs all the module's side effects: registering compilers, macros and event listeners.

A module's top level only declares things. Nothing happens when it is imported.

To illustrate, here is a *very* simplified version of `up.link`:

```ts
// Import the styles, functions, classes and types we need (see "Imports, exports and types" below).
import './link.sass'
import { newConfig } from './util/config.js'
import { emit } from './event.js'
import type * as t from './link/types.js'
export type * from './link/types.js'
import { followLink } from './link/follow_link.js'

// Settings to globally configure link handling.
// Published as up.link.config.
export const linkConfig = newConfig('up.link.config', (): t.LinkConfig => ({
  followSelector: '[up-follow]',
}))

// Programmatically follow a link.
// Published as up.link.follow() and up.follow()
export function follow(link: Element): void {
  // Allow listeners to prevent the follow
  if (emitFollowEvent(link).defaultPrevented) return

  // Call a function from the module's folder to handle the following
  followLink(link)
}

// Return whether a link will be followed by Unpoly.
// Published as up.link.isFollowable()
export function isFollowable(link: Element): boolean {
  return !!link.closest(linkConfig.followSelector)
}

// Internal helper to emit an up:link:follow event.
// Not exported, not published.
function emitFollowEvent(link: Element): t.LinkFollowEvent {
  return emit(link, 'up:link:follow')
}

// Side effects only run when the entry file calls install().
export function install(): void {
  // Handle clicks on links with an [up-follow] attribute
  document.addEventListener('click', function(event) {
    let link = event.target as Element
    if (isFollowable(link)) {
      follow(link)
    }
  })
}

// The public functions and values that will be set as up.link properties.
// Do not add internal helpers.
export const api = {
  link: {
    config: linkConfig, // becomes up.link.config
    follow,             // becomes up.link.follow()
    isFollowable,       // becomes up.link.isFollowable()
  },
  // We usually expose functions as `up.namespace.verb()`.
  // Frequently used functions also get a shortcut directly on `window.up`.
  follow,               // becomes up.follow()
}
```

Classes live in a folder named after the namespace that owns them, next to the namespace
file: `form.ts` beside `form/`, `layer.ts` beside `layer/`. A published class goes where its
docs are (`up.Params` is documented under `up.form`). Closely related classes share a
sub-folder, like `fragment/rendering/` or `layer/modes/`. Generic helper classes live in
`util/`. A class file exports the class, and an `api` if the class is public. Classes are
named so they stand on their own (`ModalLayer`, not a nested `up.Layer.Modal`). A class named
like a browser global gets an `Up` prefix (`UpRequest`, see
[Naming](code-style.md#names-that-collide-with-globals)).

`window.up` only holds public API. The specs and `unpoly-migrate` are separate bundles that
can't import from `src/unpoly`, so the internal functions and classes they need are published
on `up.internal`. `src/unpoly/internal.ts` imports each one and lists it under its export name,
flat, without a namespace: `up.internal.sprintf`, `up.internal.ResponseDoc`. Because every key
is an import binding, two keys can't collide. When an export name only makes sense next to its
module (`getSubtree` in `viewport.ts`), rename the export where it is defined
(`getViewportSubtree`) rather than the key. Add an internal only when a spec or
`unpoly-migrate` needs it.

The entry file `src/unpoly.ts` ties the modules together. It imports every module, copies
each `api` onto `window.up` (the `apis` list), then calls each `install()` (the `installs`
list, which is the explicit install order). Its comments also explain the rules for import
cycles between modules. Two modules must not contribute the same key to `window.up`, or the
later one silently replaces the earlier one; [`bin/lint`](code-style.md) reports that, and that
`up.internal` keys are their export names.

Because internal callers import functions directly, a spec that spies on `up.link.follow`
doesn't intercept calls from other modules. A function that specs need to replace is wrapped
in `mockable()`, and specs call `up.link.follow.mock()` or `up.internal.trackFields.mock()`
(see [Testing](testing.md#spying-on-unpoly-functions)).

`util.ts`, `element.ts`, `browser.ts`, `error.ts` and the classes in `util/` and `error/` are
evaluated before any feature namespace, so they never import one like `up.fragment`.
Where they need one, move the function down into a module they may import, as we did with
`copyCursorProps()` in `element.ts`. Instead of checking `instanceof` against a class
from a feature namespace, define a protocol key that the class implements, like
`up.util.copy.key`: `error.ts` defines `isCritical.key`, and `up.Response` implements it. Only
when neither is possible, call the function through the global at call time, as `Config` logs
with `up.internal.printToError()`.

### Imports, exports and types

A **main module** is a namespace file directly in `src/unpoly/`, like `fragment.ts` or
`layer.ts`. It owns the folder of the same name: `fragment/` holds up.fragment's classes and
types. How to write the types themselves is covered in [Code style](code-style.md#typescript).

Import other modules by their `.js` name (`import { emit } from './event.js'`), also when they
are `.ts` files. TypeScript and the build both resolve this to `event.ts`.

**Types.** A module's types live in `<module>/types.ts`, next to its classes:
`fragment/types.ts` for `fragment.ts`. Their `/** */` comments stay with them. The module
imports them as `t` and re-exports them, so other modules import types from the main module,
never from a `types.ts`:

```ts
import type * as t from './fragment/types.js'
export type * from './fragment/types.js'
```

Files inside the module's own folder are the exception: they import the module's types
straight from its `types.ts`, also as `t`. That's `import type * as t from './types.js'`, or
`'../types.js'` from a sub-folder like `layer/modes/`. They still import values from the main
module. In the header, the `t` import comes after the main modules (step 4 below).

A type that only one file uses stays in that file. A module with only a few types, like
`log.ts` or `framework.ts`, keeps them in its main file and has no `types.ts`.

**Events.** An event's type lives with its module's other types, usually in `types.ts`. The
same file lists the module's events in `UpEventMap`, so `up.on()` and `up.emit()` know their types:

```ts
declare module '../event.js' {
  interface UpEventMap {
    'up:form:submit': FormSubmitEvent
  }
}
```

**Namespace aliases.** `util.ts` and `element.ts` are imported as `import * as u` and
`import * as e`. Aliases are lowercase (`u`, `e`, `t`): lowercase means a module, uppercase a
class, and single uppercase letters are taken by type parameters. Use an alias only as
`u.member`, for values and types alike (`u.map()`, `u.List<Element>`). Passing the alias
itself around makes esbuild build the module's namespace object, which is 2.4 KB for util.
Don't shadow an alias with a local variable (`catch (error)`, not `catch (e)`), and don't give a
type parameter an alias's name. `bin/lint` reports the misuse and the shadowing
(`unpoly/namespace-aliases`).

**Other main modules** get one `import { … }` statement each, with types inline as `type X`.
Import a class from the main module that owns it, not from its file:
`import { Layer, layerConfig, type LayerMode } from './layer.js'`.

**Header order:**

1. The module's Sass file
2. `u` and `e`, then any class from `util/` or `element/` (see below)
3. Other main modules, one statement each, alphabetically by path
4. Own types: `import type * as t` and `export type *`
5. Own classes and other files of the module's folder, alphabetically by path. When the module
   re-exports a class it also imports, `export { X }` directly follows the import. A class the
   module only re-exports gets a single `export { X } from …` line.

```ts
import './fragment.sass'
import * as u from './util.js'
import * as e from './element.js'
import { CannotTarget, fail } from './error.js'
import { emit, on } from './event.js'
import { Layer, layerConfig } from './layer.js'
import type * as t from './fragment/types.js'
export type * from './fragment/types.js'
import { findFragment } from './fragment/matching/fragment_finder.js'
import { RenderJob } from './fragment/rendering/render_job.js'
export { RenderJob }
export { RenderResult } from './fragment/rendering/render_result.js'
```

A module re-exports exactly the classes, types and values of its folder that other modules
import, nothing more. `internal.ts` counts as another module, since it's how the specs reach a
class.

> [!WARNING]
> A re-export can change when an importer gets the class. In an import cycle, the importer
> may be evaluated before the main module has imported the class file, and esbuild gives it a
> silent `undefined` instead of an error. Before a module imports a class through a re-export,
> check that it doesn't use the class while it is being defined (`extends`, a static block, a
> top-level call). The rules for cycles are in the comments of `src/unpoly.ts`.
> `bin/self-test` fails if a module reads a binding before it is evaluated.

A few imports can't go through the owning module:

- `util.ts` doesn't re-export `Config`, and `element.ts` doesn't re-export `OptionsParser`,
  because they import modules that are evaluated later (`element.ts`, `fragment.ts`). Import
  them from their files, right after `u` and `e`: `import { newConfig } from './util/config.js'`.
- A module that uses a class at its top level, like `new Registry()` in `status.ts`, imports it
  from its file when the owning module may not be evaluated yet at that point. Say so in a comment
  above the import.
- `internal.ts` imports util and element functions by name, since every `up.internal` key must be
  a named import (see above).
- The entry file `src/unpoly.ts` follows none of these rules. It imports every module as a
  namespace (`import * as util`) and some class files directly, in an order that controls how
  import cycles are entered. Its comments explain that order.


## Entry points and optional bundles

Files directly in `src/` are entry points, one per bundle we publish. Everything
in `src/unpoly/` is only ever reached through one of them.

- `src/unpoly.ts` is the main bundle. It is built twice: `unpoly.js` for current
  browsers, and `unpoly.es6.js` for
  [older ones](https://unpoly.com/install/legacy-browsers).
- `src/unpoly-migrate.ts` polyfills renamed and removed APIs, so an app can
  [upgrade](https://unpoly.com/changes/upgrading) without changing all its call sites at
  once. See [Compatibility](compatibility.md#breaking-changes) for how to write one.
- `src/unpoly-bootstrap{3,4,5}.ts` adapt Unpoly to
  [Bootstrap](https://unpoly.com/install/bootstrap).

Read one of the Bootstrap entries before you add anything to `src/`. They contain no
behavior at all — only configuration:

```ts
up.status.config.currentClasses.push('active')
up.viewport.config.fixedTopSelectors.push('.navbar.fixed-top')
```

That is the intended shape of an optional bundle: `up.*.config` defaults for one
ecosystem, plus a sibling `.sass` file. If a bundle seems to need behavior of its own,
that behavior belongs in a namespace, reachable through config from outside.
`unpoly-migrate` is the exception, and it earns it by shipping polyfills.

A new bundle needs an entry in `tooling/build/bundles.mjs` *and* its output files listed in
`bin/release`, or it won't be published.
