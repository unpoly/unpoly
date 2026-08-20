# Code style

How Unpoly's own source is written: no types, no dependencies, no jQuery, and a real concern
for byte count. Some of these rules are enforced by ESLint (`bin/lint`), most are not.


## No types

Unpoly is plain JavaScript, and nothing type-checks it. The build runs the source
through TypeScript, but only to transpile it.

Types appear in [doc comments](documentation.md) only, in a notation loosely inspired by
TypeScript. They document intent for the reader; no tool verifies them.


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

We sometimes accept a suboptimal pattern because it saves bytes. Only bytes a minifier
can't recover, though — see [Leave it to the minifier](#leave-it-to-the-minifier).


## Leave it to the minifier

We ship a minified build, and apps bundle Unpoly through their own minifier. Terser
already collapses branches into conditional expressions and rewrites control flow to
return early. Hand-writing those transformations saves nothing, and the version we have
to read and maintain for years is the unminified one.

- **Don't chain ternaries.** A single ternary for a genuinely binary choice is fine. A
  chain of them standing in for `if` / `else if` / `else` is not: it reads as a puzzle,
  and the minifier produces the same output from the readable form.
- **Early returns are for guards.** Return early to reject a missing argument, or an
  element we don't handle, before the real work starts. Don't restructure a function
  body into early returns just to avoid an `else`.

The same reasoning applies to any other trick whose only benefit is fewer characters.
Shorten code by removing work or reusing a helper, not by compressing its syntax.


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
