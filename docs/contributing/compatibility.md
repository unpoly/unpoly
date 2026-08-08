# Compatibility

> **TODO:** This guide is still an outline. The notes below are the intended scope,
> not finished prose.

## Browser support

- We test in Chrome, Firefox, Safari
- We support versions from last 2 years
- Graceful degredation OK (e.g. animation is skipped)
  - Browser checks like up.brower.canFoo()

## Backwards compatibility

- We try to stay on the 3.x major
- When we rename, remove etc. an API we add a polyfill to unpoly-migrate.js
- Breaking changes that are healed with a polyfill are not considered breaking and won't raise major
