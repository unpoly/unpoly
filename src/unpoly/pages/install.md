Installation
============

Unpoly is one JavaScript file and one CSS file that you load in your `<head>`.
It has no dependencies and needs no build step.

Unpoly works with any language and any web framework. Your backend keeps rendering
HTML and needs no additional software. Static sites work, too.


## Loading Unpoly from a CDN {#initialization}

For a quick test drive, load both files from a CDN.
Include them before your own JavaScripts and stylesheets:

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly.css"> <!-- mark-line -->
    <script src="https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly.js" defer></script> <!-- mark-line -->
    <link rel="stylesheet" href="your-styles.css" />
    <script src="your-scripts.js" defer></script>
  </head>
  <body>
    <!-- Use Unpoly attributes in your HTML -->
    <a href="/page" up-follow>Go to page</a> <!-- mark: up-follow -->
  </body>
</html>
```

Unpoly initializes on [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event)
and **enhances the HTML on your page**. This is all you need to use Unpoly attributes,
like the `[up-follow]` link above. Other installation methods, like npm, are explained below.


## Installing from npm {#npm}

To make Unpoly a permanent part of your app, you can install it as an
[npm package](https://www.npmjs.com/package/unpoly):

```nohighlight
npm install unpoly[[=npm_tag]] --save
```

Now import Unpoly before your own JavaScripts and stylesheets:

```js
import 'unpoly/unpoly.js'  // mark-line
import 'unpoly/unpoly.css' // mark-line
import './your-scripts.js'
import './your-styles.css'
```

Your own code then accesses Unpoly's JavaScript API through the `window.up` global,
without an explicit `import`.


## Optional extensions {#extensions}

You now have everything you need to start using Unpoly.
For special needs, there are optional extensions:

- [Server protocol](/server-protocol): Inspect or manipulate Unpoly's rendering through HTTP headers.
- [Legacy browser support](/legacy-browsers): Builds for old browsers and build tools.
- [Bootstrap integration](/bootstrap-integration): Configure Unpoly to use Bootstrap's CSS classes.
- [Upgrade shim](https://unpoly.com/changes/upgrading): Polyfills for deprecated Unpoly APIs.


## Docs for coding agents {#agents}

Coding agents work better with Unpoly when they read its documentation instead of
guessing. Install the docs as an agent skill:

```nohighlight
npx skills add --global https://unpoly.com
```

The [skill page](/skill) has other ways to install the skill, and shows how to use the docs in an AI chat.

@page install
@signature
