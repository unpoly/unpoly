# Code style

How Unpoly's own source is written. Some of these rules are enforced by ESLint (`bin/lint`),
most are not.


## Moving to TypeScript

We are migrating Unpoly to TypeScript, one module at a time, leaf modules first. All namespaces
are TypeScript; the render pipeline (`fragment/render/`), the layer classes, the entry files and
`unpoly-migrate` are still plain JavaScript.

The build runs every source file through TypeScript only to transpile it (ts-loader with
`transpileOnly`), and never checks types. The only type check is `bin/typecheck`, which runs
TypeScript 7's checker over `src/` with loose settings and takes well under a second. It
still reports errors, so CI runs it as a separate job that may fail.

In a `.ts` module:

- Import other modules by their `.js` name (`import { map } from './util.js'`), also when they
  are `.ts` files. TypeScript and the build both resolve this to `util.ts`.
- Annotate exported functions (parameters, and return types where they aren't obvious). Let
  TypeScript infer the types of local variables, unless a type helps the reader.
- Give a reusable shape a name (`export type`, `export interface`), like `List<T>` or
  `NormalizeURLOptions`. Mark a type that isn't public API with `@internal` in a `/** */` comment.
- Declare class fields with `declare` (`declare left: number`). A field without `declare` makes
  the compiled class define the property, which costs bytes and changes behavior (differently in
  `unpoly.js` and `unpoly.es6.js`, whose targets treat class fields differently). ESLint reports a
  field without `declare` or an initializer.
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

`bin/lint` runs ESLint over `src/`, `spec/` and `tooling/`. Extra arguments are forwarded,
so `bin/lint --fix` works.

Lint errors in `src/` fail the build, so `bin/test` surfaces them for you. Specs and the
tooling are not part of that build, so only `bin/lint` (or CI's lint job) checks those.
