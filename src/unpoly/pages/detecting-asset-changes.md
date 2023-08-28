Detecting changed frontend code
===============================

When rendering, Unpoly compares scripts and stylesheets in the `<head>` and emits an event if anything changed. 


## Assets

An asset is either a script or a stylesheet with a remote source.

```html
<html>
  <head>
    <link rel="stylesheet" href="/assets/frontend-5f3aa101.css"> <!-- mark-line -->
    <script src="/assets/frontend-81ba23a9.js"></script> <!-- mark-line -->
  </head>
  <body>
    ...
  </body>
</html>
```

Unpoly only tracks assets in the `<head>`. Elements in the `<body>`, inline scripts or internal styles are *not* tracked. 

To exclude an element in the `<head>` from tracking, mark it with an `[up-asset="false"]` attribute.



## Reacting to new app versions

When [rendering](/up.render), Unpoly compares the current assets on the page with the new assets
from the server response. If the assets don't match, Unpoly emits an `up:assets:changed` event.

There is no default behavior when assets have changed. In particular no asset elements from the response
are replaced in the current page. It is up to the developer to observe the `up:assets:changed` event and
implement a behavior that fits their app. 

Below you can find some popular implementations.


### Notifying the user of new app versions

A good way is to show a notification banner informing that a new app version is available.
The user can then choose to reload at their convenience.

```js
up.on('up:assets:changed', function() {
  // If we are already showing a notification, do nothing.
  if (document.querySelector('#new-version')) return
  
  up.element.affix(document.body, '#new-version', {
    text: 'A new app version is available. Click to reload.',
    onclick: 'location.reload()'
  })
})
```

Note that we could `[up-poll]`. Every 2 minutes.

```html
<div id="new-version-detector" up-poll up-interval="120_000"></div>
```


## Updating the app with the next link

An alternative approach is to remember that a new app version, and make a full page load
when the user follows a simple `GET` link:


```js
assetsChanged = false

up.on('up:assets:changed', function() {
  assetsChanged = true
})

up.on('up:link:follow', function(event) {
  let { url, method } = event.renderOptions
  
  if (assetsChanged && url && method === 'GET' && up.layer.current.isRoot()) {
    event.preventDefault()
    up.network.loadPage(url)
  }
})
```




### Appending new assets

The `up:assets:changed` event has `{ oldAssets, newAssets }` properties that you can use to manually
append the new assets from the response.

Also note that JavaScript cannot be unloaded by removing its `<script>` tag. With this approach


The code above does *not* handle assets paths that include a content hash, e.g.

```
/assets/layout-6cf2f53f.css
/assets/chat-c42ce512.js
```


The code below will append new assets to the page `<head>` except if they are already appended.


```js
up.on('up:assets:changed', function({ oldAssets, newAssets }) {
  for (let newAsset of newAssets) {
    if (!isAssetLoaded(oldAssets, newAsset)) {
      document.head.append(newAsset)
    }
  }
})

/*
Returns whether the given `newAsset` has a match in the given `oldAssets` array.

If an existing asset has the same base name, but a different content hash,
it will still be considered loaded.
*/
function isAssetLoaded(oldAssets, newAsset) {
  return oldAssets.find(function(oldAsset) {
    return getPathWithoutHash(oldAsset) === getPathWithoutHash(newAsset)
  })
}

/*
Return the given asset's path with its hash removed, e.g. "app.js" from "app.344af1ca.js"
Different bundlers have different conventions for version hashes.
Some examples we have seen in the wild:

| Bundler    | Path example                                      | Comment                       |
|------------|---------------------------------------------------|-------------------------------|
| Sprockets  | /assets/application-c80fd51cb7fbcc3c0008500a8f.js | dash and lowercase hexdecimal |
| Webpack    | /assets/application-4a83f50652e9f7ac47ed.js       | dash and lowercase hexdecimal |
| esbuild    | /assets/application-C2AU6HVK.js                   | full alphabet but uppercase   |
| Vite       | /assets/chunks/framework.5753e9b0.js              | dot and lowercase hexdcimal   |
| No hash    | /assets/application.js                            |                               |

Note that the id/version separators (like `.` or `-`) are often configurable, but
most examples choose dots or dashes.
*/
function getPathWithoutHash(asset) {
  // It's <script src="app.js"> but <link rel="stylesheet" href="app.css">
  let path = asset.src || asset.href
  const hashedPathPattern = /^(.+)[\.\-]([a-f0-9]+|[A-Z0-9]+)(\.\w+)$/
  let [match, base, hash, extension] = hashedPathPattern.exec(path)
  return match ? (base + extension) : path
}
```

@page detecting-asset-changes
