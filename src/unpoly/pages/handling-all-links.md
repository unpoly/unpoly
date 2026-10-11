Handling all links
==================

You can configure Unpoly to handle every link on the page, without
annotating each link with an `[up-follow]` attribute.

Clicks then update fragments instead of loading full pages, and you need
fewer `[up-...]` attributes in your HTML.

> [note]
> Forms can be handled the same way. See [[handling-all-forms]].


## Following all links {#following-all-links}

To follow *all* links on a page without requiring an `[up-follow]` attribute:

```js
up.link.config.followSelectors.push('a[href]')
```

Some links will fall back to default browser behavior under this setting:

@include no-follow-reasons

Scripts that expect a full page load after every click need adjusting, see [[legacy-scripts]].


## Following all links on `mousedown` {#following-all-links-on-mousedown}

To follow links on `mousedown` instead of `click` without requiring an `[up-instant]` attribute:

```js
up.link.config.instantSelectors.push('a[href]')
```

Note that an instant link must also be [followable](/up.link.isFollowable), usually by giving it
an `[up-follow]` attribute or by configuring `up.link.config.followSelectors` as [shown above](#following-all-links).

Some links will still activate on `click` under this setting:

- Links with an `[up-instant=false]` attribute.
- Links that are not [followable](#following-all-links).
- Links with an `[onclick]` attribute.
- Any additional exceptions configured in `up.link.config.noInstantSelectors`.

If you have event listeners bound to `click` on accelerated links, they will no longer be called.
Bind these listeners to `mousedown` or, better, `up:click` instead.


## Preloading all links {#preloading-all-links}

To preload *all* links on hover, without requiring an `[up-preload]` attribute:

```js
up.link.config.preloadSelectors.push('a[href]')
```

Some links will not be preloaded under this setting:

- Links with an `[up-preload=false]` attribute.
- Links that are not [followable](#following-all-links).
- Links whose destination [cannot be cached](/up.network.config#config.autoCache).
- Any additional exceptions configured in `up.link.config.noPreloadSelectors`.


## Making exceptions {#exceptions}

You can still make exceptions by setting an `[up-follow=false]` attribute:

```html
<a href="/path" up-follow="false">Click for full page load</a> <!-- mark: up-follow="false" -->
```

`[up-instant=false]` and `[up-preload=false]` make exceptions from instant clicks and preloading in the same way.


## Using a macro instead {#macro}

Instead of changing `up.link.config.followSelectors`, you can register a [macro](/up.macro)
that sets `[up-follow]` on every link:

```js
up.macro('a[href]:not([up-follow=false])', function(link) {
  link.setAttribute('up-follow', '')
})
```

Links with `[up-follow=false]` are left alone. The [exceptions above](#following-all-links) still apply:
links with a `[target]` or a cross-origin `[href]` load a full page.

A macro can set other attributes in the same pass, like [`[up-preload]`](/up-preload)
to preload the link on hover.


@page handling-all-links
@signature
