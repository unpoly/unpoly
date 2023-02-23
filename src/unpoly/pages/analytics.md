Tracking page views
===================

This page shows how to track page views using web analytics tools like
[Matomo](https://matomo.org/) or [Google Analytics](https://analytics.google.com/).

Web analytics tools usually track a page visit during the initial page load.
When you [follow links with Unpoly](/a-up-follow) your app only has a single page load when the user begins her session.
After that [only fragments are updated](/up.link) within the same page and no additional visits are tracked.
These *in-page navigations* may be missing from your statistics.


## Tracking in-page navigations

Below you find multiple approaches to track in-page navigations. 
Choose and adapt the strategy that fits the amount of data you want to track.

All code examples assume that a function `trackView(url)` is used to track a page view.
The specific statement used differs between analytics tools. For instance, in Matomo you
would use:

```js
_paq.push(['trackPageView'])
```

### Tracking when the address bar changes

The most straightforward solution is observing the `up:location:changed` event:

```js
// Track initial page load. Your old tracking code may already do this.
trackView(location.href)

// Track a visit when the address bar changes.
up.on('up:location:changed', ({ location }) => trackView(location))
```

This behavior is close to that of classic tracking codes from tools like Google Analytics.


### Tracking navigation within overlays

Unpoly lets you render content in [multiple layers](/up.layer). However, not all overlays have [visible history](/up.Layer.prototype.history).
When an overlay without visible history is opened or navigated to a new location, the browser's address bar will not change and no `up:location:changed` event will be emitted.

If you want to track navigation within overlays, observe `up:layer:location:changed` instead: 

```js
// Track initial page load. Your old tracking code may already do this.
trackView(location.href)

// Track when a layer changes its location.
// This includes location changes on the root layer. 
up.on('up:layer:location:changed', ({ location }) => trackView(location))

// When an overlay opens, track the overlay's initial location.
up.on('up:layer:opened', ({ layer }) => {
  // Don't track overlays that were opened from local string content.
  if (layer.location) {
    trackView(layer.location)
  }
})
```


### Tracking every fragment update

[By default](/up.fragment.config#config.autoHistoryTargets) only updates of the [main element](/main) will cause the address bar.
When a minor fragments is updated, the browser location will not change and no `up:location:changed` event will be emitted.

If you want to track *all* fragment updates, observe the `up:fragment:loaded` event instead:

```js
// Track initial page load. Your old tracking code may already do this.
trackView(location.href)

up.on('up:fragment:loaded', (event) => {
  // Don't track revalidation of cached content. 
  if (!event.revalidating) {
    trackView(event.response.url)
  }
})
```

If you find that this listener tracks too many events, you may further filter on the [properties](/up.Request) of [`event.request`](/up:fragment:loaded#event.request).


## Passing custom dimensions

For advanced statistics you may want want to track custom event properties ("dimensions") along with the page view.
One way to do this is to render dimension values into a custom `<meta>` tag that [automatically updates](/up-hungry) with major changes:

```html
<meta name="app:course" value="advanced-ruby" up-hungry up-if-history>
```

If you have complex dimensions you may also encode it as JSON using `[up-data]` and parse it using `up.data()`.


@page analytics
