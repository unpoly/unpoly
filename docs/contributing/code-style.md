# Code style

How Unpoly's own source is written. Some of these rules are enforced by Oxlint (`bin/lint`),
most are not.

<!-- toc -->
- [Moving to TypeScript](#moving-to-typescript)
- [Every byte counts](#every-byte-counts)
- [Leave it to the minifier](#leave-it-to-the-minifier)
- [No dependencies](#no-dependencies)
- [No jQuery](#no-jquery)
- [Naming](#naming)
- [Private members and the minified build](#private-members-and-the-minified-build)
- [Linting](#linting)
<!-- /toc -->


## Moving to TypeScript

We migrated Unpoly to TypeScript one module at a time, leaf modules first. All of `src/` is
TypeScript now, except the ERB template `namespace.js.erb`. The types are still loose, and many
are provisional.

The build doesn't use TypeScript at all: esbuild strips the types from each file, and never
checks them. The only type check is `bin/typecheck`, which takes about two seconds and runs
TypeScript 7's checker twice:

- `tsconfig.json` checks all of `src/` with loose settings.
- `tsconfig.core.json` checks Unpoly's core (`src/unpoly.ts` and `src/unpoly/`) with stricter
  settings, so far `noImplicitAny`. `unpoly-migrate` isn't part of this check. Neither are the
  change classes in `src/unpoly/fragment/render/change/`, which wait for a restructure.
  TypeScript can't leave out a folder that other core files import, so `bin/typecheck` drops
  that folder's errors instead (see `NOT_YET_STRICT` there).

When a folder passes the stricter settings, remove it from `NOT_YET_STRICT`. When all of `src/`
passes a setting, move it to `tsconfig.json`. CI runs `bin/typecheck` as a separate job, and a
type error in either check fails the workflow.

In a `.ts` module:

- Import other modules by their `.js` name (`import { map } from './util.js'`), also when they
  are `.ts` files. TypeScript and the build both resolve this to `util.ts`.
- Annotate exported functions (parameters, and return types where they aren't obvious). Let
  TypeScript infer the types of local variables, unless a type helps the reader.
- Give a reusable shape a name (`export type`, `export interface`), like `List<T>` or
  `NormalizeURLOptions`. Mark a type that isn't public API with `@internal` in a `/** */` comment.
- Declare class fields with `declare` (`declare left: number`). A field without `declare` makes
  the compiled class define the property, which costs bytes and changes behavior (differently in
  `unpoly.js` and `unpoly.es6.js`, whose targets treat class fields differently). `bin/lint`
  reports a field without `declare` or an initializer.
- Core code has no implicit `any`: type every parameter, a `let` without an initializer, and an
  empty `{}` or `[]` that collects values. Callbacks get their parameter types from the function
  they're passed to (`up.compiler()`, `up.on()`), so prefer typing that function over annotating
  each callback.
- When a function resolves its argument by reassigning it (`element = getSmart(element)`),
  TypeScript narrows the parameter to a member of its declared type: an `ElementOrSelector`
  becomes an `Element`, never the `HTMLElement` that `getSmart()` returns. When that's enough,
  type the parameter as usual. Otherwise write the typed signature as an overload, and give the
  implementation an `any` parameter with a comment:

  ```ts
  export function morph(oldElement: ElementOrSelector, newElement: ElementOrSelector, ...): Promise<void>
  // The elements are resolved in place. TypeScript would narrow them to Element, not HTMLElement.
  export async function morph(oldElement: any, newElement: any, ...) {
    oldElement = getSmart(oldElement)
  ```

  Callers get the typed signature, the body stays as it was. A new local variable or a cast would be
  checked, but changes the emitted code. A function expression passed to `mockable()` can't have
  overloads. Type its rest parameter as a union of tuples (like `trackFields()` does), or as `any`
  with a comment.
- Where the honest code would emit differently, a cast with a comment is fine, e.g.
  `(now as any) - (this.loadedAt as any)` instead of `now.getTime() - …`.
- `any` is fine where a precise type would be complex.
- Unpoly's events are typed by name, like DOM events in `HTMLElementEventMap`. `UpEventMap` in
  `event.ts` maps each event type to its event object, and `up.on()` and `up.emit()` look it up. A
  new event gets a type in the module that documents it (like `LinkFollowEvent` in `link.ts`),
  with the properties from its doc comment, and an entry in the map.
- Typing must not change what the build emits. Compare `unpoly.min.js` before and after.
- The global `up` has the type `Up`, which `src/unpoly.ts` builds from every module's `api`. A
  key that no `api` contributes is declared by merging it into `Up` (or into a namespace's type)
  with a `declare module` block, next to the code that adds it.
- `unpoly-migrate` is loosely typed for now. Its files are scripts, not modules: they patch
  `window.up` and import nothing, since `unpoly-migrate.js` is a separate bundle and a class
  imported from `src/unpoly/` would be a second copy. Each file declares the keys it adds to `up`,
  as `any` where a precise type isn't easy; a deprecated alias gets the type of its replacement.
  A wrapper that forwards its `...args` to an overloaded function casts the callee:
  `(up.element.get as any)(...args)`. Type parameters where it's easy. Core declares the hooks it
  calls on `up.migrate` in `migrate_stub.ts`, and migrate marks each implementation with a "Core
  calls this hook" comment.

Public types also appear in [doc comments](documentation.md), in a notation loosely inspired
by TypeScript. Those document intent for the reader; no tool verifies them.


## Every byte counts

Unpoly isn't the smallest library, but it exposes a lot of functionality per KB, and
[every line must pull its weight](philosophy.md#values). Two consequences you meet
while writing code:

- **Unpoly reuses itself heavily.** Before writing a helper, look for an existing one
  in `up.util` or `up.element`.
- **Pass large option hashes around**, rather than picking values apart and
  re-composing smaller ones further down. Render options travel through many
  functions, and threading the whole object costs fewer bytes than rebuilding it at
  each level.

We sometimes accept a suboptimal pattern because it saves bytes, but only bytes a minifier
can't recover.


## Leave it to the minifier

The minifier already collapses branches into ternaries and rewrites control flow, so
hand-minifying saves nothing and leaves us maintaining the harder version. Shorten code by
removing work or reusing a helper, not by compressing its syntax:

- **Don't chain ternaries** in place of `if` / `else if` / `else`.
- **Early returns are for guards** that reject input before the real work starts, not for
  avoiding an `else`.


## No dependencies

Unpoly has zero runtime dependencies, and always will.

Development dependencies are fine. The spec runner, the specs and the build pipeline
use plenty.


## No jQuery

We don't use jQuery. Public functions accept a jQuery collection wherever they accept
an element, but that is interop for apps that have jQuery — nothing in Unpoly requires
it.

Some legacy specs still use jQuery. Refactor them away when you touch them.


## Naming

Public names are brief. They appear in every call site, and often in an HTML
attribute.

Acronyms are uppercased: `parseURL()`, not `parseUrl()`. Same for `escapeHTML()` or
`parseRelaxedJSON()`. A *leading* acronym stays lowercase, as camelCase requires:
`jsonAttr()`.


## Private members and the minified build

Members prefixed with `_` are internal, and the minified build *mangles* their names to save
bytes. So a member that a spec reaches by name — `spyOn(up.internal.Switcher.prototype, '…')`, or a
direct call — cannot be `_`-prefixed: the name it asks for does not exist in
`dist/unpoly.min.js`. If a method is tested directly, drop the underscore and note why.


## Linting

`bin/lint` runs [Oxlint](https://oxc.rs/docs/guide/usage/linter) over `src/`, `spec/` and
`tooling/`, and checks that no two modules contribute the same key to `window.up`
(`tooling/lint/api_collisions.mjs`). Extra arguments are forwarded to Oxlint, so
`bin/lint --fix` works.

The rules are in `.oxlintrc.json` in the project root. Most are Oxlint's own, which are written in
Rust. The code style rules from `@stylistic/eslint-plugin` and our own in
`tooling/lint/unpoly_plugin.mjs` run in JavaScript. Editors with the Oxc extension use the same
config. To silence a rule for one line, write `// oxlint-disable-line rule-name`.

Lint errors in `src/` fail the build, so `bin/test` surfaces them for you. Specs and the tooling
are not part of the build, so only `bin/lint` (or CI's lint job) checks those.
