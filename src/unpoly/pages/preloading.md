Preloading links
================

Links can be preloaded before the user clicks them.
When a preloaded link is clicked, the response is already [cached](/caching)
and the interaction feels instant.

[Eager preloading](#on-insert) can also populate the cache to keep
links [accessible while offline](/network-issues#offline-cache).


Preloading on hover {#on-hover}
-------------------

To preload a link when the user [hovers](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover_event)
over it, set an `[up-preload]` attribute:

```html
<a href="/path" up-preload>Hover over me to preload my content</a> <!-- mark: up-preload -->
```

By default Unpoly waits for 90 milliseconds of hovering before making the preload request.
This prevents accidental preloading when the mouse moves over a link that the user doesn't intend to click.

To change the delay, set an [`[up-preload-delay]`](/up-preload#up-preload-delay) attribute
or configure `up.link.config.preloadDelay`. Increasing the delay will lower the load on your server,
but will also make the interaction feel less instant.

On touch devices preloading begins when the user places their finger on the link.

To [preload all links on hover](/handling-all-links#preloading-all-links), configure `up.link.config.preloadSelectors`.


Eager preloading on insertion {#on-insert}
----------------------------

To preload a link as soon as it appears in the DOM, set an [`[up-preload="insert"]`](/up-preload#up-preload) attribute.

This is useful for links with a high probability of being clicked, like a navigation menu:

```html
<a href="/menu" up-layer="new drawer" up-preload="insert">≡ Menu</a> <!-- mark: up-preload="insert" -->
```

When an eagerly preloading link is inserted multiple times, only a single request is made.
All subsequent render passes will render from the [cache](/caching).


Preloading when a link scrolls into view {#on-reveal}
------------------------------------------

To "lazy preload" a link when it is scrolled into the [viewport](/up-viewport),
set an [`[up-preload="reveal"]`](/up-preload#up-preload) attribute.

This is useful when a link is [below the fold](https://www.optimizely.com/optimization-glossary/below-the-fold/)
and is unlikely to be clicked until the user scrolls:

```html
<a href="/stories/106" up-preload="reveal">Full story</a> <!-- mark: up-preload="reveal" -->
```

When a lazy preloading link enters and exits its viewport repeatedly, only a single request is made.


Custom preload conditions {#scripted}
----------------------------------

To programmatically preload any link element at a time of your choosing, use the `up.link.preload()` function.

The following [compiler](/enhancing-elements) would preload a link with a `[rel=next]` attribute when
the user hovers over a `<main>` element:

```js
up.compiler('link[rel=next]', (link) => {
  return up.on('mouseenter', 'main', () => up.link.preload(link))
})
```

A link that is preloaded in that fashion does not require an `[up-preload]` attribute.


Preloading a URL
----------------

To preload a given URL without a link element, make a [background](/up.render#options.background) request that [caches](/caching):

```js
up.request('/menu', { cache: true, background: true })
```

The cached response will be used by any link to the same URL:

```html
<a href="/menu">Menu</a>
```


Preload request behavior
------------------------

Requests sent when preloading differ in some ways from requests sent when following a link directly:

- Preloading will not change elements ("render").
- Preloading a link will *not* [abort](/aborting-requests) pending requests
  [targeting](/targeting-fragments) the same fragments. Only when the link is clicked later
  are conflicting requests aborted.
- Preload requests are considered [background requests](/up.render#options.background)
  and will not show the [progress bar](/progress-bar).
- Preloaded content is placed into the [cache](/caching) automatically.
- When a link destination is already cached, preloading will *not* make another request, even if the cache entry is [expired](/caching#expiration).
  When the link is clicked and the cached content is rendered into the page, the fragment will be [revalidated](/caching#revalidation)
  if the cache entry is expired.


Events
------

When a link is preloaded via the `[up-preload]` attribute or `up.link.preload()` function, an `up:link:preload` event
is emitted.

The event can be prevented to stop the preload from taking place:

```js
function isSlowConnection() {
  // https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
  return navigator.connection && navigator.connection.effectiveType.includes('2g')
}

up.on('up:link:preload', function(event) {
  if (isSlowConnection()) {
    event.preventDefault()
  }
})
```


@page preloading
