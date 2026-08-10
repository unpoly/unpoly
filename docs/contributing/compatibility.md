# Compatibility

## Browser support

We support browser versions from the last two years, in Chrome, Firefox and Safari.

Only Chrome and Firefox have automated specs (`bin/test --browser=firefox`), and
[CI](commit-conventions.md#continuous-integration) runs Chrome. Safari you check by hand.

Modern *syntax* is safe: the build transpiles it down (to ES2021 for `unpoly.js`, to ES6
for the optional `unpoly.es6.js`). Modern *APIs* are not, since transpiling doesn't
polyfill them. Guard those with a feature check in `up.browser`, e.g.
`up.browser.canPushState()`, and let the feature degrade rather than throw — skipping an
animation is fine.


## Breaking changes

We try to stay on the 3.x major.

When we rename or remove a public API, we add a polyfill to `unpoly-migrate` rather than
bump the major. Apps that load `unpoly-migrate.js` keep working and get a deprecation
warning in the console; apps that don't, break — which is why the polyfill is the price
of the rename.

`src/unpoly-migrate/` mirrors the [main modules](code-organization.md#responsibilities),
so a renamed `up.form` API gets its polyfill in `src/unpoly-migrate/form.js`. `up.migrate`
has helpers for the usual cases (`deprecated()`, `renamedProperty()`, `renamedEvent()`, …),
so most polyfills are one line.

[CI](commit-conventions.md#continuous-integration) runs the whole suite against the
`unpoly-migrate` build too.
