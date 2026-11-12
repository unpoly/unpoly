# Code style

How Unpoly's own source is written. Some of these rules are enforced by Oxlint (`bin/lint`),
most are not.

<!-- toc -->
- [TypeScript](#typescript)
  - [Type checking](#type-checking)
  - [Writing types](#writing-types)
  - [Strict checks](#strict-checks)
  - [The global `up` and unpoly-migrate](#the-global-up-and-unpoly-migrate)
- [Every byte counts](#every-byte-counts)
- [Leave it to the minifier](#leave-it-to-the-minifier)
- [No dependencies](#no-dependencies)
- [No jQuery](#no-jquery)
- [Naming](#naming)
  - [Names that collide with globals](#names-that-collide-with-globals)
  - [Export names](#export-names)
- [Private members and the minified build](#private-members-and-the-minified-build)
- [Linting](#linting)
<!-- /toc -->


## TypeScript

All of `src/` is TypeScript, except the ERB template `namespace.js.erb`. The code base is
being migrated to the conventions below, and some of their lint rules don't exist yet. New and
changed code follows them. Where modules, their types and their imports live is covered in
[Code organization](code-organization.md#imports-exports-and-types).

### Type checking

The build doesn't use TypeScript at all: esbuild strips the types from each file, and never
checks them. The only type check is `bin/typecheck`, which takes about two seconds and runs
TypeScript 7's checker twice:

- `tsconfig.json` checks all of `src/` with loose settings.
- `tsconfig.core.json` checks Unpoly's core (`src/unpoly.ts` and `src/unpoly/`) with stricter
  settings, so far `noImplicitAny` and `strictNullChecks`. `unpoly-migrate` isn't part of this
  check, so core can't use the API that only migrate adds, like `up.migrate.deprecated()` or
  `config.patch()`. A core folder that doesn't pass the stricter settings yet can be listed in
  `NOT_YET_STRICT` (empty for now). TypeScript can't leave out a folder that other core files
  import, so `bin/typecheck` runs the core check a second time without the stricter settings,
  and takes that folder's errors from the second run (see `NOT_YET_STRICT` and
  `STRICT_SETTINGS` there).

When a folder passes the stricter settings, remove it from `NOT_YET_STRICT`. When all of `src/`
passes a setting, move it to `tsconfig.json`. CI runs `bin/typecheck` as a separate job, and a
type error in either check fails the workflow.

Typing must not change what the build emits. Compare `unpoly.min.js` before and after.

Public types also appear in [doc comments](documentation.md), in a notation loosely inspired
by TypeScript. Those document intent for the reader; no tool verifies them.

### Writing types

- **Object shapes are interfaces.** Every object shape is an `interface`, including the
  properties Unpoly sets on elements (`interface FragmentElement extends Element { … }`). Use
  `type` only for unions, tuples, function types and aliases. An interface can be passed where
  a `PlainObject` is expected. Lint enforces this with `consistent-type-definitions`.
- **`?` for optional values.** Write `origin?: Element`, not `origin: Element | undefined`,
  for parameters, properties and `declare`d class fields. Return types, and a parameter
  followed by a required one, still need `| undefined`.
- **Named functions declare their return type**, exported or not:

  ```ts
  function isAlive(fragment: Element): boolean {
  ```

  This includes class methods, and an arrow function assigned to an untyped `const`. Agents
  (and humans) read code with `grep`, not by hovering, and an explicit type catches an
  accidental widening where it happens. Lint enforces this with `explicit-function-return-type`.

  Inline callbacks and functions that get their type from context stay inferred. So do
  functions in an object literal and a function returned directly by a named function.
- **Local variables are inferred.** Annotate one where inference can't do it (see
  [Strict checks](#strict-checks)), or where a type helps the reader.
- **Refactor before type acrobatics.** When a type is hard to write, change the code so it's
  easy to type. Don't build intersections, `Pick` or `Omit` where a refactor or a named type
  does.
- **Share slightly wider types.** One `LookupOptions` for all of up.fragment's lookups beats a
  precise options type per function. Don't widen where that loses a real check.
- **Real types instead of `PlainObject`**, where that's cheap. `any` is fine where a precise
  type would be complex.
- **No cast that a refactor can remove.** A cast is fine where TypeScript can't know
  (`affix(…) as HTMLFormElement`), or where the honest code would emit differently, with a
  comment: `(now as any) - (this.loadedAt as any)` instead of `now.getTime() - …`.
- **Declare class fields** with `declare` (`declare left: number`). A field without `declare`
  makes the compiled class define the property, which costs bytes and changes behavior
  (differently in `unpoly.js` and `unpoly.es6.js`, whose targets treat class fields
  differently). `bin/lint` reports a field without `declare` or an initializer.
- **Mark a type that isn't public API** with `@internal` in its `/** */` comment.
- **A type parameter never takes the name of a namespace alias** (`u`, `e`, `t`).
- **Type a config once**, as the interface its defaults function returns. `newConfig()` returns
  it as a `ConfigWith<…>`, so the call site needs no cast:

  ```ts
  export const linkConfig = u.newConfig('up.link.config', (): t.LinkConfig => ({ … }))
  ```

- **Events are interfaces that extend `UpEvent`**, or the event they build on. Use one line
  per property when that's clearer:

  ```ts
  /** The `up:fragment:kept` event. */
  export interface FragmentKeptEvent extends UpEvent {
    newFragment: Element
    newData: PlainObject
  }

  /** The `up:fragment:keep` event. */
  export interface FragmentKeepEvent extends FragmentKeptEvent { renderOptions: RenderOptions }
  ```

  `UpEventMap` maps each event type to its interface, like `HTMLElementEventMap` does for DOM
  events, and `up.on()` and `up.emit()` look it up. A new event gets an interface with the
  properties from its doc comment, and an entry in its module's `UpEventMap` block (see
  [Code organization](code-organization.md#imports-exports-and-types) › Events).

### Strict checks

- Core code has no implicit `any`: type every parameter, a `let` without an initializer, and an
  empty `{}` or `[]` that collects values. Callbacks get their parameter types from the function
  they're passed to (`up.compiler()`, `up.on()`), so prefer typing that function over annotating
  each callback.
- Core code passes `strictNullChecks`. When TypeScript says a value may be `null` or
  `undefined`, and the function you pass it to already handles that, widen the parameter's
  type (`origin?: Element`). When something guarantees the value, assert it with `!`, and say
  what guarantees it in a comment unless the code nearby shows it. Don't add a runtime check
  for a case that can't happen. A value that can really be missing, and then breaks something,
  is a bug: fix it in its own change, with a spec.
- When a function resolves its argument by reassigning it (`element = getSmart(element)`),
  TypeScript narrows the parameter to a member of its declared type: an `ElementOrSelector`
  becomes an `Element`, never the `HTMLElement` that `getSmart()` returns. When that's enough,
  type the parameter as usual. Otherwise write the typed signature as an overload, and give the
  implementation the resolved type:

  ```ts
  get(request: UpRequest | RequestOptions): UpRequest | undefined
  // The request is wrapped in place, so the implementation takes the wrapped type.
  get(request: UpRequest): UpRequest | undefined {
    request = this._wrap(request)
  ```

  Callers get the typed signature, and the body stays as it was. This works for methods, whose
  parameters TypeScript compares bivariantly. A function declaration's overload must be
  assignable to its implementation once `strictFunctionTypes` is on (TS2394), so a function
  takes `any` instead, with a comment (like `morph()`). A cast at each use would work too, and
  emits nothing, but it takes one cast per use. A new local variable would change the emitted
  code. A function expression passed to `mockable()` can't have overloads. Type its rest
  parameter as a union of tuples (like `trackFields()` does), or as `any` with a comment.

### The global `up` and unpoly-migrate

- The global `up` has the type `Up`, which `src/unpoly.ts` builds from every module's `api`. A
  key that no `api` contributes is declared by merging it into `Up` with a `declare module`
  block, next to the code that adds it. A namespace's type can't be merged into. To add keys to
  a namespace, redeclare the namespace with an intersection, like
  `util: CoreApi['util'] & { … }`. Only one place may redeclare a namespace: a second,
  different redeclaration fails with TS2717 ("Subsequent property declarations must have the
  same type").
- `unpoly-migrate`'s files are scripts, not modules: they patch `window.up` and import nothing
  at runtime, since `unpoly-migrate.js` is a separate bundle and a class imported from
  `src/unpoly/` would be a second copy.
- A migrate file has no `import` or `export` statement at all, not even `import type`: esbuild
  would turn the script into an ES module, which changes the bundle. It reaches a core type
  through an alias at the top of the file, sorted by path like an import header:
  `type RenderOptions = import('../unpoly/fragment.js').RenderOptions`. The alias is erased.
  The types of `up.migrate` and its helpers live in `migrate/types.ts`, which nothing bundles,
  so other migrate files can share them.
- Each migrate file declares the keys it adds to `up`; a deprecated alias gets the type of its
  replacement. A method added to a class like `up.Layer` is merged into the class's interface.
  The implementations take their types from these declarations, so
  `up.element.matches = function(element, selector) {…}` needs no annotations. A hook that sees
  keys core no longer knows names them in an interface (`LegacyCompiler`), or takes a
  `PlainObject`.
  A wrapper that forwards its `...args` casts the callee unless the callee has a rest
  parameter: `(up.element.get as any)(...args)`. TypeScript only spreads an `any[]` into a rest
  parameter (TS2556). Type parameters where it's easy. Core declares the hooks it
  calls on `up.migrate` in `migrate_stub.ts`, and migrate marks each implementation with a "Core
  calls this hook" comment.


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

### Names that collide with globals

A class or function named like a likely browser or JavaScript global gets an `Up` prefix:
`UpRequest`, `UpResponse`, `UpURLPattern`, `UpError`, `UpEvent`, `UpEventListener`,
`UpRequestCache`. Otherwise a forgotten import silently uses the global, and code that imports
Unpoly's modules one day wouldn't know which `Response` is meant. A function may get a more
specific name instead: viewport's `scrollToPosition()`, not `scrollTo()`.

The list isn't exhaustive, and we don't check every name against the browser's API. Cover the
likely mix-ups. Names without a collision stay unprefixed (`Layer`, `Params`, `RenderResult`),
and public names don't change (`up.Request`).

### Export names

An exported name must make sense at every import site, without its module next to it.

- An alias at the import site (`import { halt as haltEvent }`) is a smell. Consider a more
  qualified export name instead.
- A qualified name reads as English, verb plus object: `haltEvent`, `getElementRoot`,
  `pushLocation`, `abortFragment`, `getAllFragments`, `toFailKey`. Not a module name glued
  on (`eventHalt`).
- When the export name is already good and a local variable is in the way, rename the local.
- Every `config` export is qualified (`fragmentConfig`, `layerConfig`). The module's `api`
  maps it back to its public name (`config: fragmentConfig`), like `get: getSmart`.
- Before renaming an export, check whether the specs or `unpoly-migrate` use it through
  `up.internal`.


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
