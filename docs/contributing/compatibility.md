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
so a renamed `up.form` API gets its polyfill in `src/unpoly-migrate/form.js`.

`up.migrate` has helpers for the usual cases — renamed functions, attributes, events,
properties and modules, removed options, functions that used to be async. Read
`src/unpoly-migrate/migrate.js` before hand-rolling one. Two examples follow.


### Renaming a function

The old function announces itself, then delegates:

```js
/*-
Replaces elements on the current page with corresponding elements
from a new page fetched from the server.

@function up.replace
...
@deprecated
  Use `up.render()` or `up.navigate()` instead.
*/
up.replace = function(target, url, options) {
  up.migrate.deprecated('up.replace(target, url)', 'up.navigate(target, { url })')
  return up.navigate({ ...options, target, url })
}
```

The doc comment moves here with the code, so the old name keeps its page in the
documentation. `@deprecated` marks it as such and names the replacement.


### Renaming an attribute

Most renames need no implementation at all:

```js
/*-
...
@selector [up-observe]
@param up-observe
  The code to run when any field's value changes.
@deprecated
  Use `[up-watch]` instead.
*/
up.migrate.renamedAttribute('up-observe', 'up-watch')
```


### Specs for deprecated features

Keep a spec for every polyfill, in the module's own spec file. It should assert only
that the old way delegates to the new way — the behavior itself is already covered by
the new API's specs.

Guard it with `up.migrate.loaded`, because the suite also runs without the migrate
build:

```js
if (up.migrate.loaded) {
  describe('up.replace()', function() {
    it('delegates to up.navigate({ target, url }) (deprecated)', function() {
      const navigateSpy = up.fragment.navigate.mock()
      const deprecatedSpy = spyOn(up.migrate, 'deprecated')
      up.replace('target', 'url')
      expect(navigateSpy).toHaveBeenCalledWith({ target: 'target', url: 'url' })
      expect(deprecatedSpy).toHaveBeenCalled()
    })
  })
}
```

[CI](commit-conventions.md#continuous-integration) runs the whole suite against the
`unpoly-migrate` build too.
