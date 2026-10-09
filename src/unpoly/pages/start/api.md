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


@page start/api
@signature
