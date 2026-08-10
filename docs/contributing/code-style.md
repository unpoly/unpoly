# Code style

> **TODO:** This guide is still an outline. The notes below are the intended scope,
> not finished prose.

- No types
- Minimal size is paramount
  - Unpoly reuses itself heavily
  - Pass large (render options) options hashes, rather than fetching and re-composing smaller options
- No dependencies whatsoever
  - OK to use depenencies for runner, specs, build pipeline
- No jQuery. Some legacy tests still use jQuery, but they should be refactored away.
- Acronyms are uppercased, e.g. `parseURL()`, *not* `parseUrl()`.
- Public names are generally brief

## Linting

`bin/lint` runs ESLint over `src/`, using the same rules the Webpack build enforces.
Extra arguments are forwarded, so `bin/lint --fix` works.

You don't have to run it separately to catch violations: a lint error fails the build,
which makes `bin/test` print the errors instead of running the specs. See
[Setting up a dev environment](dev-environment.md).
