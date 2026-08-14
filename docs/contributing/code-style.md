# Code style

Some of these rules are enforced by ESLint, most are not.


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

We sometimes accept a suboptimal pattern because it saves bytes.


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


## Linting

`bin/lint` runs ESLint over `src/`, `spec/` and `runner/`. Extra arguments are forwarded,
so `bin/lint --fix` works.

For `src/` you don't have to run it separately: those are the same rules the Webpack build
enforces, and a lint error fails the build, which makes `bin/test` print the errors instead
of running the specs. See [Setting up a dev environment](dev-environment.md).

Specs and the runner are not part of that build, so nothing checks them until you run
`bin/lint` — or until CI does, in its own job.
