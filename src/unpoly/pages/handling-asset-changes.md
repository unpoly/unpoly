Handling changes in frontend code
=================================

When rendering new fragments, Unpoly compares scripts and stylesheets in the `<head>`
and emits an [event](/up:assets:changed) if anything changed.

It is up to your code to [handle new asset versions](#handling-changed-assets),
e.g. by [notifying the user](#notifying-the-user) or [loading new assets](#loading-new-assets).


## Tracking assets

To detect changes in your frontend code, Unpoly must track your application's *assets*.
By default an *asset* is either a script or a stylesheet with a remote source.

In the example document below, the highlighted elements are considered to be *assets*:

```html
<html>
  <head>
    <title>AcmeCorp</title>
    <link rel="stylesheet" href="/assets/frontend-5f3aa101.css"> <!-- mark-line -->
    <script src="/assets/frontend-81ba23a9.js"></script> <!-- mark-line -->
    <script>console.log('loaded!')</script>
    <link rel="canonical" href="https://example.com/dresses/green-dresses">
  </head>
  <body>
    ...
  </body>
</html>
```

Note how the inline `<script>` is not considered an asset by default.
See `[up-asset]` for ways to include or exclude elements for asset tracking.


## Handling new asset versions {#handling-changed-assets}

When [rendering](/up.render), Unpoly compares the current assets on the page with the new assets
from the server response. If the assets don't match, an `up:assets:changed` event is emitted.

**There is no default behavior when assets have changed.**
In particular no asset elements from the response
are updated in the current page. It is up to the developer to observe the `up:assets:changed` event and
implement a behavior that fits their app. 

Below you can find some popular ways to handle new asset versions.


### Notifying the user of new app versions {#notifying-the-user}

A friendly way to handle new asset version is to show a notification banner informing that a new app version is available.
The user can then choose to reload at their convenience, by clicking on the notification:

![Notification for a new app version](images/assets-changed-notification.png){:width='305'}

The code below inserts a clickable `<div id="new-version">` banner when assets change:

@include new-asset-notification-example

> [tip]
> The code snippet uses the `up.element.affix()` function to quickly create a DOM element from a CSS selector.


### Reloading the app at the next opportunity

An invisible way to handle new app versions if to make a full page load when the user follows
the next link. This will unload all scripts and stylesheets, and reload your app from scratch.

```js
let assetsChanged = false

up.on('up:assets:changed', function() {
  assetsChanged = true
})

up.on('up:link:follow', function(event) {
  if (assetsChanged && isLoadPageSafe(event.renderOptions)) {
    // Prevent the render pass
    event.preventDefault()

    // Make full page load without Unpoly
    up.network.loadPage(event.renderOptions)
  }
})

function isLoadPageSafe({ url, layer, method }) {
  // Default to 'GET' and uppercase the method string
  let isSafeRequest = url && up.util.normalizeMethod(method) === 'GET'

   // To prevent any overlays from closing, we only make a full page load
   // when the link is changing the root layer.
  let isRootLayer = up.layer.current.isRoot() && layer !== 'new'

   return isSafeRequest && isRootLayer
}
```


### Loading new assets

The `up:assets:changed` event has `{ oldAssets, newAssets }` properties that you can use to manually
insert the new assets into the page.

The code below will update all `<link rel="stylesheet">` elements whenever there is a change:

```js
function isStylesheet(asset) {
  return asset.matches('link[rel=stylesheet]')
}

up.on('up:assets:changed', function({ oldAssets, newAssets }) {
  let oldStylesheets = up.util.filter(oldAssets, isStylesheet)
  for (let oldStylesheet of oldStylesheets) {
    oldStylesheet.remove()
  }
  
  let newStylesheets = up.util.filter(newAssets, isStylesheet)
  for (let newStylesheet of newStylesheets) {
    document.head.append(newStylesheet)
  }
})
```

Unfortunately updating `<script>` elements in that fashion is not as straightforward.
Scripts cannot be "unloaded" by removing a `<script>` element.
For this reason, script changes are better handled using one of the other techniques demonstrated above.


## Detecting new versions without a user interaction

If you want to detect asset changes without a user interaction, use [polling](/up-poll)
to reload an empty fragment every few minutes.

This will reload an empty fragment `#version-detector` from a URL `/version` every 2 minutes:

```html
<div id="version-detector" up-poll up-interval="120_000" up-source="/version"></div>
```

## Detecting changes in backend code

You can configure Unpoly to also emit the `up:asset:changed` event after a new version of your backend code was deployed.

See [Tracking the backend version](/up-asset#tracking-backend-versions) for details.


@page handling-asset-changes
