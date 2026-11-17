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

All of `src/` is TypeScript, except the ERB template `namespace.js.erb`. Where types live and
how modules import each other is covered in
[Code organization](code-organization.md#imports-exports-and-types).

### Type checking

The build doesn't use TypeScript at all: esbuild strips the types from each file, and never
checks them. `bin/typecheck` checks them, in about a second, and prints nothing when all is
well. The dev watcher runs the same checks after every change. When to run what is in
[Testing](testing.md#before-committing).

Besides the [public-API probe](documentation.md#public-api-must-exist), which checks that
documented API exists in the types, `bin/typecheck` checks with TypeScript 7 against two
configs:

- `tsconfig.json` checks all of `src/` with loose settings, but with `strictFunctionTypes` on.
- `tsconfig.core.json` checks Unpoly's core (`src/unpoly.ts` and `src/unpoly/`) with
  `noImplicitAny` and `strictNullChecks` on. `unpoly-migrate` isn't part of this check, so core
  can't use the API that only migrate adds, like `up.migrate.deprecated()` or `config.patch()`.

`bin/typecheck` prints an error that both checks find twice; the watcher lists it once. Your
editor reads `tsconfig.json`, so it shows the loose check's errors, but not the ones only the
core check finds. When all of `src/` passes a setting, move it to `tsconfig.json`.

Adding or changing types shouldn't change what the build emits. Compare `unpoly.min.js` before
and after. A change that removes a cast or an `any`, together with its explanatory comment, may
cost a few bytes. [Every byte counts](#every-byte-counts) still decides case by case.

### Writing types

- **Object shapes are interfaces.** Every object shape is an `interface`, including the
  properties Unpoly sets on elements (`interface FragmentElement extends Element { … }`). Use
  `type` only for unions, tuples, function types, mapped and conditional types, and aliases.
  An interface can be passed where a `PlainObject` is expected. Lint enforces this with
  `consistent-type-definitions`.
- **`?` for optional values.** Write `origin?: Element`, not `origin: Element | undefined`,
  for parameters, properties and `declare`d class fields. Return types, and a parameter
  followed by a required one, still need `| undefined`.
- **Declare the return type of every function and method at module or class level.** A
  function inside another function's body may leave it to inference. `bin/lint` enforces both.

  ```ts
  function isAlive(fragment: Element): boolean {
    let isDestroying = (element: Element) => element.matches('.up-destroying')
    return fragment.isConnected && !isDestroying(fragment)
  }
  ```

  This includes functions that aren't exported, class methods, and an arrow function assigned
  to an untyped `const` at module level. Agents (and humans) read code with `grep`, not by
  hovering, and an explicit type catches an accidental widening where it happens. A nested
  function's body is right next to it, and its return type flows into whatever checks its call.

  Inline callbacks and functions that get their type from context stay inferred. So do
  functions in an object literal, and a named function whose body only returns a function
  (both the outer and the returned one).
- **Local variables are inferred.** Annotate one where inference can't do it (see
  [Strict checks](#strict-checks)), or where a type helps the reader.
- **Don't annotate a `let` without an initializer.** TypeScript infers its type from the
  assignments. Add a type only when `bin/typecheck` reports that the variable implicitly has
  type `any`.
- **Refactor before type acrobatics.** When a type is hard to write, change the code so it's
  easy to type. Don't build intersections, `Pick` or `Omit` where a refactor or a named type
  does.
- **Share slightly wider types.** One `LookupOptions` for all of up.fragment's lookups beats a
  precise options type per function. Don't widen where that loses a real check.
- **Real types instead of `PlainObject`**, where that's cheap.
- **No `any` without a reason.** Prefer the real type, then `unknown`. Where `any` is right,
  disable the lint rule on that line with the reason:
  `// oxlint-disable-next-line typescript/no-explicit-any -- any user value`. An implementation
  signature behind overloads takes `...args: unknown[]`.
- **No cast that a refactor can remove.** A cast is fine where TypeScript can't know
  (`affix(…) as HTMLFormElement`).
- **Declare class fields** with `declare` (`declare left: number`). A field without `declare`
  makes the compiled class define the property, which costs bytes and changes behavior
  (differently in `unpoly.js` and `unpoly.es6.js`, whose targets treat class fields
  differently). `bin/lint` reports a field without `declare` or an initializer.
- **A class that copies its options onto itself** merges with an interface for those properties
  (`interface UpRequest extends RequestProps {}`) instead of declaring each one. Use `declare` for
  the other fields, and for an option that the instance holds with a narrower type.
- **Call a static method through `this.constructor` only where one of our own subclasses
  overrides it.** Apps subclassing our public classes isn't supported.
- **Only syntax that strips away.** No `enum`, `namespace` or constructor parameter
  properties (`constructor(private x)`). They compile to runtime code, so our output would
  depend on the tool that strips the types. A parameter property also defines a class field
  (see the `declare` bullet above). Re-export a type with `export type`, because esbuild
  compiles one file at a time.
  `bin/typecheck` reports both (`erasableSyntaxOnly` and `isolatedModules` in `tsconfig.json`).
- **Comment exported types with `/** */`**, and properties an editor should explain on hover.
  Use `//` for types local to a file and for notes to maintainers. Put `@internal` only on
  something exported. These comments aren't published: a public type's reference goes in its
  [doc entry](documentation.md#doc-files).
- **Type a config once**, as the interface its defaults function returns. `newConfig()` (from
  `util/config.ts`) returns it as a `ConfigWith<…>`, so the call site needs no cast:

  ```ts
  export const linkConfig = newConfig('up.link.config', (): t.LinkConfig => ({ … }))
  ```

- **Every event has its own interface** (never a type alias), named after the event in
  PascalCase plus `Event`: `up:fragment:kept` → `FragmentKeptEvent`. That holds for an event
  without properties of its own, too. Use one line per property when that's clearer.
- **Prefer repeating a property over a shared base type.** Sibling events extend `UpEvent` and
  each list their properties, even when they overlap:

  ```ts
  /** The `up:fragment:kept` event. */
  export interface FragmentKeptEvent extends UpEvent {
    target: Element
    newFragment: Element
    newData: PlainObject
  }

  /** The `up:fragment:keep` event. */
  export interface FragmentKeepEvent extends UpEvent {
    target: Element
    newFragment: Element
    newData: PlainObject
    renderOptions: RenderOptions
  }
  ```

  When several types share a complex value, give the value a name as a local type that isn't
  exported, like `type BootMode = 'auto' | 'manual'`. Use a base type only for a real "is a",
  where one function builds all the events that extend it:

  ```ts
  /** The `up:layer:dismissed` event. */
  export interface LayerDismissedEvent extends LayerCloseEvent {}
  ```

  A type like `GuardEvent` may exist without any event extending it, when an option needs it
  (`{ guardEvent }`). The events fit it structurally.

  Events are declared by extending the DOM's `GlobalEventHandlersEventMap`, which maps each
  event type to its interface. `addEventListener()`, `up.on()` and `up.emit()` look it up, and
  apps add their own events the same way. A new event gets an interface with the properties its
  API docs list, and an entry in its module's `declare global` block (see
  [Code organization](code-organization.md#imports-exports-and-types) › Events).

### Strict checks

- Core code has no implicit `any`: type every parameter, and an empty `{}` or `[]` that
  collects values. Callbacks get their parameter types from the function
  they're passed to (`up.compiler()`, `up.on()`), so prefer typing that function over annotating
  each callback.
- Core code passes `strictNullChecks`. When TypeScript says a value may be `null` or
  `undefined`, and the function you pass it to already handles that, widen the parameter's
  type (`origin?: Element`). When something guarantees the value, assert it with `!`, and say
  what guarantees it in a comment unless the code nearby shows it. Don't add a runtime check
  for a case that can't happen. A value that can really be missing, and then breaks something,
  is a bug: fix it in its own change, with a spec.

  Assert a guaranteed value once, where the guarantee comes from: assign the asserted value to
  a variable, or give the function that produces it a return type without `undefined`. Don't
  repeat `!` at each use. If code right after a `!` checks whether the value is missing, the
  `!` is wrong; restructure instead.

  `!` only where something guarantees the value. Where a value may be missing, write the code
  that handles it (`?? 0`, `x && …`), even if a built-in would cope with `undefined`.
- All of `src/` passes `strictFunctionTypes`: a callback must accept every value it is called
  with. A tester that gets any value takes `unknown` and narrows it. When a callback should get
  a narrower type, make the type that calls it generic (like `SelectorTracker<E>`), instead of
  narrowing the callback's parameter.
- When a function resolves its argument by reassigning it (`element = getFragment(element)`),
  TypeScript narrows the parameter to a member of its declared type: an `ElementOrSelector`
  becomes an `Element`, never the `HTMLElement` that `getFragment()` returns. When that's enough,
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
  assignable to its implementation under `strictFunctionTypes` (TS2394), so a function
  resolves into a new local instead (`let element = getFragment(elementOrSelector)!`, like
  `animate()`). A function expression passed to `mockable()` can't have overloads. Type its rest
  parameter as a union of tuples (like `trackFields()` does).
- **Overloads only for more than one signature.** A rest tuple only where the body needs the
  arguments as an array. Otherwise plain parameters.

### The global `up` and unpoly-migrate

- The global `up` has the type `Up`, which `src/unpoly.ts` builds from every module's `api`. A
  key that no `api` contributes is declared by merging it into `Up` with a `declare module`
  block, next to the code that adds it. A namespace's type can't be merged into. To add keys to
  a namespace, redeclare the namespace with an intersection, like
  `util: CoreApi['util'] & { … }`. Only one place may redeclare a namespace: a second,
  different redeclaration fails with TS2717 ("Subsequent property declarations must have the
  same type").
- `unpoly-migrate`'s files are ES modules that patch `window.up` when they are evaluated.
  `src/unpoly-migrate.ts` imports them in order, between `start_extension.js` and
  `stop_extension.js`. From core they only import types (`import type`), since
  `unpoly-migrate.js` is a separate bundle and a class imported from `src/unpoly/` would be a
  second copy. The types of `up.migrate` and its helpers live in `migrate/types.ts`.
- Each migrate file declares the keys it adds to `up`; a deprecated alias gets the type of its
  replacement. A method added to a class like `up.Layer` is merged into the class's interface.
  The implementations take their types from these declarations, so
  `up.element.matches = function(element, selector) {…}` needs no annotations. A hook that sees
  keys core no longer knows names them in an interface (`LegacyCompiler`), or takes a
  `PlainObject`.
  A wrapper that forwards its `...args` casts the callee unless the callee has a rest
  parameter: `(up.element.get as AnyFunction)(...args)`. TypeScript only spreads an array of
  unknown length into a rest parameter (TS2556). Type parameters where it's easy. Core declares
  the hooks it calls on `up.migrate` in `migrate_stub.ts`, and migrate marks each implementation
  with a "Core calls this hook" comment.


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

Unpoly has [zero runtime dependencies](philosophy.md#values). Development dependencies are
fine. The spec runner, the specs and the build pipeline use plenty.


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

A function type is named the way the docs refer to it: `…Callback` where the docs say callback,
`…Function` otherwise. Don't abbreviate to `Fn`. A function that undoes a temporary change is an
`UndoFunction`. `UnbindFunction` is only for unsubscribing, like the functions `up.on()` and
`up.watch()` return.

### Names that collide with globals

A class, function or type named like a likely browser or JavaScript global gets an `Up` prefix.
That covers values like `Request` and types like fetch's `RequestCache`: `UpRequest`,
`UpResponse`, `UpURLPattern`, `UpError`, `UpEvent`, `UpEventListener`, `UpRequestCache`.
Otherwise a forgotten import silently uses the global, and code that imports Unpoly's modules
one day wouldn't know which `Response` is meant. A function may get a more specific name
instead: viewport's `scrollToPosition()`, not `scrollTo()`.

Declare a prefixed class like any other (`export class UpRequest { … }`). Its `api` publishes it
under its public name (`Request: UpRequest`), and `setClassName()` in `src/unpoly.ts` gives it
that name at runtime, so the console says `up.Request`.

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
  maps it back to its public name (`config: fragmentConfig`), like `get: getFragment`.
- Before renaming an export, check whether the specs or `unpoly-migrate` use it through
  `up.internal`.


## Private members and the minified build

Members prefixed with `_` are internal, and the minified build *mangles* their names to save
bytes. So a member that a spec reaches by name — `spyOn(up.internal.Switcher.prototype, '…')`, or a
direct call — cannot be `_`-prefixed: the name it asks for does not exist in
`dist/unpoly.min.js`. If a method is tested directly, drop the underscore and note why.


## Linting

`bin/lint` runs [Oxlint](https://oxc.rs/docs/guide/usage/linter) over `src/`, `spec/` and
`tooling/`, checks that no two modules contribute the same key to `window.up`
(`tooling/lint/api_collisions.mjs`), and checks the structure of the
[doc files](documentation.md#doc-files) (`tooling/lint/doc_files.mjs`). It takes about a second
and prints nothing when all is well. Extra arguments are forwarded to Oxlint, so
`bin/lint --fix` works.

The rules are in `.oxlintrc.json` in the project root. Most are Oxlint's own, which are written in
Rust. The code style rules from `@stylistic/eslint-plugin` and our own in
`tooling/lint/unpoly_plugin.mjs` run in JavaScript. Editors with the Oxc extension use the same
config. To silence a rule for one line, write `// oxlint-disable-line rule-name`.

The dev watcher lints `src/` too, but only `bin/lint` checks the specs, the tooling and the doc
files. When to run what is in [Testing](testing.md#before-committing).
