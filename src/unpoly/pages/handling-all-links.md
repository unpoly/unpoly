Handling all links
==================

You can configure Unpoly to handle every link on the page, without
annotating each link with an `[up-follow]` attribute.

Clicks then update fragments instead of loading full pages, and you need
fewer `[up-...]` attributes in your HTML.

> [note]
> Forms can be handled the same way. See [[handling-all-forms]].


## Following all links

To follow *all* links on a page without requiring an `[up-follow]` attribute:

```js
up.link.config.followSelectors.push('a[href]')
```

Some links will fall back to default browser behavior under this setting:

@include no-follow-reasons


## Following all links on `mousedown`

To follow links on `mousedown` instead of `click` without requiring an `[up-instant]` attribute:

```js
up.link.config.instantSelectors.push('a[href]')
```

Note that an instant link must also be [followable](/up.link.isFollowable), usually by giving it
an `[up-follow]` attribute or by configuring `up.link.config.followSelectors` as [shown above](#following-all-links).

Some links will still activate on `click` under this setting:

- Links with an `[up-instant=false]` attribute.
- Links that are not [followable](#following-all-links).
- Any additional exceptions configured in `up.link.config.noInstantSelectors`.

If you have event listeners bound to `click` on accelerated links, they will no longer be called.
Bind these listeners to `mousedown` or, better, `up:click` instead.


## Preloading all links

To preload *all* links on hover, without requiring an `[up-preload]` attribute:

```js
up.link.config.preloadSelectors.push('a[href]')
```

Some links will not be preloaded under this setting:

- Links with an `[up-preload=false]` attribute.
- Links that are not [followable](#following-all-links).
- Links whose destination [cannot be cached](/up.network.config#config.autoCache).
- Any additional exceptions configured in `up.link.config.noPreloadSelectors`.


## Configuring default behavior for all elements {#defaults}

Instead of configuring the same attributes on many elements, you can configure
Unpoly to apply behavior to all elements matching a given CSS selector.

For example, the following configuration will enable single-page navigation for
all hyperlinks:

```js
up.link.config.followSelectors.push('a[href]')
```

Unpoly will now [handle all links](/handling-all-links), even those without
an `[up-follow]` attribute:

```html
<a href="/path">Click for single-page navigation</a>
```


> [tip]
> An alternative way to apply default behavior to many elements is a [macro](/up.macro).


### Making exceptions

You can still make exceptions by setting an `[up-follow=false]` attribute:

```html
<a href="/path" up-follow="false">Click for full page load</a> <!-- mark: up-follow="false" -->
```


## Customizing navigation defaults

[Following a link](/up-follow) or [submitting a form](/submitting-forms) is considered
[navigation](/navigation) by default.

When navigating, Unpoly uses defaults to satisfy the user's expectations regarding
scrolling, history, focus, request cancellation, etc.

See [[navigation]] for a detailed breakdown of navigation defaults
and how to customize them.


## Fixing legacy JavaScript code

Legacy code often contains JavaScript that expects a full page load whenever the
user interacts with the page. When Unpoly handles all links, clicking no longer
causes these additional page loads.

See [[legacy-scripts]] for making such code work with Unpoly.


@page handling-all-links
@signature
