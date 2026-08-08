# Code style

> **TODO:** This guide is still an outline. The notes below are the intended scope,
> not finished prose.

- No types
- Minimal size is paramount
  - Unpoly reuses itself heavily
  - Pass large (render options) options hashes, rather than fetching and re-composing smaller options
- No dependencies whatsoever
  - OK to use depenencies for runner, specs, build pipeline
- No jQuery
- Acronyms are uppercased, e.g. `parseURL()`, *not* `parseUrl()`.
- Public names are generally brief
- How to run eslint
