# Code style

How Unpoly's own source is written. Some of these rules are enforced by Oxlint (`bin/lint`),
most are not.


## Moving to TypeScript

We migrated Unpoly to TypeScript one module at a time, leaf modules first. All of `src/` is
TypeScript now, except the ERB template `namespace.js.erb`. The types are still loose, and many
are provisional.

The build doesn't use TypeScript at all: esbuild strips the types from each file, and never
checks them. The only type check is `bin/typecheck`, which runs TypeScript 7's checker over
`src/` with loose settings and takes well under a second. It still reports errors, so CI runs
it as a separate job that may fail.

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
- When a function resolves its argument by reassigning it (`element = getSmart(element)`),
  TypeScript keeps the parameter's declared type and reports the uses below. Write the typed
  signature as an overload and leave the implementation untyped:

  ```ts
  export function morph(oldElement: ElementOrSelector, newElement: ElementOrSelector, ...): Promise<void>
  export async function morph(oldElement, newElement, ...) {
    oldElement = getSmart(oldElement)
  ```

  Callers get the typed signature, the body stays as it was. A new local variable or a cast would be
  checked, but changes the emitted code. Use a plain `any` parameter (with a comment) only where an
  overload isn't possible, like a function expression passed to `mockable()`.
- Where the honest code would emit differently, a cast with a comment is fine, e.g.
  `(now as any) - (this.loadedAt as any)` instead of `now.getTime() - …`.
- `any` is fine where a precise type would be complex.
- Typing must not change what the build emits. Compare `unpoly.min.js` before and after.
- `unpoly-migrate` is loosely typed for now. Its files are scripts, not modules: they patch
  `window.up` (which TypeScript sees as `any`) and import nothing, since `unpoly-migrate.js` is a
  separate bundle and a class imported from `src/unpoly/` would be a second copy. Type parameters
  where it's easy, and mark each function that core calls on `up.migrate` with a "Core calls this
  hook" comment.

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
bytes. So a member that a spec reaches by name — `spyOn(up.Switcher.prototype, '…')`, or a
direct call — cannot be `_`-prefixed: the name it asks for does not exist in
`dist/unpoly.min.js`. If a method is tested directly, drop the underscore and note why.


## Linting

`bin/lint` runs [Oxlint](https://oxc.rs/docs/guide/usage/linter) over `src/`, `spec/` and
`tooling/`, and checks that no two modules contribute the same key to `window.up`
(`tooling/lint/api_collisions.mjs`). Extra arguments are forwarded to Oxlint, so
`bin/lint --fix` works.

The rules are in two files in the project root. `.oxlintrc.native.json` has Oxlint's own rules,
which are written in Rust. `.oxlintrc.json` extends it with the rules that run in JavaScript: the
code style rules from `@stylistic/eslint-plugin`, and our own in `tooling/lint/unpoly_plugin.mjs`.
Editors with the Oxc extension use `.oxlintrc.json`. To silence a rule for one line, write
`// oxlint-disable-line rule-name`.

Lint errors in `src/` fail the build, so `bin/test` surfaces them for you. The dev watcher only
checks the native rules and the api collisions, though. The code style and `declare` on class
fields wait for `bin/lint`, CI and the production build, because the JavaScript rules would add a
second to every rebuild. Specs and the tooling are not part of the build, so only `bin/lint`
(or CI's lint job) checks those.
