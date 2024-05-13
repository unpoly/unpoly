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

All code examples assume that a function `trackPageView(url)` is used to track a page view.
The implementation differs between analytics tools. For instance, in Matomo you
would use:

```js
function trackPageView(url) {
  _paq.push(['setCustomUrl', url])
  _paq.push(['trackPageView'])
}
```

### Tracking when the address bar changes

The most straightforward solution is observing the `up:location:changed` event:

```js
// Track initial page load. Your old tracking code may already do this.
trackPageView(location.href)

// Track a visit when the address bar changes.
up.on('up:location:changed', ({ location }) => trackPageView(location))
```

This behavior is close to that of classic tracking codes from tools like Google Analytics.


#### Tracking navigation within overlays

Unpoly lets you render content in [multiple layers](/up.layer). However, not all overlays have [visible history](/up.Layer.prototype.history).
When an overlay without visible history is opened or navigated to a new location, the browser's address bar will not change and no `up:location:changed` event will be emitted.

If you want to track navigation within overlays, observe `up:layer:location:changed` instead: 

```js
// Track initial page load. Your old tracking code may already do this.
trackPageView(location.href)

// Track when a layer changes its location.
// This includes location changes on the root layer. 
up.on('up:layer:location:changed', ({ location }) => trackPageView(location))

// When an overlay opens, track the overlay's initial location.
up.on('up:layer:opened', ({ layer }) => {
  // Don't track overlays that were opened from local string content.
  if (layer.location) {
    trackPageView(layer.location)
  }
})
```


### Tracking updates to major fragments

Instead of observing changes of the browser's address bar, we may track a page view whenever we render a significant
fragment.

For example, we could decide to track a page view whenever an element with a `[track-page-view]` attribute
is rendered:


```html
<main track-page-view>
  ...
</main>
```

We can implement this using a [compiler](/up.compiler):

```js
up.compiler('[track-page-view]', function(element, data, meta) {
  // Don't track duplicate page views if we just reloaded for cache revalidation. 
  if (!meta.revalidating) {
    // Send an event to our web analytics tool.
    trackPageView(meta.layer.location)
  }
})
```

> [important]
> With a compiler you do not need to explicitly track the initial page view.
> The compiler will be called for both the initial page and all subsequent updates.


#### Passing custom dimensions

Using a compiler makes it easy to track custom event properties ("dimensions") along with the page view.
Encode it in an `[up-data]` attribute:

```html
<main track-page-view up-data='{ "course": "ruby-basics", "page": 1 }'> // mark-phrase up-data
  ...
</main>
```

The element's parsed [data object](/data) is passed to your compiler as a second argument. The compiler can
forward the data to the `trackPageView()` function:


```js
up.compiler('[track-page-view]', function(element, data, meta) {
  // Don't track duplicate page views if we just reloaded for cache revalidation. 
  if (!meta.revalidating) {
    // Send an event to our web analytics tool.
    trackPageView(meta.layer.location, data) // mark-phrase "data"
  }
}
```



### Tracking updates to *any* fragment

To track *all* fragment updates, observe the `up:fragment:loaded` event:

```js
// Track initial page load. Your old tracking code may already do this.
trackPageView(location.href)

up.on('up:fragment:loaded', (event) => {
  // Don't track revalidation of cached content. 
  if (!event.revalidating) {
    trackPageView(event.response.url)
  }
})
```

If you find that this listener tracks too many events, you may further filter on the [properties](/up.Request) of [`event.request`](/up:fragment:loaded#event.request).



@page analytics
