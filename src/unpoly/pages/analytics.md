Tracking page views
===================

Web analytics tools like [Matomo](https://matomo.org/) or [Google Analytics](https://analytics.google.com/)
count a page view on every page load. With Unpoly the page loads once, and the rest of the session
is fragment updates that the tool never sees. To keep your statistics complete,
track a page view whenever the browser location changes.


Tracking location changes {#location-changes}
-------------------------

After Unpoly updates the address bar, it emits an `up:location:changed` event.
Track a page view in a listener:

```js
up.on('up:location:changed', function(event) {
  trackPageView(event.location) // mark-line
})
```

The event is emitted for every change of the address bar: when a link is followed,
when a form submission redirects, or when the user presses the Back button.
It is *not* emitted for the initial page load. Your tracking snippet already counts that, as it does on any site.

The `trackPageView()` function depends on your analytics tool.
All examples on this page assume it exists. For Matomo it would look like this:

```js
function trackPageView(url) {
  _paq.push(['setCustomUrl', url])
  _paq.push(['trackPageView'])
}
```


### Ignoring jumps within the page {#hash-changes}

A click on a link to a `#section` within the page also changes the address bar.
If you don't want to count those as page views, check `event.reason`:

```js
up.on('up:location:changed', function(event) {
  if (event.reason !== 'hash') { // mark-line
    trackPageView(event.location)
  }
})
```

Other reasons are `'push'` for a new history entry, `'replace'` for a changed entry
and `'pop'` for the user going back or forward.


Tracking navigation in overlays {#overlays}
-------------------------------

Not every [overlay](/up.layer) has [visible history](/history-in-overlays).
When an overlay without visible history opens or navigates, the address bar does not change
and no `up:location:changed` event is emitted.

To also track navigation within such overlays, observe `up:layer:location:changed` instead:

```js
// Track when a layer changes its location.
// This includes location changes on the root layer.
up.on('up:layer:location:changed', function(event) {
  trackPageView(event.location)
})

// When an overlay opens, track the overlay's initial location.
up.on('up:layer:opened', function(event) {
  // Don't track overlays that were opened from local string content.
  if (event.layer.location) {
    trackPageView(event.layer.location)
  }
})
```


Tracking rendered fragments instead {#fragments}
----------------------------------

Instead of observing the address bar, you can track a page view whenever a significant fragment is rendered.
For example, mark the elements that count as a page with a `[track-page-view]` attribute:

```html
<main track-page-view> <!-- mark: track-page-view -->
  ...
</main>
```

Then track a page view from a [compiler](/enhancing-elements):

```js
up.compiler('[track-page-view]', function(element, data, meta) {
  // Don't track duplicate page views if we just reloaded for cache revalidation.
  if (!meta.revalidating) {
    trackPageView(meta.layer.location) // mark-line
  }
})
```

The compiler runs for the initial page as well as for every later update,
so your tracking snippet should not count the initial page load a second time.


### Passing custom dimensions {#dimensions}

A compiler makes it easy to send custom event properties ("dimensions") along with the page view.
Encode them in an `[up-data]` attribute:

```html
<main track-page-view up-data="{ course: 'ruby-basics', page: 1 }"> <!-- mark: up-data="{ course: 'ruby-basics', page: 1 }" -->
  ...
</main>
```

The parsed [data object](/data) is passed to your compiler as a second argument.
Forward it to your tracking function:

```js
up.compiler('[track-page-view]', function(element, data, meta) { // mark: data
  if (!meta.revalidating) {
    trackPageView(meta.layer.location, data) // mark: data
  }
})
```


Tracking every fragment update {#all-fragments}
-----------------------------

To track *all* fragment updates, observe the `up:fragment:loaded` event:

```js
up.on('up:fragment:loaded', function(event) {
  // Don't track revalidation of cached content.
  if (!event.revalidating) {
    trackPageView(event.response.url)
  }
})
```

If this tracks too many events, filter further on the properties of [`event.request`](/up:fragment:loaded#event.request),
such as its `{ target }` or `{ layer }`.


@page analytics
