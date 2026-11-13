# Compatibility

Which browsers and language features Unpoly can rely on, and what we do instead of breaking a
public API: a polyfill in `unpoly-migrate.js` rather than a major version bump.

## Browser support

We support browser versions from the last two years, in Chrome, Firefox and Safari.

Only Chrome and Firefox have automated specs (`bin/test --browser=firefox`), and
[CI](commit-conventions.md#continuous-integration) runs Chrome. Safari you check by hand.

Modern *syntax* is safe: the build transpiles it down (to ES2024 for `unpoly.js`, to ES6
for the optional `unpoly.es6.js`). Modern *APIs* are not, since transpiling doesn't
polyfill them. An API that all three browsers have supported for two years
([caniuse.com](https://caniuse.com)) needs no runtime check. A newer one needs a feature check that specs can stub, like
`canPushState()` (see [`describeFallback()`](testing.md#specs-with-special-conditions)), and a
path that degrades rather than throws.
Skipping an animation is fine.

`bin/typecheck` only helps with JavaScript built-ins. `lib` in `tsconfig.json` stops at
ES2024, so it rejects a newer built-in like `Set#union()` (TS2550). Its DOM types know every
browser API that TypeScript knows, however new.


## Breaking changes

We try to stay on the 3.x major.

When we rename or remove a public API, we add a polyfill to `unpoly-migrate` rather than
bump the major. Apps that load `unpoly-migrate.js` keep working and get a deprecation
warning in the console; apps that don't, break — which is why the polyfill is the price
of the rename.

`src/unpoly-migrate/` mirrors the [namespaces](code-organization.md#responsibilities),
so a renamed `up.form` API gets its polyfill in `src/unpoly-migrate/form.ts`.

`up.migrate` has helpers for the usual cases — renamed or removed attributes, events and
properties, renamed namespaces, functions that used to be async. A renamed *function* is
delegated by hand with `up.migrate.deprecated()`. Read `src/unpoly-migrate/migrate.ts`
before hand-rolling one. Two examples follow.


### Renaming a function

The old function announces itself, then delegates. The migrate file declares each key it adds
to `up`, and the function takes its types from that declaration (see
[Code style](code-style.md#the-global-up-and-unpoly-migrate)):

```ts
type RenderJob = import('../unpoly/fragment.js').RenderJob
type RenderOptions = import('../unpoly/fragment.js').RenderOptions

declare module '../unpoly.js' {
  interface Up {
    replace(target: RenderOptions['target'], url: string, options?: RenderOptions): RenderJob
  }
}

up.replace = function(target, url, options) {
  up.migrate.deprecated('up.replace(target, url)', 'up.navigate(target, { url })')
  return up.navigate({ ...options, target, url })
}
```

Its [doc entry](documentation.md#doc-files) moves along to the doc file beside the polyfill
(`src/unpoly-migrate/fragment.md`), so the old name keeps its page in the documentation.
`@deprecated` marks it as such and names the replacement:

```md
# up.replace()

Replaces elements on the current page with corresponding elements
from a new page fetched from the server.

@function up.replace
...
@deprecated
  Use `up.render()` or `up.navigate()` instead.
```


### Renaming an attribute

Most renames need no implementation at all:

```ts
up.migrate.renamedAttribute('up-observe', 'up-watch')
```

The old attribute still gets a doc entry, in `src/unpoly-migrate/form.md`:

```md
# [up-observe]

...
@selector [up-observe]
@param up-observe
  The code to run when any field's value changes.
@deprecated
  Use `[up-watch]` instead.
```


### Specs for deprecated features

Keep a spec for every polyfill, in the namespace's own spec file. It should assert only
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
