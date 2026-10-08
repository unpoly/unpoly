The shape of the API
====================

Most of Unpoly's features share one shape: the common case is an HTML attribute,
the same feature is also available as a JavaScript function, and its defaults
can be changed through a global configuration. Learn the pattern once, and every
feature in the reference will look familiar.


One feature, three layers {#layers}
-------------------------

The quickest layer is an attribute in your HTML. This link swaps the
[main element](/main) with an animated transition:

```html
<a href="/path" up-follow up-transition="cross-fade">Click me</a> <!-- mark: up-transition="cross-fade" -->
```

The same feature exists as a JavaScript function, for when your own code
triggers the behavior. Attributes become camel-cased options:

```js
up.follow(link, { transition: 'cross-fade' }) // mark: transition
```

When your whole app should behave that way, set a configuration default
instead of repeating the attribute:

```js
up.fragment.config.navigateOptions.transition = 'cross-fade'
```

All three layers **set the same option**. They differ in scope: one element,
one call, or every navigation in your app.


Unpoly attributes
-----------------

Attributes carry their options as string values. Simple values are plain
strings; structured values are written in [relaxed JSON](/relaxed-json):

```html
<a href="/path" up-follow up-headers="{ 'X-Requested-From': 'sidebar' }">Click me</a> <!-- mark: up-headers -->
```


JavaScript options
------------------

A function like `up.follow(link)` parses the link's attributes into an options
object. Options you pass yourself override anything parsed from the element:

```js
up.follow(link, { transition: 'move-left' }) // overrides [up-transition]
```


Changing defaults globally {#config}
--------------------------

Most modules have an `up.*.config` property that adjusts their behavior
for your entire application. For example, this makes every new overlay
open as a drawer instead of a modal dialog:

```js
up.layer.config.mode = 'drawer'
```

Many config properties hold a list of CSS selectors, letting you
[apply a behavior to all matching elements](/handling-all-links#defaults).

For all parsing rules, boolean attributes and `"auto"` values,
see [[attributes-and-options]].


@page start/api
@signature
